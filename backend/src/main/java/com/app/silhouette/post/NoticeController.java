package com.app.silhouette.post;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/* =========================================================
   공지사항 API
   - 목록 · 상세: 누구나
   - 수정 화면 조회 · 작성 · 수정 · 삭제: 관리자 (Authorization 토큰 → MEMBER.ROLE)
   ========================================================= */
@RestController
@RequestMapping("/api/notices")
public class NoticeController {

	private static final String AUTH = "Authorization";

	private final NoticeService noticeService;

	public NoticeController(NoticeService noticeService) {
		this.noticeService = noticeService;
	}

	// 목록: GET /api/notices?searchType=titleContent&keyword=점검&page=1&size=10
	@GetMapping
	public Map<String, Object> selectNoticeList(
			@RequestParam(value = "searchType", required = false) String searchType,
			@RequestParam(value = "keyword", required = false) String keyword,
			@RequestParam(value = "page", defaultValue = "1") int page,
			@RequestParam(value = "size", defaultValue = "10") int size) {
		return noticeService.selectNoticePage(searchType, keyword, page, size);
	}

	// 상세 (조회수 +1): GET /api/notices/3
	@GetMapping("/{noticeSeq}")
	public NoticeDTO selectNotice(@PathVariable("noticeSeq") Long noticeSeq) {
		return noticeService.selectNotice(noticeSeq);
	}

	// 수정 화면용 (관리자, 조회수 X): GET /api/notices/3/edit
	@GetMapping("/{noticeSeq}/edit")
	public NoticeDTO selectNoticeForEdit(
			@PathVariable("noticeSeq") Long noticeSeq,
			@RequestHeader(value = AUTH, required = false) String authorization) {
		return noticeService.selectNoticeForEdit(noticeSeq, authorization);
	}

	// 작성 (관리자): POST /api/notices  { title, content, isPinned: "Y"/"N" }
	@PostMapping
	public Map<String, Object> insertNotice(
			@RequestBody NoticeDTO dto,
			@RequestHeader(value = AUTH, required = false) String authorization) {
		Long noticeSeq = noticeService.insertNotice(dto, authorization);
		return Map.of("noticeSeq", noticeSeq);
	}

	// 수정 (관리자): PUT /api/notices/3  { title, content, isPinned }
	@PutMapping("/{noticeSeq}")
	public ResponseEntity<Void> updateNotice(
			@PathVariable("noticeSeq") Long noticeSeq,
			@RequestBody NoticeDTO dto,
			@RequestHeader(value = AUTH, required = false) String authorization) {
		noticeService.updateNotice(noticeSeq, dto, authorization);
		return ResponseEntity.ok().build();
	}

	// 삭제 (관리자, 소프트): DELETE /api/notices/3
	@DeleteMapping("/{noticeSeq}")
	public ResponseEntity<Void> deleteNotice(
			@PathVariable("noticeSeq") Long noticeSeq,
			@RequestHeader(value = AUTH, required = false) String authorization) {
		noticeService.deleteNotice(noticeSeq, authorization);
		return ResponseEntity.ok().build();
	}
}