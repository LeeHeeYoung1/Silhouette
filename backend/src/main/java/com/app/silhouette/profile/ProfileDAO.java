package com.app.silhouette.profile;

import java.util.List;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ProfileDAO {

	private final SqlSessionTemplate mybatis;

	public ProfileDAO(SqlSessionTemplate mybatis) {
		this.mybatis = mybatis;
	}

	// ===================== 회원 / 온보딩 =====================

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

	// ===================== 이상형 =====================

	public int countIdealType(String loginId) {
		return mybatis.selectOne("Profile.countIdealType", loginId);
	}

	public int insertIdealType(IdealTypeDTO dto) {
		return mybatis.insert("Profile.insertIdealType", dto);
	}

	public int updateIdealType(IdealTypeDTO dto) {
		return mybatis.update("Profile.updateIdealType", dto);
	}

	// ===================== 프로필 사진 (회원당 4장) =====================

	// 내 사진 4장 (순서대로)
	public List<ProfileImageDTO> selectProfileImages(Long memberSeq) {
		return mybatis.selectList("Profile.selectProfileImages", memberSeq);
	}

	// 사진 한 장
	public ProfileImageDTO selectProfileImageOne(Long profileImageSeq) {
		return mybatis.selectOne("Profile.selectProfileImageOne", profileImageSeq);
	}

	// 내 사진 전부 삭제
	public int deleteProfileImages(Long memberSeq) {
		return mybatis.delete("Profile.deleteProfileImages", memberSeq);
	}

	// 사진 한 장 저장
	public int insertProfileImage(ProfileImageDTO dto) {
		return mybatis.insert("Profile.insertProfileImage", dto);
	}

	// 사진 한 장 교체 (회원 + 순서)
	public int updateProfileImage(ProfileImageDTO dto) {
		return mybatis.update("Profile.updateProfileImage", dto);
	}
}