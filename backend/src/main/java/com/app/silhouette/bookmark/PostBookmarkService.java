package com.app.silhouette.bookmark;

import java.util.List;
import java.util.Map;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.app.silhouette.commons.AuthMemberDTO;
import com.app.silhouette.commons.AuthMemberService;

@Service
public class PostBookmarkService {

	private static final int PAGE_SIZE = 10;   // 마이페이지 한 페이지에 10개

	private final PostBookmarkDAO postBookmarkDAO;
	private final AuthMemberService authMemberService;

	public PostBookmarkService(PostBookmarkDAO postBookmarkDAO, AuthMemberService authMemberService) {
		this.postBookmarkDAO = postBookmarkDAO;
		this.authMemberService = authMemberService;
	}

	// 내가 이 글을 북마크했는지
	public Map<String, Object> getStatus(String authorization, Long postSeq) {
		AuthMemberDTO me = authMemberService.loginMember(authorization);
		boolean bookmarked = postBookmarkDAO.countBookmark(me.getMemberSeq(), postSeq) > 0;
		return Map.of("bookmarked", bookmarked);
	}

	// 북마크 토글 (있으면 취소, 없으면 추가)
	@Transactional
	public Map<String, Object> toggle(String authorization, Long postSeq) {
		AuthMemberDTO me = authMemberService.loginMember(authorization);
		Long memberSeq = me.getMemberSeq();

		// 이미 북마크했으면 → 취소 (삭제된 글이어도 취소는 가능)
		if (postBookmarkDAO.deleteBookmark(memberSeq, postSeq) > 0) {
			return Map.of("bookmarked", false);
		}

		// 새로 북마크 → 삭제 안 된 글만
		if (postBookmarkDAO.countActivePost(postSeq) == 0) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "삭제되었거나 존재하지 않는 게시글입니다.");
		}

		try {
			postBookmarkDAO.insertBookmark(memberSeq, postSeq);
		} catch (DuplicateKeyException e) {
			// 버튼을 빠르게 두 번 눌러 이미 들어간 경우 → 북마크된 상태로 응답
		}
		return Map.of("bookmarked", true);
	}

	// 마이페이지 내 북마크 목록 (삭제된 글 · 블랙리스트 회원 글은 쿼리에서 제외)
	public Map<String, Object> getMyBookmarks(String authorization, int page) {
		AuthMemberDTO me = authMemberService.loginMember(authorization);
		Long memberSeq = me.getMemberSeq();

		int totalCount = postBookmarkDAO.countMyBookmarks(memberSeq);
		int totalPages = Math.max(1, (int) Math.ceil((double) totalCount / PAGE_SIZE));
		int currentPage = Math.min(Math.max(page, 1), totalPages);

		int startRow = (currentPage - 1) * PAGE_SIZE + 1;
		int endRow = currentPage * PAGE_SIZE;

		List<PostBookmarkDTO> list = postBookmarkDAO.selectMyBookmarks(memberSeq, startRow, endRow);

		return Map.of(
				"list", list,
				"totalCount", totalCount,
				"page", currentPage,
				"totalPages", totalPages,
				"size", PAGE_SIZE);
	}
}