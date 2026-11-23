package com.app.silhouette.post;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.app.silhouette.commons.AuthMemberDTO;
import com.app.silhouette.commons.AuthMemberService;

/* =========================================================
   공지사항 - 담당: 권형석
   - 보기: 누구나 / 작성 · 수정 · 삭제: 관리자(MEMBER.ROLE = ROLE_ADMIN)만
   - 댓글 없음
   ========================================================= */
@Service
public class NoticeService {

	private static final int DEFAULT_PAGE_SIZE = 10;
	private static final int MAX_PAGE_SIZE = 50;
	private static final int MAX_TITLE_CHARS = 60;   // TITLE VARCHAR2(200) 바이트 → 한글 기준 안전하게 60자
	private static final int MAX_CONTENT = 5000;     // 본문 최대 글자 (CLOB)
	private static final List<String> SEARCH_TYPES = List.of("titleContent", "title", "content");
	private static final int MAX_KEYWORD = 50;
	private static final int MAX_WORDS = 5;

	private final NoticeDAO noticeDAO;
	private final AuthMemberService authMemberService;

	public NoticeService(NoticeDAO noticeDAO, AuthMemberService authMemberService) {
		this.noticeDAO = noticeDAO;
		this.authMemberService = authMemberService;
	}

	// ===================== 목록 =====================
	public Map<String, Object> selectNoticePage(String searchType, String keyword, int page, int size) {
		if (size < 1 || size > MAX_PAGE_SIZE) size = DEFAULT_PAGE_SIZE;
		if (page < 1) page = 1;

		String kw = keyword == null ? "" : keyword.trim();
		if (kw.length() > MAX_KEYWORD) kw = kw.substring(0, MAX_KEYWORD);
		String st = (searchType != null && SEARCH_TYPES.contains(searchType)) ? searchType : "titleContent";

		List<String> keywords = kw.isEmpty() ? List.of()
				: Arrays.stream(kw.split("\\s+"))
						.filter(w -> !w.isBlank())
						.distinct()
						.limit(MAX_WORDS)
						.map(this::escapeLike)
						.toList();

		Map<String, Object> params = new HashMap<>();
		params.put("searchType", st);
		params.put("keywords", keywords.isEmpty() ? null : keywords);

		int totalCount = noticeDAO.countNoticeList(params);
		int totalPages = Math.max(1, (int) Math.ceil((double) totalCount / size));
		if (page > totalPages) page = totalPages;

		params.put("startRow", (page - 1) * size + 1);
		params.put("endRow", page * size);

		return Map.of(
				"list", noticeDAO.selectNoticeList(params),
				"totalCount", totalCount,
				"totalPages", totalPages,
				"page", page);
	}

	// ===================== 상세 (조회수 +1) =====================
	@Transactional
	public NoticeDTO selectNotice(Long noticeSeq) {
		noticeDAO.updateNoticeViewCount(noticeSeq);
		NoticeDTO notice = noticeDAO.selectNotice(noticeSeq);
		if (notice == null) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "공지사항을 찾을 수 없습니다.");
		}
		return notice;
	}

	// 수정 화면용 (관리자, 조회수 안 올림)
	public NoticeDTO selectNoticeForEdit(Long noticeSeq, String authorization) {
		authMemberService.adminMember(authorization);   // 401 / 403
		NoticeDTO notice = noticeDAO.selectNotice(noticeSeq);
		if (notice == null) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "공지사항을 찾을 수 없습니다.");
		}
		return notice;
	}

	// ===================== 작성 · 수정 · 삭제 (관리자) =====================
	@Transactional
	public Long insertNotice(NoticeDTO dto, String authorization) {
		AuthMemberDTO admin = authMemberService.adminMember(authorization);
		checkInput(dto);
		dto.setAdminSeq(admin.getMemberSeq());
		noticeDAO.insertNotice(dto);
		return dto.getNoticeSeq();
	}

	@Transactional
	public void updateNotice(Long noticeSeq, NoticeDTO dto, String authorization) {
		AuthMemberDTO admin = authMemberService.adminMember(authorization);
		checkInput(dto);
		dto.setNoticeSeq(noticeSeq);
		dto.setUpdatedBy(admin.getMemberSeq());
		if (noticeDAO.updateNotice(dto) == 0) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "공지사항을 찾을 수 없습니다.");
		}
	}

	@Transactional
	public void deleteNotice(Long noticeSeq, String authorization) {
		AuthMemberDTO admin = authMemberService.adminMember(authorization);
		if (noticeDAO.deleteNotice(noticeSeq, admin.getMemberSeq()) == 0) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "공지사항을 찾을 수 없습니다.");
		}
	}

	// ===================== 도우미 =====================

	// 제목 · 내용 · 고정 여부 검사 후 정리된 값을 다시 넣음
	private void checkInput(NoticeDTO dto) {
		String title = dto.getTitle() == null ? "" : dto.getTitle().trim();
		String content = dto.getContent() == null ? "" : dto.getContent().trim();

		if (title.isEmpty() || title.length() > MAX_TITLE_CHARS) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "제목은 1~" + MAX_TITLE_CHARS + "자로 입력해 주세요.");
		}
		if (content.isEmpty() || content.length() > MAX_CONTENT) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "내용은 1~" + MAX_CONTENT + "자로 입력해 주세요.");
		}

		dto.setTitle(title);
		dto.setContent(content);
		dto.setIsPinned("Y".equals(dto.getIsPinned()) ? "Y" : "N");   // Y가 아니면 전부 N
	}

	// LIKE 특수문자를 글자 그대로 검색 (mapper escape '\'와 짝)
	private String escapeLike(String s) {
		return s.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
	}
}