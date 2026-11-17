package com.app.silhouette.post;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/posts")
public class PostController {
	
	private final PostService postService;
	public PostController(PostService postService) {
		this.postService=postService;
	}

	@PostMapping
	public Long insertPost(@RequestBody PostDTO dto,
			@AuthenticationPrincipal Long memberSeq) {
		dto.setMemberSeq(memberSeq);
		return postService.insertPost(dto);
	}
}
