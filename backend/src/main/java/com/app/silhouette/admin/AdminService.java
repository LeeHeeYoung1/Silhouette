package com.app.silhouette.admin;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.app.silhouette.blind.BlindChatService;
import com.app.silhouette.commons.AuthMemberService;
import com.app.silhouette.profile.ProfileDAO;
import com.app.silhouette.profile.ProfileImageDTO;
import com.app.silhouette.profile.ProfileService;

@Service
public class AdminService {

	private final AdminDAO adminDao;
	private final SightEngineService sightEngineService;
	private final AuthMemberService authMemberService;
	private final ProfileDAO profileDao;
	private final ProfileService profileService;
	private final BlindChatService blindChatService;

	public AdminService(AdminDAO adminDao, SightEngineService sightEngineService, AuthMemberService authMemberService, ProfileDAO profileDao, ProfileService profileService, BlindChatService blindChatService) {
		this.adminDao = adminDao;
		this.sightEngineService = sightEngineService;
		this.authMemberService = authMemberService;
		this.profileDao = profileDao;
		this.profileService = profileService;
		this.blindChatService = blindChatService;
	}

	@Transactional(readOnly = true)
	public List<AdminMemberDTO> getMemberList(String authorization) {
		authMemberService.adminMember(authorization);
		return adminDao.selectAllMembers();
	}

	@Transactional
	public void addBlacklist(String authorization, AdminMemberDTO adminMemberDto) {
		com.app.silhouette.commons.AuthMemberDTO admin = authMemberService.adminMember(authorization);
		if (admin != null) {
			adminMemberDto.setAdminSeq(admin.getMemberSeq());
		}
		adminDao.insertBlacklist(adminMemberDto);
		adminDao.updateMemberStatus(adminMemberDto.getMemberSeq(), "SUSPENDED");
	}

	@Transactional
	public void releaseBlacklist(String authorization, Long memberSeq) {
		com.app.silhouette.commons.AuthMemberDTO admin = authMemberService.adminMember(authorization);
		Long adminSeq = admin != null ? admin.getMemberSeq() : null;
		adminDao.releaseBlacklist(memberSeq, adminSeq);
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
		if (words == null || words.isEmpty()) return content;
		String filtered = content;
		for (BannedWordDTO bw : words) {
			if ("Y".equals(bw.getUseYn()) && bw.getWord() != null && !bw.getWord().isBlank()) {
				String replacement = (bw.getReplacement() != null && !bw.getReplacement().isBlank())
						? bw.getReplacement() : "***";

				// 공백 또는 특수문자(., _, -, ~ 등)를 섞어 우회하는 입력 방지
				String trimmedWord = bw.getWord().trim();
				String[] chars = trimmedWord.split("");
				List<String> quotedChars = new ArrayList<>();
				for (String ch : chars) {
					if (!ch.isEmpty()) {
						quotedChars.add(Pattern.quote(ch));
					}
				}
				if (!quotedChars.isEmpty()) {
					String flexibleRegex = String.join("[\\s._~-]*", quotedChars);
					filtered = filtered.replaceAll("(?i)" + flexibleRegex, Matcher.quoteReplacement(replacement));
				}
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

		double aiScore = 0.0;
		if (photo.getMemberSeq() != null) {
			Long imgSeq = null;
			if (photo.getPhotoUrl() != null && photo.getPhotoUrl().contains("/image/")) {
				try {
					String seqPart = photo.getPhotoUrl().substring(photo.getPhotoUrl().lastIndexOf("/") + 1);
					imgSeq = Long.parseLong(seqPart);
				} catch (Exception ignored) {}
			}
			ProfileImageDTO targetImage = null;
			if (imgSeq != null) {
				try {
					targetImage = profileService.selectProfileImageOne(imgSeq);
				} catch (Exception ignored) {}
			}
			if (targetImage == null) {
				List<ProfileImageDTO> images = profileDao.selectProfileImages(photo.getMemberSeq());
				if (images != null && !images.isEmpty()) {
					targetImage = images.get(0);
				}
			}
			if (targetImage != null) {
				byte[] imageBytes = profileService.readImageBytes(targetImage.getStoredName());
				aiScore = sightEngineService.detectAiGeneratedScore(imageBytes, targetImage.getOriginalName());
			}
		}

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

		// 심사 승인/반려 시 해당 회원의 PROFILE_IMAGE 상태도 함께 동기화
		PhotoReviewDTO photo = adminDao.selectPhotoReviewBySeq(photoReviewDto.getPhotoReviewSeq());
		if (photo != null && photo.getMemberSeq() != null) {
			adminDao.updateProfileImageStatus(photo.getMemberSeq(), photoReviewDto.getStatus());
		}
	}

	public BlindConfigDTO getBlindConfig(String authorization) {
		authMemberService.adminMember(authorization);
		return new BlindConfigDTO(blindChatService.getTimeLimitMin(), blindChatService.getVoteSeconds());
	}

	public BlindConfigDTO updateBlindConfig(String authorization, BlindConfigDTO dto) {
		authMemberService.adminMember(authorization);
		if (dto.getTimeLimitMin() <= 0 || dto.getVoteSeconds() <= 0) {
			throw new IllegalArgumentException("제한 시간과 투표 시간은 1 이상이어야 합니다.");
		}
		blindChatService.setTimeLimitMin(dto.getTimeLimitMin());
		blindChatService.setVoteSeconds(dto.getVoteSeconds());
		return new BlindConfigDTO(blindChatService.getTimeLimitMin(), blindChatService.getVoteSeconds());
	}
}
