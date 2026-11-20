package com.app.silhouette.post;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/posts/{postSeq}/comments")
public class PostCommentController {

	private final PostCommentService postCommentService;

	public PostCommentController(PostCommentService postCommentService) {
		this.postCommentService = postCommentService;
	}

	// 댓글 / 대댓글 등록: POST /api/posts/35/comments
	//   일반 댓글 { "loginId": "...", "content": "..." }
	//   대댓글   { "loginId": "...", "content": "...", "parentPostCommentSeq": 12 }
	@PostMapping
	public Long insertComment(
			@PathVariable("postSeq") Long postSeq,
			@RequestBody PostCommentDTO dto) {
		return postCommentService.insertComment(postSeq, dto);
	}

	// 댓글 목록 (부모 댓글 + replies 안에 대댓글): GET /api/posts/35/comments
	@GetMapping
	public List<PostCommentDTO> selectCommentAll(@PathVariable("postSeq") Long postSeq) {
		return postCommentService.selectComments(postSeq);
	}

	// 댓글 / 대댓글 수정: PUT /api/posts/35/comments/12  { "loginId": "...", "content": "..." }
	@PutMapping("/{postCommentSeq}")
	public ResponseEntity<Void> updateComment(
			@PathVariable("postSeq") Long postSeq,
			@PathVariable("postCommentSeq") Long postCommentSeq,
			@RequestBody PostCommentDTO dto) {
		postCommentService.updateComment(postSeq, postCommentSeq, dto);
		return ResponseEntity.ok().build();
	}

	// 댓글 / 대댓글 삭제: DELETE /api/posts/35/comments/12?loginId=...
	@DeleteMapping("/{postCommentSeq}")
	public ResponseEntity<Void> deleteComment(
			@PathVariable("postSeq") Long postSeq,
			@PathVariable("postCommentSeq") Long postCommentSeq,
			@RequestParam(value = "loginId", required = false) String loginId) {
		postCommentService.deleteComment(postSeq, postCommentSeq, loginId);
		return ResponseEntity.ok().build();
	}
}
