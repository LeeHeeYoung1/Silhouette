package com.app.silhouette.profile;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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
}