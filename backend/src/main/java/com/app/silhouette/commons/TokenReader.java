package com.app.silhouette.commons;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import com.auth0.jwt.exceptions.JWTVerificationException;

/* =========================================================
   요청 헤더의 토큰에서 로그인 아이디 꺼내기
   - Authorization: Bearer eyJ... → JwtUtil로 검증 → sub(로그인 아이디)
   - 화면이 보낸 loginId 파라미터는 믿지 않음 (남의 아이디로 요청 방지)
   ========================================================= */
@Component
public class TokenReader {

	private static final String PREFIX = "Bearer ";

	private final JwtUtil jwtUtil;

	public TokenReader(JwtUtil jwtUtil) {
		this.jwtUtil = jwtUtil;
	}

	// 토큰 → 로그인 아이디 (토큰 없음 / 위조 / 만료면 401)
	public String loginId(String authorization) {
		if (authorization == null || !authorization.startsWith(PREFIX)) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
		}
		try {
			String loginId = jwtUtil.verifyToken(authorization.substring(PREFIX.length())).getSubject();
			if (loginId == null || loginId.isBlank()) {
				throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인 정보가 올바르지 않습니다.");
			}
			return loginId;
		} catch (JWTVerificationException e) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 만료되었습니다. 다시 로그인해 주세요.");
		}
	}

	// 토큰이 있으면 아이디, 없으면 null (로그인 안 해도 보는 화면용)
	public String loginIdOrNull(String authorization) {
		if (authorization == null || !authorization.startsWith(PREFIX)) {
			return null;
		}
		try {
			return jwtUtil.verifyToken(authorization.substring(PREFIX.length())).getSubject();
		} catch (JWTVerificationException e) {
			return null;
		}
	}
}