package com.app.silhouette.admin;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;


@Repository
public class AdminDAO {
	
	private final SqlSessionTemplate mybatis;
	
	public AdminDAO(SqlSessionTemplate mybatis) {
		this.mybatis = mybatis;
	}
	
	public List<AdminMemberDTO> selectAllMembers() {
		return mybatis.selectList("Admin.selectAllMembers");
	}
	
	public int insertBlacklist(AdminMemberDTO adminMemberDto) {
		return mybatis.insert("Admin.insertBlacklist", adminMemberDto);
	}
	
	public int updateMemberStatus(Long memberSeq, String status) {
		Map<String, Object> params = new HashMap<>();
		params.put("memberSeq", memberSeq);
		params.put("status", status);
		return mybatis.update("Admin.updateMemberStatus", params);
	}
	
	public int releaseBlacklist(Long memberSeq) {
		return mybatis.update("Admin.releaseBlacklist", memberSeq);
	}
	
	public int deleteMember(Long memberSeq) {
		return mybatis.delete("Admin.deleteMember", memberSeq);
	}
	
	public List<BannedWordDTO> selectAllBannedWords() {
		return mybatis.selectList("Admin.selectAllBannedWords");
	}
	
	public int insertBannedWord(BannedWordDTO bannedWordDto) {
		return mybatis.insert("Admin.insertBannedWord", bannedWordDto);
	}
	
	public int deleteBannedWord(Long bannedWordSeq) {
		return mybatis.delete("Admin.deleteBannedWord", bannedWordSeq);
	}
	
	public List<PhotoReviewDTO> selectPhotoReviews(String status) {
		return mybatis.selectList("Admin.selectPhotoReviews", status);
	}
	
	public PhotoReviewDTO selectPhotoReviewBySeq(Long photoReviewSeq) {
		return mybatis.selectOne("Admin.selectPhotoReviewBySeq", photoReviewSeq);
	}
	
	public int updatePhotoAiScore(Long photoReviewSeq, double aiScore, String isAiSuspect)  {
		Map<String, Object> params = new HashMap<>();
		params.put("photoReviewSeq", photoReviewSeq);
		params.put("aiScore", aiScore);
		params.put("isAiSuspect", isAiSuspect);
		return mybatis.update("Admin.updatePhotoAiScore", params);
	}
	
	public int updatePhotoReviewDecision(PhotoReviewDTO photoReviewDto) {
		return mybatis.update("Admin.updatePhotoReviewDecision", photoReviewDto);
	}
	
	
	
	
}
