package com.app.silhouette.profile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

/* =========================================================
   프로필 · 온보딩 API
   ✅ 로그인 아이디는 화면이 보낸 loginId가 아니라 "토큰"에서 꺼냄
      → 남의 아이디를 넣어 요청해도 내 정보만 조회·수정됨
   ========================================================= */
@RestController
@RequestMapping("/api/profile")
public class ProfileController {

	private final ProfileService profileService;

	public ProfileController(ProfileService profileService) {
		this.profileService = profileService;
	}

	// ✅ 토큰에서 로그인 아이디 꺼내기 (토큰 없거나 익명이면 401)
	private String loginId(Authentication auth) {
		if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
		}
		return auth.getName();
	}

	// 회원 기본 정보: GET /api/profile/basic
	@GetMapping("/basic")
	public ProfileDTO selectMemberBasic(Authentication auth) {
		return profileService.selectMemberBasic(loginId(auth));
	}

	// 온보딩 완료 여부: GET /api/profile/status
	@GetMapping("/status")
	public Map<String, Object> selectOnboardingStatus(Authentication auth) {
		return profileService.selectOnboardingStatus(loginId(auth));
	}

	// 온보딩 저장: POST /api/profile  { profile, ideal }
	@PostMapping
	public Map<String, Object> saveOnboarding(@RequestBody OnboardingDTO dto, Authentication auth) {
		dto.setLoginId(loginId(auth));   // ✅ 화면이 보낸 loginId는 덮어씀
		profileService.saveOnboarding(dto);
		return Map.of("completed", true);
	}

	// 내 프로필 전체 조회: GET /api/profile/me
	@GetMapping("/me")
	public Map<String, Object> selectMyProfile(Authentication auth) {
		return profileService.selectMyProfile(loginId(auth));
	}

	// 내 프로필 수정: PUT /api/profile  { profile, ideal }
	@PutMapping
	public Map<String, Object> updateProfile(@RequestBody OnboardingDTO dto, Authentication auth) {
		dto.setLoginId(loginId(auth));   // ✅
		profileService.updateProfile(dto);
		return Map.of("updated", true);
	}

	// ===================== 프로필 사진 (1장) =====================

	// 사진 1장 등록 (온보딩): POST /api/profile/images  (files 1개)
	@PostMapping("/images")
	public List<ProfileImageDTO> uploadImages(
			@RequestParam("files") List<MultipartFile> files,
			Authentication auth) throws IOException {
		return profileService.saveProfileImages(loginId(auth), files);
	}

	// 사진 교체 (프로필 화면): PUT /api/profile/images/1  (file 1개)
	@PutMapping("/images/{sortOrder}")
	public ProfileImageDTO replaceImage(
			@PathVariable("sortOrder") int sortOrder,
			@RequestParam("file") MultipartFile file,
			Authentication auth) throws IOException {
		return profileService.replaceProfileImage(loginId(auth), sortOrder, file);
	}

	// 내 사진 목록: GET /api/profile/images
	@GetMapping("/images")
	public List<ProfileImageDTO> selectImages(Authentication auth) {
		return profileService.selectProfileImages(loginId(auth));
	}

	// 사진 보여주기: GET /api/profile/image/15  (화면은 Client로 blob 요청)
	@GetMapping("/image/{profileImageSeq}")
	public ResponseEntity<byte[]> showImage(@PathVariable("profileImageSeq") Long profileImageSeq) {
		ProfileImageDTO image = profileService.selectProfileImageOne(profileImageSeq);
		byte[] bytes = profileService.readImageBytes(image.getStoredName());

		MediaType type = MediaTypeFactory.getMediaType(image.getOriginalName())
				.orElse(MediaType.IMAGE_JPEG);

		return ResponseEntity.ok().contentType(type).body(bytes);
	}
}