package com.app.silhouette.bookmark;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bookmarks")
public class PostBookmarkController {

	private final PostBookmarkService postBookmarkService;

	public PostBookmarkController(PostBookmarkService postBookmarkService) {
		this.postBookmarkService = postBookmarkService;
	}

	// 내가 이 글을 북마크했는지 → { bookmarked }
	@GetMapping("/posts/{postSeq}")
	public Map<String, Object> getStatus(
			@RequestHeader(value = "Authorization", required = false) String authorization,
			@PathVariable("postSeq") Long postSeq) {
		return postBookmarkService.getStatus(authorization, postSeq);
	}

	// 북마크 토글 → { bookmarked }
	@PostMapping("/posts/{postSeq}")
	public Map<String, Object> toggle(
			@RequestHeader(value = "Authorization", required = false) String authorization,
			@PathVariable("postSeq") Long postSeq) {
		return postBookmarkService.toggle(authorization, postSeq);
	}

	// 마이페이지 내 북마크 목록 → { list, totalCount, page, totalPages, size }
	@GetMapping("/me")
	public Map<String, Object> getMyBookmarks(
			@RequestHeader(value = "Authorization", required = false) String authorization,
			@RequestParam(value = "page", defaultValue = "1") int page) {
		return postBookmarkService.getMyBookmarks(authorization, page);
	}
}