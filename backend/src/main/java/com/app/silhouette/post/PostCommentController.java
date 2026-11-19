package com.app.silhouette.post;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/posts/{postSeq}/comments")
public class PostCommentController {

	private final PostCommentService postCommentService;

	public PostCommentController(PostCommentService postCommentService) {
		this.postCommentService = postCommentService;
	}

	// 댓글 등록: POST /api/posts/35/comments  { "loginId": "...", "content": "..." }
	@PostMapping
	public Long insertComment(
			@PathVariable("postSeq") Long postSeq,
			@RequestBody PostCommentDTO dto) {
		return postCommentService.insertComment(postSeq, dto);
	}
}