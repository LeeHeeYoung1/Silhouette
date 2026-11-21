package com.app.silhouette.profile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.google.cloud.storage.Blob;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;

@Service
public class ProfileService {

	private static final int PHOTO_COUNT = 4;       // 프로필 사진은 항상 4장

	// 범위 상수 (프론트 onboarding.jsx 상수와 같은 값)
	private static final int HEIGHT_MIN = 100;      // 키 최소 (본인·이상형)
	private static final int HEIGHT_MAX = 250;      // 키 최대
	private static final int WEIGHT_MIN = 30;       // 몸무게 최소
	private static final int WEIGHT_MAX = 200;      // 몸무게 최대
	private static final int IDEAL_AGE_MIN = 14;    // 이상형 나이 최소
	private static final int IDEAL_AGE_MAX = 100;   // 이상형 나이 최대

	private final ProfileDAO profileDAO;
	private final Storage storage;

	@Value("${gcp.bucket}")
	private String bucketName;

	public ProfileService(ProfileDAO profileDAO, Storage storage) {
		this.profileDAO = profileDAO;
		this.storage = storage;
	}

	// ===================== 회원 기본 정보 =====================
	public ProfileDTO selectMemberBasic(String loginId) {
		if (loginId == null || loginId.isBlank()) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인한 회원만 이용할 수 있습니다.");
		}
		ProfileDTO basic = profileDAO.selectMemberBasic(loginId);
		if (basic == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "회원 정보를 찾을 수 없습니다.");
		}
		return basic;
	}

	// ===================== 온보딩 완료 여부 =====================
	public Map<String, Object> selectOnboardingStatus(String loginId) {
		selectMemberBasic(loginId);   // 회원 확인 (없으면 401)
		boolean completed = profileDAO.countProfile(loginId) > 0;
		return Map.of("completed", completed);
	}

	// ===================== 온보딩 저장 =====================
	@Transactional
	public void saveOnboarding(OnboardingDTO dto) {
		String loginId = dto.getLoginId();

		// 1) 회원 확인 + 회원번호·닉네임·성별 얻기 (없으면 401)
		ProfileDTO basic = selectMemberBasic(loginId);
		boolean male = isMale(basic.getGender());

		// 2) 이미 온보딩 했으면 거부
		if (profileDAO.countProfile(loginId) > 0) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 프로필이 등록되어 있습니다.");
		}

		// 2-1) 사진 4장이 먼저 등록되어 있어야 함
		if (profileDAO.selectProfileImages(basic.getMemberSeq()).size() != PHOTO_COUNT) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "프로필 사진 4장을 먼저 등록해 주세요.");
		}

		// 3) 나의 정보 확인 (MEMBER_PROFILE은 전부 필수)
		ProfileDTO p = dto.getProfile();
		if (p == null || p.getHeight() == null || p.getWeight() == null
				|| isBlank(p.getMbti()) || isBlank(p.getJob()) || isBlank(p.getLoveType())
				|| isBlank(p.getDrinking()) || isBlank(p.getSmoking()) || isBlank(p.getReligion())
				|| isBlank(p.getFaceType()) || isBlank(p.getSkinType()) || isBlank(p.getHobby())
				|| isBlank(p.getFavorite()) || isBlank(p.getDislike()) || isBlank(p.getFoodPreference())
				|| isBlank(p.getIntroduction())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "프로필 항목을 모두 입력해 주세요.");
		}

		// ✅ 3-1) 본인 키·몸무게 범위 (몸무게 문구 수정, 띄어쓰기 수정)
		checkRange(p.getHeight(), HEIGHT_MIN, HEIGHT_MAX,
				"키는 " + HEIGHT_MIN + "~" + HEIGHT_MAX + "cm 사이로 입력해 주세요.");
		checkRange(p.getWeight(), WEIGHT_MIN, WEIGHT_MAX,
				"몸무게는 " + WEIGHT_MIN + "~" + WEIGHT_MAX + "kg 사이로 입력해 주세요.");

		// 3-2) 병역: 남성은 필수, 여성은 저장하지 않음
		if (male) {
			if (isBlank(p.getMilitaryStatus())) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "병역 사항을 선택해 주세요.");
			}
		} else {
			p.setMilitaryStatus(null);
		}

		// 4) 서버가 정하는 값 채우고 저장
		p.setMemberSeq(basic.getMemberSeq());
		p.setNickname(basic.getNickname());   // 닉네임은 회원가입 정보 그대로
		profileDAO.insertProfile(p);

		// 5) 이상형은 하나라도 입력했을 때만 저장 (선택)
		IdealTypeDTO ideal = dto.getIdeal();
		if (ideal != null) {
			if (male) {
				ideal.setMilitaryPref(null);   // 이상형 병역은 여성만
			}
			if (ideal.hasAnyValue()) {
				checkIdealRange(ideal);        // ✅ 이상형 나이·키 범위 검사 (저장 전에)
				ideal.setLoginId(loginId);
				if (profileDAO.countIdealType(loginId) > 0) {
					profileDAO.updateIdealType(ideal);
				} else {
					profileDAO.insertIdealType(ideal);
				}
			}
		}
	}

	// ===================== 프로필 사진: 4장 한 번에 등록 (온보딩) =====================
	@Transactional
	public List<ProfileImageDTO> saveProfileImages(String loginId, List<MultipartFile> files) throws IOException {
		ProfileDTO basic = selectMemberBasic(loginId);   // 회원 확인 (401)
		Long memberSeq = basic.getMemberSeq();

		// 1) 정확히 4장인지, 전부 이미지인지
		if (files == null || files.size() != PHOTO_COUNT) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "프로필 사진은 4장을 올려야 합니다.");
		}
		for (MultipartFile file : files) {
			checkImage(file);
		}

		// 2) 기존 사진 정보 (나중에 저장소에서 지우려고 기억)
		List<ProfileImageDTO> oldImages = profileDAO.selectProfileImages(memberSeq);

		// 3) 새 사진 4장 업로드
		List<ProfileImageDTO> newImages = new ArrayList<>();
		try {
			for (int i = 0; i < PHOTO_COUNT; i++) {
				newImages.add(uploadToGcs(files.get(i), memberSeq, i + 1));
			}
		} catch (IOException | RuntimeException e) {
			// 중간에 실패하면 이미 올린 사진은 저장소에서 지움
			for (ProfileImageDTO img : newImages) {
				deleteFromGcs(img.getStoredName());
			}
			throw e;
		}

		// 4) DB: 기존 행 삭제 → 새 4장 저장
		profileDAO.deleteProfileImages(memberSeq);
		for (ProfileImageDTO img : newImages) {
			profileDAO.insertProfileImage(img);
		}

		// 5) 예전 사진 파일은 저장소에서 정리
		for (ProfileImageDTO old : oldImages) {
			deleteFromGcs(old.getStoredName());
		}

		return profileDAO.selectProfileImages(memberSeq);
	}

	// ===================== 프로필 사진: 한 장 교체 (프로필 화면) =====================
	@Transactional
	public ProfileImageDTO replaceProfileImage(String loginId, int sortOrder, MultipartFile file) throws IOException {
		ProfileDTO basic = selectMemberBasic(loginId);   // 회원 확인 (401)
		Long memberSeq = basic.getMemberSeq();

		if (sortOrder < 1 || sortOrder > PHOTO_COUNT) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "사진 순서는 1~4만 가능합니다.");
		}
		checkImage(file);

		// 바꿀 칸의 기존 사진 찾기
		ProfileImageDTO old = null;
		for (ProfileImageDTO img : profileDAO.selectProfileImages(memberSeq)) {
			if (img.getSortOrder() != null && img.getSortOrder() == sortOrder) {
				old = img;
			}
		}
		if (old == null) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "교체할 사진이 없습니다. 먼저 4장을 등록해 주세요.");
		}

		// 새 사진 업로드 → DB 교체 → 예전 파일 정리
		ProfileImageDTO newImage = uploadToGcs(file, memberSeq, sortOrder);
		profileDAO.updateProfileImage(newImage);
		deleteFromGcs(old.getStoredName());

		return profileDAO.selectProfileImageOne(old.getProfileImageSeq());
	}

	// ===================== 프로필 사진: 조회 =====================

	// 내 사진 4장 목록
	public List<ProfileImageDTO> selectProfileImages(String loginId) {
		ProfileDTO basic = selectMemberBasic(loginId);
		return profileDAO.selectProfileImages(basic.getMemberSeq());
	}

	// 사진 한 장 정보 (보여주기용)
	public ProfileImageDTO selectProfileImageOne(Long profileImageSeq) {
		ProfileImageDTO image = profileDAO.selectProfileImageOne(profileImageSeq);
		if (image == null) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "사진을 찾을 수 없습니다.");
		}
		return image;
	}

	// GCS에서 사진 파일 꺼내기
	public byte[] readImageBytes(String storedName) {
		Blob blob = storage.get(BlobId.of(bucketName, storedName));
		if (blob == null) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "저장소에 파일이 없습니다.");
		}
		return blob.getContent();
	}

	// ===================== 도우미 =====================

	// ✅ 숫자 범위 검사 (값이 없으면 통과, 있으면 min~max 안이어야 함)
	private void checkRange(Integer value, int min, int max, String message) {
		if (value != null && (value < min || value > max)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
		}
	}

	// ✅ 이상형 나이·키 범위 + 최소 ≤ 최대
	private void checkIdealRange(IdealTypeDTO ideal) {
		String ageMsg = "이상형 나이는 " + IDEAL_AGE_MIN + "~" + IDEAL_AGE_MAX + "세 사이로 입력해 주세요.";
		String heightMsg = "이상형 키는 " + HEIGHT_MIN + "~" + HEIGHT_MAX + "cm 사이로 입력해 주세요.";

		checkRange(ideal.getAgeMin(), IDEAL_AGE_MIN, IDEAL_AGE_MAX, ageMsg);
		checkRange(ideal.getAgeMax(), IDEAL_AGE_MIN, IDEAL_AGE_MAX, ageMsg);
		checkRange(ideal.getMinHeight(), HEIGHT_MIN, HEIGHT_MAX, heightMsg);
		checkRange(ideal.getMaxHeight(), HEIGHT_MIN, HEIGHT_MAX, heightMsg);

		if (ideal.getAgeMin() != null && ideal.getAgeMax() != null
				&& ideal.getAgeMin() > ideal.getAgeMax()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이상형 나이의 최소값이 최대값보다 클 수 없습니다.");
		}
		if (ideal.getMinHeight() != null && ideal.getMaxHeight() != null
				&& ideal.getMinHeight() > ideal.getMaxHeight()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이상형 키의 최소값이 최대값보다 클 수 없습니다.");
		}
	}

	// 이미지 파일인지 검사
	private void checkImage(MultipartFile file) {
		if (file == null || file.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "빈 사진이 있습니다.");
		}
		String type = file.getContentType();
		if (type == null || !type.startsWith("image/")) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이미지 파일만 올릴 수 있습니다.");
		}
	}

	// GCS 업로드 → DB에 넣을 정보 만들기 (게시판 uploadToGcs와 같은 방식)
	private ProfileImageDTO uploadToGcs(MultipartFile file, Long memberSeq, int sortOrder) throws IOException {
		String originalName = file.getOriginalFilename();
		String storedName = "profile/" + memberSeq + "/" + UUID.randomUUID() + "_" + originalName;

		BlobInfo blobInfo = BlobInfo.newBuilder(bucketName, storedName)
				.setContentType(file.getContentType())
				.build();
		storage.create(blobInfo, file.getBytes());

		ProfileImageDTO dto = new ProfileImageDTO();
		dto.setMemberSeq(memberSeq);
		dto.setOriginalName(originalName);
		dto.setStoredName(storedName);
		dto.setSortOrder(sortOrder);
		return dto;
	}

	// 저장소에서 파일 지우기 (실패해도 서비스는 계속)
	private void deleteFromGcs(String storedName) {
		try {
			storage.delete(BlobId.of(bucketName, storedName));
		} catch (RuntimeException e) {
			// ✅ 예전 파일 정리 실패는 저장 결과에 영향 없음 (System.out.println 제거)
		}
	}

	private boolean isMale(String gender) {
		return "MALE".equals(gender) || "M".equals(gender);
	}

	private boolean isBlank(String s) {
		return s == null || s.isBlank();
	}
}