package com.app.silhouette.post;

import java.nio.charset.StandardCharsets;
import java.util.List;

import org.springframework.http.ContentDisposition;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.google.common.net.HttpHeaders;

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
	@GetMapping
	public List<PostDTO> selectAll(@RequestParam(value="category", required= false) String category){
		return postService.selectAll(category);
	}
	@GetMapping("/{postSeq}")
	public ResponseEntity<?> selectPost(@PathVariable("postSeq") Long postSeq){
		PostDTO post = postService.selectPost(postSeq);
		if(post == null) {
			return ResponseEntity.status(404).body("게시글을 찾을 수 없습니다.");

		}
		return ResponseEntity.ok(post);
	}
	@GetMapping("/{postSeq}/files")
	public List<PostFileDTO> selectPostfiles(@PathVariable("postSeq")Long postSeq){
		return postService.selectPostFiles(postSeq);
	}
	@GetMapping("/files/{postFileSeq}/download")
	public ResponseEntity<byte[]> downloadFile(
			@PathVariable("postFileSeq")Long postFileSeq,
			@RequestParam(value = "loginId", required = false) String loginId){
		PostFileDTO file = postService.selectPostDownload(postFileSeq, loginId);
		byte[] data = postService.downloadFile(file);
		ContentDisposition disposition = ContentDisposition.attachment().filename(file.getOriginalName(), StandardCharsets.UTF_8)
				.build();
		return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
				.contentType(MediaType.APPLICATION_OCTET_STREAM)
				.body(data);
	}
	@DeleteMapping("/{postSeq}")
	public ResponseEntity<Void> deletePost(
			@PathVariable("postSeq") Long postSeq,
			@RequestParam(value = "loginId", required = false) String loginId){
		postService.deletePost(postSeq, loginId);
		return ResponseEntity.ok().build();
	}
			
}