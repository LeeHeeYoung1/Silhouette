package com.app.silhouette.post;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/posts")
public class PostController {

	private final PostService postService;

	public PostController(PostService postService) {
		this.postService = postService;
	}

	// 게시글 등록 (+ 첨부파일): POST /api/posts  (multipart/form-data)
	@PostMapping
	public ResponseEntity<?> insertPost(
	        @RequestParam("category") String category,
	        @RequestParam("title") String title,
	        @RequestParam("content") String content,
	        @RequestParam("loginId") String loginId,
	        @RequestParam(value = "files", required = false) List<MultipartFile> files) throws Exception {

	    PostDTO dto = new PostDTO();
	    dto.setCategory(category);
	    dto.setTitle(title);
	    dto.setContent(content);
	    dto.setLoginId(loginId);

	    Long postSeq = postService.insertPost(dto, files);
	    if (postSeq == null) {
	        return ResponseEntity.status(401).body("회원 정보를 찾을 수 없습니다. 다시 로그인해 주세요.");
	    }
	    return ResponseEntity.ok(postSeq);
	}
}