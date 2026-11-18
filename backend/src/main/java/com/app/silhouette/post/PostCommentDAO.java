package com.app.silhouette.post;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class PostCommentDAO {

	private final SqlSessionTemplate mybatis;

	public PostCommentDAO(SqlSessionTemplate mybatis) {
		this.mybatis = mybatis;
	}

	// 댓글 등록
	public int insertComment(PostCommentDTO dto) {
		return mybatis.insert("PostComment.insertComment", dto);
	}

	// 글의 댓글 수 +1
	public int increaseCommentCount(Long postSeq) {
		return mybatis.update("PostComment.increaseCommentCount", postSeq);
	}

	// 댓글을 달 수 있는 글인지 (1이면 가능, 0이면 삭제됐거나 없는 글)
	public int countActivePost(Long postSeq) {
		return mybatis.selectOne("PostComment.countActivePost", postSeq);
	}
}