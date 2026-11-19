package com.app.silhouette.post;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

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

	// 글의 댓글 수 -1 (0 밑으로는 안 내려감)
	public int decreaseCommentCount(Long postSeq) {
		return mybatis.update("PostComment.decreaseCommentCount", postSeq);
	}

	// 댓글을 달 수 있는 글인지 (1이면 가능, 0이면 삭제됐거나 없는 글)
	public int countActivePost(Long postSeq) {
		return mybatis.selectOne("PostComment.countActivePost", postSeq);
	}

	// 글의 댓글 전체 (삭제된 댓글 포함, 트리는 Service에서 만듦)
	public List<PostCommentDTO> selectComment(Long postSeq) {
		return mybatis.selectList("PostComment.selectComments", postSeq);
	}

	// 댓글 하나 (대댓글 등록 시 부모 확인용)
	public PostCommentDTO selectCommentOne(Long postCommentSeq) {
		return mybatis.selectOne("PostComment.selectCommentOne", postCommentSeq);
	}

	// 댓글 수정 (본인 + 삭제 안 된 댓글만, 결과 0이면 수정 불가)
	public int updateComment(Long postSeq, Long postCommentSeq, Long memberSeq, String content) {
		Map<String, Object> params = new HashMap<>();
		params.put("postSeq", postSeq);
		params.put("postCommentSeq", postCommentSeq);
		params.put("memberSeq", memberSeq);
		params.put("content", content);
		return mybatis.update("PostComment.updateComment", params);
	}

	// 댓글 삭제 (소프트 삭제, 결과 0이면 삭제 불가)
	public int deleteComment(Long postSeq, Long postCommentSeq, Long memberSeq) {
		Map<String, Object> params = new HashMap<>();
		params.put("postSeq", postSeq);
		params.put("postCommentSeq", postCommentSeq);
		params.put("memberSeq", memberSeq);
		return mybatis.update("PostComment.deleteComment", params);
	}
}
