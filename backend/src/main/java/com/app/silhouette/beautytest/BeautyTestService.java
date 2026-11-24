package com.app.silhouette.beautytest;

import java.io.IOException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class BeautyTestService {

	private static final int MAX_PHOTOS = 4;   // 한 번에 올릴 수 있는 최대 사진 수

	// 올릴 수 있는 사진 형식 (아이폰 HEIC 등은 파이썬이 못 열어서 막음)
	private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

	private static final DateTimeFormatter NEXT_FORMAT = DateTimeFormatter.ofPattern("M월 d일 HH:mm");

	@Autowired
	private BeautyTestDAO beautyTestDAO;

	// application.properties의 ai.server.url 값 (http://localhost:8000)
	@Value("${ai.server.url}")
	private String aiServerUrl;

	// 파이썬 서버 호출 도구
	private final RestClient restClient = createRestClient();

	// HTTP/1.1 방식(파이썬이 사진을 빠뜨리지 않게) + 타임아웃(파이썬이 멈춰도 무한정 기다리지 않게)
	private static RestClient createRestClient() {
		SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
		factory.setConnectTimeout(Duration.ofSeconds(3));   // 연결 3초
		factory.setReadTimeout(Duration.ofSeconds(30));     // 응답 30초
		return RestClient.builder().requestFactory(factory).build();
	}

	// 외모 등급 테스트 실행: 주 1회 확인 → 사진 검사 → 파이썬(동일 인물 확인 + 점수) → DB 저장
	public BeautyTestDTO runTest(Long memberSeq, boolean admin, List<MultipartFile> files) {

		// 1. 주 1회 제한 (관리자는 테스트용으로 제한 없음)
		if (!admin) {
			LocalDateTime nextAt = beautyTestDAO.selectNextAvailableAt(memberSeq);
			if (nextAt != null) {
				throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
						"외모 테스트는 일주일에 1번만 할 수 있습니다. 다음 테스트는 " + nextAt.format(NEXT_FORMAT) + "부터 가능합니다.");
			}
		}

		// 2. 빈 칸 빼고 실제로 올린 사진만 모으기
		List<MultipartFile> photos = new ArrayList<>();
		if (files != null) {
			for (MultipartFile f : files) {
				if (f != null && !f.isEmpty()) {
					photos.add(f);
				}
			}
		}
		if (photos.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "사진을 1장 이상 선택해 주세요.");
		}
		if (photos.size() > MAX_PHOTOS) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "사진은 최대 " + MAX_PHOTOS + "장까지 올릴 수 있습니다.");
		}

		// 3. 사진 형식 확인 (AI 서버 호출 전에 걸러내기)
		for (int i = 0; i < photos.size(); i++) {
			String contentType = photos.get(i).getContentType();
			if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase())) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
						(i + 1) + "번째 파일은 올릴 수 없는 형식입니다. jpg, png, webp 사진만 올려 주세요.");
			}
		}

		// 4. 파이썬 서버 1번 호출: 얼굴 검출 → 동일 인물 확인 → 사진별 점수 → 평균·등급
		Map<String, Object> result = callAiServer(photos);

		List<Double> photoScores = new ArrayList<>();
		Object rawScores = result.get("photo_scores");
		if (rawScores instanceof List<?> list) {
			for (Object s : list) {
				photoScores.add(((Number) s).doubleValue());
			}
		}

		// 5. DB 저장 (사진은 저장하지 않고 결과만)
		BeautyTestDTO dto = new BeautyTestDTO();
		dto.setMemberSeq(memberSeq);
		dto.setScore(((Number) result.get("score")).doubleValue());
		dto.setScore100(((Number) result.get("score100")).intValue());
		dto.setGrade((String) result.get("grade"));
		dto.setPhotoCount(((Number) result.get("photo_count")).intValue());
		dto.setPhotoScores(photoScores);

		beautyTestDAO.insertBeautyTest(dto);
		return dto;
	}

	// 테스트 가능 여부 (화면에 들어올 때 먼저 확인용)
	public Map<String, Object> getStatus(Long memberSeq, boolean admin) {
		LocalDateTime nextAt = admin ? null : beautyTestDAO.selectNextAvailableAt(memberSeq);
		Map<String, Object> status = new HashMap<>();
		status.put("canTest", nextAt == null);
		status.put("nextAvailableAt", nextAt);
		status.put("nextAvailableText", nextAt == null ? null : nextAt.format(NEXT_FORMAT));
		return status;
	}

	// 내 테스트 기록 전체
	public List<BeautyTestDTO> getMyTests(Long memberSeq) {
		return beautyTestDAO.selectMyTests(memberSeq);
	}

	// 내 최신 결과 1개 (없으면 null)
	public BeautyTestDTO getLatest(Long memberSeq) {
		return beautyTestDAO.selectLatest(memberSeq);
	}

	// 파이썬 서버 /predict 호출 (사진 여러 장을 multipart로 한 번에 전달)
	private Map<String, Object> callAiServer(List<MultipartFile> photos) {
		MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();

		for (int i = 0; i < photos.size(); i++) {
			MultipartFile file = photos.get(i);
			byte[] bytes;
			try {
				bytes = file.getBytes();
			} catch (IOException e) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, (i + 1) + "번째 사진을 읽을 수 없습니다.");
			}

			// 파일 이름이 있어야 파이썬이 '파일'로 인식함
			String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "photo" + (i + 1) + ".jpg";
			ByteArrayResource resource = new ByteArrayResource(bytes) {
				@Override
				public String getFilename() {
					return fileName;
				}
			};
			body.add("files", resource);   // 파이썬 predict(files: List[UploadFile])의 이름과 같아야 함
		}

		try {
			return restClient.post()
					.uri(aiServerUrl + "/predict")
					.contentType(MediaType.MULTIPART_FORM_DATA)
					.body(body)
					.retrieve()
					.body(new ParameterizedTypeReference<Map<String, Object>>() {});
		} catch (HttpClientErrorException e) {
			// 파이썬이 400으로 보낸 안내 문구({"detail": "2번째 사진에서 얼굴을 찾지 못했습니다..."}) 그대로 전달
			String message = "사진을 분석할 수 없습니다. 다른 사진으로 다시 시도해 주세요.";
			try {
				Map<?, ?> error = e.getResponseBodyAs(Map.class);
				if (error != null && error.get("detail") instanceof String detail) {
					message = detail;
				}
			} catch (Exception ignore) {
				// 문구를 못 꺼내면 기본 문구 사용
			}
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
		} catch (RestClientException e) {
			// 파이썬 서버가 꺼져 있거나, 연결 실패, 30초 넘게 응답 없음
			throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "AI 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
		}
	}
}
