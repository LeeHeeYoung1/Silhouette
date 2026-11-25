package com.app.silhouette.admin;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

	private final AdminService adminService;

	public AdminController(AdminService adminService) {
		this.adminService = adminService;
	}

	@GetMapping("/members")
	public ResponseEntity<?> getMembers(
			@RequestHeader(value = "Authorization", required = false) String authorization) {
		return ResponseEntity.ok(adminService.getMemberList(authorization));
	}

	@PostMapping("/blacklist")
	public ResponseEntity<?> addBlacklist(
			@RequestHeader(value = "Authorization", required = false) String authorization,
			@RequestBody AdminMemberDTO adminMemberDto) {
		adminService.addBlacklist(authorization, adminMemberDto);
		return ResponseEntity.ok(Map.of("success", true, "message", "블랙리스트에 등록되었습니다"));
	}

	@PostMapping("/blacklist/release/{memberSeq}")
	public ResponseEntity<?> releaseBlacklist(
			@RequestHeader(value = "Authorization", required = false) String authorization,
			@PathVariable("memberSeq") Long memberSeq) {
		adminService.releaseBlacklist(authorization, memberSeq);
		return ResponseEntity.ok(Map.of("success", true, "message", "블랙리스트 차단이 해제되었습니다"));
	}

	@DeleteMapping("/members/{memberSeq}")
	public ResponseEntity<?> deleteMember(
			@RequestHeader(value = "Authorization", required = false) String authorization,
			@PathVariable("memberSeq") Long memberSeq) {
		adminService.deleteMember(authorization, memberSeq);
		return ResponseEntity.ok(Map.of("success", true, "message", "회원이 삭제되었습니다"));
	}

	@GetMapping("/banned-words")
	public ResponseEntity<?> getBannedWords(
			@RequestHeader(value = "Authorization", required = false) String authorization) {
		return ResponseEntity.ok(adminService.getBannedWords(authorization));
	}

	@PostMapping("/banned-words")
	public ResponseEntity<?> addBannedWord(
			@RequestHeader(value = "Authorization", required = false) String authorization,
			@RequestBody BannedWordDTO bannedWordDto) {
		adminService.addBannedWord(authorization, bannedWordDto);
		return ResponseEntity.ok(Map.of("success", true, "message", "금칙어가 등록되었습니다"));
	}

	@DeleteMapping("/banned-words/{seq}")
	public ResponseEntity<?> deleteBannedWord(
			@RequestHeader(value = "Authorization", required = false) String authorization,
			@PathVariable("seq") Long seq) {
		adminService.removeBannedWord(authorization, seq);
		return ResponseEntity.ok(Map.of("success", true, "message", "금칙어가 삭제되었습니다"));
	}

	@GetMapping("/photo-reviews")
	public ResponseEntity<?> getPhotoReviews(
			@RequestHeader(value = "Authorization", required = false) String authorization,
			@RequestParam(defaultValue = "ALL") String status) {
		return ResponseEntity.ok(adminService.getPhotoReviews(authorization, status));
	}

	@PostMapping("/photo-reviews/analyze-file")
	public ResponseEntity<?> analyzePhotoFile(
			@RequestHeader(value = "Authorization", required = false) String authorization,
			@RequestParam("file") MultipartFile file) {
		try {
			return ResponseEntity.ok(adminService.analyzePhotoFile(authorization, file));
		} catch (Exception e) {
			return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
		}
	}

	@PostMapping("/photo-reviews/{seq}/ai-check")
	public ResponseEntity<?> recheckPhotoByAi(
			@RequestHeader(value = "Authorization", required = false) String authorization,
			@PathVariable("seq") Long seq) {
		try {
			return ResponseEntity.ok(adminService.recheckPhotoReviewByAi(authorization, seq));
		} catch (Exception e) {
			return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
		}
	}

	@PostMapping("/photo-reviews/decide")
	public ResponseEntity<?> decidePhotoReview(
			@RequestHeader(value = "Authorization", required = false) String authorization,
			@RequestBody PhotoReviewDTO photoReviewDto) {
		adminService.decidePhotoReview(authorization, photoReviewDto);
		return ResponseEntity.ok(Map.of("success", true, "message", "심사 결과가 반영되었습니다."));
	}
}
