package com.app.silhouette.post;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class PostDAO {

	private final SqlSessionTemplate mybatis;
	public PostDAO(SqlSessionTemplate mybatis) {
		this.mybatis=mybatis;
	}
	
	public int insertPost(PostDTO dto) {
		return mybatis.insert("Post.insertPost", dto);
	}
	
}
