package com.app.silhouette.admin;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;


@Service
public class AdminService {
	
	private final AdminDAO adminDao;
	private final SightEngineService sightEngineService;
 	
	public AdminService (AdminDAO adminDao, SightEngineService sightEngineService) {
		this.adminDao = adminDao;
		this.sightEngineService = sightEngineService;
	}
	
	@Transactional(readOnly = true)
	public List<AdminMemberDTO> getMemberList() {
		return adminDao.selectAllMembers();
	}
	
	@Transactional
	public void addBlacklist(AdminMemberDTO adminMemberDto) {
		adminDao.insertBlacklist(adminMemberDto);
		adminDao.updateMemberStatus(adminMemberDto.getMemberSeq(), "SUSPENDED");
	}
	
	@Transactional
	public void releaseBlacklist(Long memberSeq) {
		adminDao.releaseBlacklist(memberSeq);
		adminDao.updateMemberStatus(memberSeq, "ACTIVE");
	}
	
	@Transactional
	public void deleteMember(Long memberSeq) {
		adminDao.deleteMember(memberSeq);
	}
	
	@Transactional(readOnly = true)
	public List<BannedWordDTO> getBannedWords() {
		return adminDao.selectAllBannedWords();
	}
	
	@Transactional
	public void addBannedWord(BannedWordDTO bannedWordDto) {
		adminDao.insertBannedWord(bannedWordDto);
	}
	
	@Transactional
	public void removeBannedWord(Long bannedWordSeq) {
		adminDao.deleteBannedWord(bannedWordSeq);
	}
	
	@Transactional(readOnly = true)
	public String filterText(String content) {
		if(content == null || content.isBlank()) return content;
		List<BannedWordDTO> words = adminDao.selectAllBannedWords();
		String filtered = content;
		for (BannedWordDTO bw : words) {
			if("Y".equals(bw.getUseYn()) && bw.getWord() != null) {
				filtered = filtered.replace(bw.getWord(), bw.getReplacement());
			}
		}
		return filtered;
	}
	
	@Transactional
	public List<PhotoReviewDTO> getPhotoReviews(String status) {
		return adminDao.selectPhotoReviews(status);
	}
	
	@Transactional
	public Map<String, Object> analyzePhotoFile(MultipartFile file) {
		double aiScore = sightEngineService.detectAiGeneratedScore(file);
		boolean isAiSuspect = aiScore >= 70.0;
		
		Map<String, Object> result = new HashMap<>();
		result.put("aiScore", aiScore);
		result.put("isAiSuspect", isAiSuspect);
		result.put("verdict", isAiSuspect ? "AI 생성 의심 사진 (반려 권장)" : "실제 인물 사진 정상 범위");
		return result;
	}
	
	@Transactional
	public PhotoReviewDTO recheckPhotoReviewByAi (Long photoReviewSeq) {
		PhotoReviewDTO photo = adminDao.selectPhotoReviewBySeq(photoReviewSeq);
		if (photo == null) {
			throw new IllegalArgumentException("존재하지 않는 심사 대상 사진입니다");
		}
		double aiScore = sightEngineService.detectAiGeneratedScoreByUrl(photo.getPhotoUrl());
		String isAiSuspect = aiScore >= 70.0 ? "Y" : "N";
		
		adminDao.updatePhotoAiScore(photoReviewSeq, aiScore, isAiSuspect);
		photo.setAiScore(aiScore);
		photo.setIsAiSuspect(isAiSuspect);
		return photo;
	}
	
	@Transactional
	public void decidePhotoReview(PhotoReviewDTO photoReviewDto) {
		adminDao.updatePhotoReviewDecision(photoReviewDto);
	}
	
	
	
	
	
	
}
