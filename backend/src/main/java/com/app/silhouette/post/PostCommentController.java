package com.app.silhouette.post;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/* =========================================================
   댓글 API
   ✅ 회원 확인은 Authorization 헤더의 토큰으로 (loginId 받지 않음)
   ========================================================= */
@RestController
@RequestMapping("/api/posts/{postSeq}/comments")
public class PostCommentController {

	private static final String AUTH = "Authorization";

	private final PostCommentService postCommentService;

	public PostCommentController(PostCommentService postCommentService) {
		this.postCommentService = postCommentService;
	}

	// 댓글 / 대댓글 등록: POST /api/posts/35/comments
	//   일반 댓글 { "content": "..." } / 대댓글 { "content": "...", "parentPostCommentSeq": 12 }
	@PostMapping
	public Long insertComment(
			@PathVariable("postSeq") Long postSeq,
			@RequestBody PostCommentDTO dto,
			@RequestHeader(value = AUTH, required = false) String authorization) {
		return postCommentService.insertComment(postSeq, dto, authorization);
	}

	// 댓글 목록 (부모 댓글 + replies 안에 대댓글): GET /api/posts/35/comments
	//   토큰이 있으면 mine(내 댓글) 계산
	@GetMapping
	public List<PostCommentDTO> selectCommentAll(
			@PathVariable("postSeq") Long postSeq,
			@RequestHeader(value = AUTH, required = false) String authorization) {
		return postCommentService.selectComments(postSeq, authorization);
	}

	// 댓글 / 대댓글 수정: PUT /api/posts/35/comments/12  { "content": "..." }
	@PutMapping("/{postCommentSeq}")
	public ResponseEntity<Void> updateComment(
			@PathVariable("postSeq") Long postSeq,
			@PathVariable("postCommentSeq") Long postCommentSeq,
			@RequestBody PostCommentDTO dto,
			@RequestHeader(value = AUTH, required = false) String authorization) {
		postCommentService.updateComment(postSeq, postCommentSeq, dto, authorization);
		return ResponseEntity.ok().build();
	}

	// 댓글 / 대댓글 삭제: DELETE /api/posts/35/comments/12
	@DeleteMapping("/{postCommentSeq}")
	public ResponseEntity<Void> deleteComment(
			@PathVariable("postSeq") Long postSeq,
			@PathVariable("postCommentSeq") Long postCommentSeq,
			@RequestHeader(value = AUTH, required = false) String authorization) {
		postCommentService.deleteComment(postSeq, postCommentSeq, authorization);
		return ResponseEntity.ok().build();
	}
}