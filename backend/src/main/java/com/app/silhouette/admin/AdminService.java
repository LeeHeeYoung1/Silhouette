package com.app.silhouette.admin;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.app.silhouette.commons.AuthMemberService;

@Service
public class AdminService {

	private final AdminDAO adminDao;
	private final SightEngineService sightEngineService;
	private final AuthMemberService authMemberService;

	public AdminService(AdminDAO adminDao, SightEngineService sightEngineService, AuthMemberService authMemberService) {
		this.adminDao = adminDao;
		this.sightEngineService = sightEngineService;
		this.authMemberService = authMemberService;
	}

	@Transactional(readOnly = true)
	public List<AdminMemberDTO> getMemberList(String authorization) {
		authMemberService.adminMember(authorization);
		return adminDao.selectAllMembers();
	}

	@Transactional
	public void addBlacklist(String authorization, AdminMemberDTO adminMemberDto) {
		authMemberService.adminMember(authorization);
		adminDao.insertBlacklist(adminMemberDto);
		adminDao.updateMemberStatus(adminMemberDto.getMemberSeq(), "SUSPENDED");
	}

	@Transactional
	public void releaseBlacklist(String authorization, Long memberSeq) {
		authMemberService.adminMember(authorization);
		adminDao.releaseBlacklist(memberSeq);
		adminDao.updateMemberStatus(memberSeq, "ACTIVE");
	}

	@Transactional
	public void deleteMember(String authorization, Long memberSeq) {
		authMemberService.adminMember(authorization);
		adminDao.deleteMember(memberSeq);
	}

	@Transactional(readOnly = true)
	public List<BannedWordDTO> getBannedWords(String authorization) {
		authMemberService.adminMember(authorization);
		return adminDao.selectAllBannedWords();
	}

	@Transactional
	public void addBannedWord(String authorization, BannedWordDTO bannedWordDto) {
		authMemberService.adminMember(authorization);
		adminDao.insertBannedWord(bannedWordDto);
	}

	@Transactional
	public void removeBannedWord(String authorization, Long bannedWordSeq) {
		authMemberService.adminMember(authorization);
		adminDao.deleteBannedWord(bannedWordSeq);
	}

	@Transactional(readOnly = true)
	public String filterText(String content) {
		if (content == null || content.isBlank()) return content;
		List<BannedWordDTO> words = adminDao.selectAllBannedWords();
		String filtered = content;
		for (BannedWordDTO bw : words) {
			if ("Y".equals(bw.getUseYn()) && bw.getWord() != null) {
				filtered = filtered.replace(bw.getWord(), bw.getReplacement());
			}
		}
		return filtered;
	}

	@Transactional
	public List<PhotoReviewDTO> getPhotoReviews(String authorization, String status) {
		authMemberService.adminMember(authorization);
		return adminDao.selectPhotoReviews(status);
	}

	@Transactional
	public Map<String, Object> analyzePhotoFile(String authorization, MultipartFile file) {
		authMemberService.adminMember(authorization);
		double aiScore = sightEngineService.detectAiGeneratedScore(file);
		boolean isAiSuspect = aiScore >= 70.0;

		Map<String, Object> result = new HashMap<>();
		result.put("aiScore", aiScore);
		result.put("isAiSuspect", isAiSuspect);
		result.put("verdict", isAiSuspect ? "AI 생성 의심 사진 (반려 권장)" : "실제 인물 사진 정상 범위");
		return result;
	}

	@Transactional
	public PhotoReviewDTO recheckPhotoReviewByAi(String authorization, Long photoReviewSeq) {
		authMemberService.adminMember(authorization);
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
	public void decidePhotoReview(String authorization, PhotoReviewDTO photoReviewDto) {
		authMemberService.adminMember(authorization);
		adminDao.updatePhotoReviewDecision(photoReviewDto);
	}
}
