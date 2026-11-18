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
	public int updateViewCount(Long postSeq) {
		return mybatis.update("Post.updateViewCount", postSeq);
	}
	public PostDTO selectPost(Long postSeq) {
		return mybatis.selectOne("Post.selectPost", postSeq);
	}
	public List<PostFileDTO> selectPostFiles(Long postSeq) {
		return mybatis.selectList("Post.selectPostFiles", postSeq);
	}
	public PostFileDTO PostDownLoad(Long postFileSeq) {
		return mybatis.selectOne("Post.selectPostDownload", postFileSeq);
	}
	public int deletePost(Long postSeq, Long memberSeq) {
		Map<String, Object> params = new HashMap<>();
		params.put("postSeq", postSeq);
		params.put("memberSeq", memberSeq);
		return mybatis.update("Post.deletePost",params);
	}
	
	public int countRecommend(Long postSeq, Long memberSeq) {
		Map<String, Object> params = new HashMap<>();
		params.put("postSeq", postSeq);
		params.put("memberSeq", memberSeq);
		return mybatis.selectOne("Post.countRecommend", params);
	}

	public int insertRecommend(Long postSeq, Long memberSeq) {
		Map<String, Object> params = new HashMap<>();
		params.put("postSeq", postSeq);
		params.put("memberSeq", memberSeq);
		return mybatis.insert("Post.insertRecommend", params);
	}

	public int deleteRecommend(Long postSeq, Long memberSeq) {
		Map<String, Object> params = new HashMap<>();
		params.put("postSeq", postSeq);
		params.put("memberSeq", memberSeq);
		return mybatis.delete("Post.deleteRecommend", params);
	}
	public Integer selectRecommendCount(Long postSeq) {
	    return mybatis.selectOne("Post.selectRecommendCount", postSeq);
	}
	public int updateRecommendCount(Long postSeq, int amount) {
		Map<String, Object> params = new HashMap<>();
		params.put("postSeq", postSeq);
		params.put("amount", amount);
		return mybatis.update("Post.updateRecommendCount", params);
	}
}