package com.app.silhouette.commons;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/* =========================================================
   토큰 → 로그인 회원 → 관리자 확인 (게시판 공통)
   - 토큰 role은 전부 guest라서 관리자는 DB MEMBER.ROLE로 확인
   ========================================================= */
@Service
public class AuthMemberService {

	private final TokenReader tokenReader;
	private final AuthMemberDAO authMemberDAO;

	public AuthMemberService(TokenReader tokenReader, AuthMemberDAO authMemberDAO) {
		this.tokenReader = tokenReader;
		this.authMemberDAO = authMemberDAO;
	}

	// 로그인 필수: 토큰 → 회원 (토큰 없음/만료/탈퇴 회원이면 401)
	public AuthMemberDTO loginMember(String authorization) {
		String loginId = tokenReader.loginId(authorization);
		AuthMemberDTO member = authMemberDAO.selectAuthMember(loginId);
		if (member == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "회원 정보를 찾을 수 없습니다.");
		}
		return member;
	}

	// 로그인 선택: 토큰 있으면 회원, 없으면 null (누구나 보는 화면용)
	public AuthMemberDTO loginMemberOrNull(String authorization) {
		String loginId = tokenReader.loginIdOrNull(authorization);
		return loginId == null ? null : authMemberDAO.selectAuthMember(loginId);
	}

	// 관리자 필수: 관리자가 아니면 403
	public AuthMemberDTO adminMember(String authorization) {
		AuthMemberDTO member = loginMember(authorization);
		if (!member.isAdmin()) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "관리자만 이용할 수 있습니다.");
		}
		return member;
	}
}