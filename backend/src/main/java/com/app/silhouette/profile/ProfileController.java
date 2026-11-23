package com.app.silhouette.profile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

	private final ProfileService profileService;

	public ProfileController(ProfileService profileService) {
		this.profileService = profileService;
	}

	// 회원 기본 정보: GET /api/profile/basic?loginId=...
	@GetMapping("/basic")
	public ProfileDTO selectMemberBasic(
			@RequestParam(value = "loginId", required = false) String loginId) {
		return profileService.selectMemberBasic(loginId);
	}

	// 온보딩 완료 여부: GET /api/profile/status?loginId=...
	@GetMapping("/status")
	public Map<String, Object> selectOnboardingStatus(
			@RequestParam(value = "loginId", required = false) String loginId) {
		return profileService.selectOnboardingStatus(loginId);
	}

	// 온보딩 저장: POST /api/profile
	@PostMapping
	public Map<String, Object> saveOnboarding(@RequestBody OnboardingDTO dto) {
		profileService.saveOnboarding(dto);
		return Map.of("completed", true);
	}

	// ✅ 내 프로필 전체 조회 (프로필 화면): GET /api/profile/me?loginId=...
	//    { basic, profile, ideal, images } / 온보딩 안 했으면 404
	@GetMapping("/me")
	public Map<String, Object> selectMyProfile(
			@RequestParam(value = "loginId", required = false) String loginId) {
		return profileService.selectMyProfile(loginId);
	}

	// ✅ 내 프로필 수정 (프로필 화면): PUT /api/profile  { loginId, profile, ideal }
	@PutMapping
	public Map<String, Object> updateProfile(@RequestBody OnboardingDTO dto) {
		profileService.updateProfile(dto);
		return Map.of("updated", true);
	}

	// ===================== 프로필 사진 (1장) =====================

	// 사진 1장 등록 (온보딩): POST /api/profile/images  (files 1개)
	@PostMapping("/images")
	public List<ProfileImageDTO> uploadImages(
			@RequestParam("loginId") String loginId,
			@RequestParam("files") List<MultipartFile> files) throws IOException {
		return profileService.saveProfileImages(loginId, files);
	}

	// 사진 교체 (프로필 화면): PUT /api/profile/images/1  (file 1개)
	@PutMapping("/images/{sortOrder}")
	public ProfileImageDTO replaceImage(
			@PathVariable("sortOrder") int sortOrder,
			@RequestParam("loginId") String loginId,
			@RequestParam("file") MultipartFile file) throws IOException {
		return profileService.replaceProfileImage(loginId, sortOrder, file);
	}

	// 내 사진 목록: GET /api/profile/images?loginId=...
	@GetMapping("/images")
	public List<ProfileImageDTO> selectImages(
			@RequestParam(value = "loginId", required = false) String loginId) {
		return profileService.selectProfileImages(loginId);
	}

	// 사진 보여주기: GET /api/profile/image/15  (<img src="..."> 용)
	@GetMapping("/image/{profileImageSeq}")
	public ResponseEntity<byte[]> showImage(@PathVariable("profileImageSeq") Long profileImageSeq) {
		ProfileImageDTO image = profileService.selectProfileImageOne(profileImageSeq);
		byte[] bytes = profileService.readImageBytes(image.getStoredName());

		MediaType type = MediaTypeFactory.getMediaType(image.getOriginalName())
				.orElse(MediaType.IMAGE_JPEG);

		return ResponseEntity.ok().contentType(type).body(bytes);
	}
}