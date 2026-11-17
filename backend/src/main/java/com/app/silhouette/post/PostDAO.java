package com.app.silhouette.post;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class PostDAO {

	private final SqlSessionTemplate mybatis;

	public PostDAO(SqlSessionTemplate mybatis) {
		this.mybatis = mybatis;
	}

	public Long selectMemberSeqByLoginId(String loginId) {
		return mybatis.selectOne("Post.selectMemberSeqByLoginId", loginId);
	}

	public int insertPost(PostDTO dto) {
		return mybatis.insert("Post.insertPost", dto);
	}
	public int insertPostFile(PostFileDTO fileDto) {
		return mybatis.insert("Post.insertPostFile", fileDto);
	}
}