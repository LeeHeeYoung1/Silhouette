package com.app.silhouette.profile;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ProfileDAO {

	private final SqlSessionTemplate mybatis;

	public ProfileDAO(SqlSessionTemplate mybatis) {
		this.mybatis = mybatis;
	}

	// 회원 기본 정보 (닉네임, 성별, 만 나이)
	public ProfileDTO selectMemberBasic(String loginId) {
		return mybatis.selectOne("Profile.selectMemberBasic", loginId);
	}
	// 온보딩 완료 여부 (1이면 완료, 0이면 미완료)
	public int countProfile(String loginId) {
		return mybatis.selectOne("Profile.countProfile", loginId);
	}
	
	
	
	// 나의 정보 저장
	public int insertProfile(ProfileDTO dto) {
		return mybatis.insert("Profile.insertProfile", dto);
	}

	// 이상형이 이미 있는지
	public int countIdealType(String loginId) {
		return mybatis.selectOne("Profile.countIdealType", loginId);
	}

	// 이상형 저장
	public int insertIdealType(IdealTypeDTO dto) {
		return mybatis.insert("Profile.insertIdealType", dto);
	}

	// 이상형 수정
	public int updateIdealType(IdealTypeDTO dto) {
		return mybatis.update("Profile.updateIdealType", dto);
	}
}