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

	// ===================== 회원 =====================

	// 아이디 → 회원번호 (없으면 null)
	public Long selectMemberSeqByLoginId(String loginId) {
		return mybatis.selectOne("Post.selectMemberSeqByLoginId", loginId);
	}

	// ===================== 등록 =====================

	// 게시글 등록 (selectKey로 dto.postSeq에 새 번호가 들어감, boardType도 같이 저장)
	public int insertPost(PostDTO dto) {
		return mybatis.insert("Post.insertPost", dto);
	}

	// 첨부파일 등록
	public int insertPostFile(PostFileDTO dto) {
		return mybatis.insert("Post.insertPostFile", dto);
	}

	// ===================== 목록 (페이징) =====================

	// 조건에 맞는 전체 글 수 (params: boardType, category)
	public int countPostList(Map<String, Object> params) {
		return mybatis.selectOne("Post.countPostList", params);
	}

	// 해당 페이지 글 목록 (params: boardType, category, startRow, endRow)
	public List<PostDTO> selectPostList(Map<String, Object> params) {
		return mybatis.selectList("Post.selectPostList", params);
	}

	// ===================== 상세 =====================

	// 조회수 +1
	public int updateViewCount(Long postSeq) {
		return mybatis.update("Post.updateViewCount", postSeq);
	}

	// 게시글 상세
	public PostDTO selectPost(Long postSeq) {
		return mybatis.selectOne("Post.selectPost", postSeq);
	}

	// 첨부파일 목록
	public List<PostFileDTO> selectPostFiles(Long postSeq) {
		return mybatis.selectList("Post.selectPostFiles", postSeq);
	}

	// 첨부파일 하나 (다운로드)
	public PostFileDTO PostDownLoad(Long postFileSeq) {
		return mybatis.selectOne("Post.selectPostDownload", postFileSeq);
	}

	// ===================== 수정 =====================

	// 수정 화면용 기존 글 (조회수 안 올림, 없으면 null)
	public PostDTO selectPostForEdit(Long postSeq) {
		return mybatis.selectOne("Post.selectPostForEdit", postSeq);
	}

	// 게시글 수정 (결과 0이면 본인 글 아님 또는 삭제된 글)
	public int updatePost(PostDTO dto) {
		return mybatis.update("Post.updatePost", dto);
	}

	// ===================== 삭제 =====================

	// 게시글 삭제 (본인 글만, 결과 0이면 본인 글 아님)
	public int deletePost(Long postSeq, Long memberSeq) {
		Map<String, Object> params = new HashMap<>();
		params.put("postSeq", postSeq);
		params.put("memberSeq", memberSeq);
		return mybatis.update("Post.deletePost", params);
	}

	// ===================== 추천 =====================

	// 내가 추천했는지 (1이면 추천함)
	public int countRecommend(Long postSeq, Long memberSeq) {
		Map<String, Object> params = new HashMap<>();
		params.put("postSeq", postSeq);
		params.put("memberSeq", memberSeq);
		return mybatis.selectOne("Post.countRecommend", params);
	}

	// 추천 기록 추가
	public int insertRecommend(Long postSeq, Long memberSeq) {
		Map<String, Object> params = new HashMap<>();
		params.put("postSeq", postSeq);
		params.put("memberSeq", memberSeq);
		return mybatis.insert("Post.insertRecommend", params);
	}

	// 추천 기록 삭제
	public int deleteRecommend(Long postSeq, Long memberSeq) {
		Map<String, Object> params = new HashMap<>();
		params.put("postSeq", postSeq);
		params.put("memberSeq", memberSeq);
		return mybatis.delete("Post.deleteRecommend", params);
	}

	// 추천수 +1 / -1
	public int updateRecommendCount(Long postSeq, int amount) {
		Map<String, Object> params = new HashMap<>();
		params.put("postSeq", postSeq);
		params.put("amount", amount);
		return mybatis.update("Post.updateRecommendCount", params);
	}

	// 현재 추천수 (삭제됐거나 없는 글이면 null)
	public Integer selectRecommendCount(Long postSeq) {
		return mybatis.selectOne("Post.selectRecommendCount", postSeq);
	}
}