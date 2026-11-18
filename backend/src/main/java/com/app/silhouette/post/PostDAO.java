package com.app.silhouette.post;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
	public List<PostDTO> selectALl(String category){
		Map<String, Object> params = new HashMap<>();
		
		params.put("category", category);
		return mybatis.selectList("Post.selectPostList", params);
	}
}