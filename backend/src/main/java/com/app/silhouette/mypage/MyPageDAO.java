package com.app.silhouette.mypage;

import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class MyPageDAO {

	private final SqlSessionTemplate mybatis;

	public MyPageDAO(SqlSessionTemplate mybatis) {
		this.mybatis = mybatis;
	}

	public MyPageDTO selectMyInfo(Long memberSeq) {
		return mybatis.selectOne("MyPage.selectMyInfo", memberSeq);
	}

	public int countNickname(Long memberSeq, String nickname) {
		return mybatis.selectOne("MyPage.countNickname", Map.of("memberSeq", memberSeq, "nickname", nickname));
	}

	public int updateMyInfo(MyPageDTO dto) {
		return mybatis.update("MyPage.updateMyInfo", dto);
	}

	public int checkPassword(Long memberSeq, String encryptedPassword) {
		return mybatis.selectOne("MyPage.checkPassword", Map.of("memberSeq", memberSeq, "password", encryptedPassword));
	}

	public int withdrawMember(Long memberSeq) {
		return mybatis.update("MyPage.withdrawMember", memberSeq);
	}
}