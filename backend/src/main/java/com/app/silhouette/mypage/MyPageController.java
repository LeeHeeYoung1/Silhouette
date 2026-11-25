package com.app.silhouette.mypage;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mypage")
public class MyPageController {

	private final MyPageService myPageService;

	public MyPageController(MyPageService myPageService) {
		this.myPageService = myPageService;
	}

	// 내 기본 정보
	@GetMapping("/me")
	public MyPageDTO getMyInfo(
			@RequestHeader(value = "Authorization", required = false) String authorization) {
		return myPageService.getMyInfo(authorization);
	}

	// 닉네임 중복 확인 → { available: true/false }
	@GetMapping("/nickname-check")
	public ResponseEntity<?> checkNickname(
			@RequestHeader(value = "Authorization", required = false) String authorization,
			@RequestParam("nickname") String nickname) {
		try {
			return ResponseEntity.ok(myPageService.checkNickname(authorization, nickname));
		} catch (IllegalArgumentException e) {
			return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
		}
	}

	// 기본 정보 수정 → 바뀐 정보
	@PutMapping("/me")
	public ResponseEntity<?> updateMyInfo(
			@RequestHeader(value = "Authorization", required = false) String authorization,
			@RequestBody MyPageDTO input) {
		try {
			return ResponseEntity.ok(myPageService.updateMyInfo(authorization, input));
		} catch (IllegalArgumentException e) {
			return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));   // 400 형식 오류
		} catch (IllegalStateException e) {
			return ResponseEntity.status(409).body(Map.of("message", e.getMessage()));    // 409 닉네임 중복
		}
	}
}