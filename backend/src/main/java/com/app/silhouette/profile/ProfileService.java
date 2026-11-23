package com.app.silhouette.profile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
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

	private static final int PHOTO_COUNT = 1;       // ✅ 프로필 사진은 무조건 1장
	private static final String GCS_FOLDER = "profile_image/";   // ✅ GCS 폴더 (팀 규칙)

	// 범위 상수 (프론트 onboarding.jsx · profile.jsx 상수와 같은 값)
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

		// 2-1) ✅ 사진 1장이 먼저 등록되어 있어야 함
		if (profileDAO.selectProfileImages(basic.getMemberSeq()).size() != PHOTO_COUNT) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "프로필 사진을 먼저 등록해 주세요.");
		}

		// 3) ✅ 나의 정보 검사 (수정과 같은 함수)
		ProfileDTO p = dto.getProfile();
		checkProfile(p, male);

		// 4) 서버가 정하는 값 채우고 저장
		p.setMemberSeq(basic.getMemberSeq());
		p.setNickname(basic.getNickname());   // 닉네임은 회원가입 정보 그대로
		profileDAO.insertProfile(p);

		// 5) ✅ 이상형 저장 (수정과 같은 함수)
		saveIdeal(loginId, dto.getIdeal(), male);
	}

	// ===================== ✅ 내 프로필 조회 (프로필 화면) =====================
	// { basic: {nickname, gender, age}, profile, ideal(없으면 null), images }
	public Map<String, Object> selectMyProfile(String loginId) {
		ProfileDTO basic = selectMemberBasic(loginId);   // 401

		ProfileDTO profile = profileDAO.selectProfileByMember(basic.getMemberSeq());
		if (profile == null) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "온보딩을 먼저 완료해 주세요.");
		}

		// 기본 정보는 화면에 필요한 것만 (회원번호·아이디는 안 보냄)
		Map<String, Object> basicInfo = new HashMap<>();
		basicInfo.put("nickname", basic.getNickname());
		basicInfo.put("gender", basic.getGender());
		basicInfo.put("age", basic.getAge());

		// ideal은 null일 수 있어서 Map.of 대신 HashMap
		Map<String, Object> result = new HashMap<>();
		result.put("basic", basicInfo);
		result.put("profile", profile);
		result.put("ideal", profileDAO.selectIdealType(loginId));
		result.put("images", profileDAO.selectProfileImages(basic.getMemberSeq()));
		return result;
	}

	// ===================== ✅ 내 프로필 수정 (프로필 화면) =====================
	@Transactional
	public void updateProfile(OnboardingDTO dto) {
		String loginId = dto.getLoginId();

		// 1) 회원 확인 (401) + 온보딩 했는지 (404)
		ProfileDTO basic = selectMemberBasic(loginId);
		boolean male = isMale(basic.getGender());
		if (profileDAO.countProfile(loginId) == 0) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "온보딩을 먼저 완료해 주세요.");
		}

		// 2) 나의 정보 검사 (온보딩과 같은 규칙)
		ProfileDTO p = dto.getProfile();
		checkProfile(p, male);

		// 3) 수정 (닉네임은 바꾸지 않음)
		p.setMemberSeq(basic.getMemberSeq());
		profileDAO.updateProfile(p);

		// 4) 이상형: 값이 있으면 저장/수정, 다 비웠으면 삭제
		saveIdeal(loginId, dto.getIdeal(), male);
	}

	// ===================== 프로필 사진: 1장 등록 (온보딩) =====================
	@Transactional
	public List<ProfileImageDTO> saveProfileImages(String loginId, List<MultipartFile> files) throws IOException {
		ProfileDTO basic = selectMemberBasic(loginId);   // 회원 확인 (401)
		Long memberSeq = basic.getMemberSeq();

		// 1) ✅ 정확히 1장인지, 이미지인지
		if (files == null || files.size() != PHOTO_COUNT) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "프로필 사진은 1장을 올려야 합니다.");
		}
		for (MultipartFile file : files) {
			checkImage(file);
		}

		// 2) 기존 사진 정보 (나중에 저장소에서 지우려고 기억)
		List<ProfileImageDTO> oldImages = profileDAO.selectProfileImages(memberSeq);

		// 3) 새 사진 업로드
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

		// 4) DB: 기존 행 삭제 → 새 사진 저장
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

	
	// ===================== 프로필 사진: 교체 (프로필 화면) =====================
	// 사진이 1장뿐이라 "몇 번째 사진 찾기" 없이
	// 기존 사진(옛날 4장, SORT_ORDER가 NULL인 사진 포함)을 전부 지우고 새 1장으로 바꿈
	// → 사진이 없던 계정도 그대로 등록됨, 새 사진은 profile_image/ 폴더로
	@Transactional
	public ProfileImageDTO replaceProfileImage(String loginId, int sortOrder, MultipartFile file) throws IOException {
		if (sortOrder != PHOTO_COUNT) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "사진 번호는 1만 가능합니다.");
		}
		if (profileDAO.countProfile(loginId) == 0) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "온보딩을 먼저 완료해 주세요.");
		}

		List<ProfileImageDTO> saved = saveProfileImages(loginId, List.of(file));
		return saved.isEmpty() ? null : saved.get(0);
	}
	// ===================== 프로필 사진: 조회 =====================

	// 내 사진 목록
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

	// ✅ 나의 정보 검사 (온보딩 · 수정 공용)
	private void checkProfile(ProfileDTO p, boolean male) {
		// 전부 필수
		if (p == null || p.getHeight() == null || p.getWeight() == null
				|| isBlank(p.getMbti()) || isBlank(p.getJob()) || isBlank(p.getLoveType())
				|| isBlank(p.getDrinking()) || isBlank(p.getSmoking()) || isBlank(p.getReligion())
				|| isBlank(p.getFaceType()) || isBlank(p.getSkinType()) || isBlank(p.getHobby())
				|| isBlank(p.getFavorite()) || isBlank(p.getDislike()) || isBlank(p.getFoodPreference())
				|| isBlank(p.getIntroduction())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "프로필 항목을 모두 입력해 주세요.");
		}

		// 키 · 몸무게 범위
		checkRange(p.getHeight(), HEIGHT_MIN, HEIGHT_MAX,
				"키는 " + HEIGHT_MIN + "~" + HEIGHT_MAX + "cm 사이로 입력해 주세요.");
		checkRange(p.getWeight(), WEIGHT_MIN, WEIGHT_MAX,
				"몸무게는 " + WEIGHT_MIN + "~" + WEIGHT_MAX + "kg 사이로 입력해 주세요.");

		// 병역: 남성은 필수, 여성은 저장하지 않음
		if (male) {
			if (isBlank(p.getMilitaryStatus())) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "병역 사항을 선택해 주세요.");
			}
		} else {
			p.setMilitaryStatus(null);
		}
	}

	// ✅ 이상형 저장 (온보딩 · 수정 공용)
	//    값이 하나라도 있으면 저장/수정, 다 비웠으면 삭제
	private void saveIdeal(String loginId, IdealTypeDTO ideal, boolean male) {
		if (ideal != null && male) {
			ideal.setMilitaryPref(null);   // 이상형 병역은 여성만
		}

		if (ideal != null && ideal.hasAnyValue()) {
			checkIdealRange(ideal);        // 이상형 나이·키 범위 검사 (저장 전에)
			ideal.setLoginId(loginId);
			if (profileDAO.countIdealType(loginId) > 0) {
				profileDAO.updateIdealType(ideal);
			} else {
				profileDAO.insertIdealType(ideal);
			}
		} else {
			profileDAO.deleteIdealType(loginId);   // 없으면 0건 삭제라 온보딩에도 안전
		}
	}

	// 숫자 범위 검사 (값이 없으면 통과, 있으면 min~max 안이어야 함)
	private void checkRange(Integer value, int min, int max, String message) {
		if (value != null && (value < min || value > max)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
		}
	}

	// 이상형 나이·키 범위 + 최소 ≤ 최대
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

	// GCS 업로드 → DB에 넣을 정보 만들기
	private ProfileImageDTO uploadToGcs(MultipartFile file, Long memberSeq, int sortOrder) throws IOException {
		String originalName = file.getOriginalFilename();
		// ✅ profile_image/{회원번호}/UUID_파일명
		String storedName = GCS_FOLDER + memberSeq + "/" + UUID.randomUUID() + "_" + originalName;

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
			// 예전 파일 정리 실패는 저장 결과에 영향 없음
		}
	}

	private boolean isMale(String gender) {
		return "MALE".equals(gender) || "M".equals(gender);
	}

	private boolean isBlank(String s) {
		return s == null || s.isBlank();
	}
}