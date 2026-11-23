package com.app.silhouette.commons;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class AuthMemberDAO {

	private final SqlSessionTemplate mybatis;

	public AuthMemberDAO(SqlSessionTemplate mybatis) {
		this.mybatis = mybatis;
	}

	// 로그인 아이디 → 회원 권한 정보 (없으면 null)
	public AuthMemberDTO selectAuthMember(String loginId) {
		return mybatis.selectOne("AuthMember.selectAuthMember", loginId);
	}
}