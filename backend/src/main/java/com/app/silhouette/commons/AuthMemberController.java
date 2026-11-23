package com.app.silhouette.commons;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/members")
public class AuthMemberController {

	private final AuthMemberService authMemberService;

	public AuthMemberController(AuthMemberService authMemberService) {
		this.authMemberService = authMemberService;
	}
	

	// 내 권한: GET /api/members/me/role → { "admin": true/false }
	@GetMapping("/me/role")
	public Map<String, Object> selectMyRole(
			@RequestHeader(value = "Authorization", required = false) String authorization) {
		AuthMemberDTO member = authMemberService.loginMember(authorization);
		return Map.of("admin", member.isAdmin());
	}
}