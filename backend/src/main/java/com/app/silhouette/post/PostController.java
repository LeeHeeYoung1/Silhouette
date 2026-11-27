package com.app.silhouette.post;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import org.springframework.http.ContentDisposition;
import org.springframework.http.MediaType;
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
import org.springframework.web.multipart.MultipartFile;

import com.google.common.net.HttpHeaders;

/* =========================================================
   게시글 API
   ✅ 회원 확인은 Authorization 헤더의 토큰으로 (loginId 파라미터는 받지 않음)
   ========================================================= */
@RestController
@RequestMapping("/api/posts")
public class PostController {

	private static final String AUTH = "Authorization";

	private final PostService postService;

	public PostController(PostService postService) {
		this.postService = postService;
	}

	// 게시글 등록 (+ 첨부파일): POST /api/posts  (multipart/form-data)
	@PostMapping
	public ResponseEntity<Long> insertPost(
			@RequestParam(value = "boardType", defaultValue = "FREE") String boardType,
			@RequestParam(value = "category", required = false) String category,
			@RequestParam("title") String title,
			@RequestParam("content") String content,
			@RequestParam(value = "files", required = false) List<MultipartFile> files,
			@RequestHeader(value = AUTH, required = false) String authorization) throws Exception {

		PostDTO dto = new PostDTO();
		dto.setBoardType(boardType);
		dto.setCategory(category);
		dto.setTitle(title);
		dto.setContent(content);

		return ResponseEntity.ok(postService.insertPost(dto, files, authorization));
	}

	// 게시글 목록 (페이징 + 검색)
	@GetMapping
	public Map<String, Object> selectPostList(
			@RequestParam(value = "boardType", defaultValue = "FREE") String boardType,
			@RequestParam(value = "category", required = false) String category,
			@RequestParam(value = "searchType", required = false) String searchType,
			@RequestParam(value = "keyword", required = false) String keyword,
			@RequestParam(value = "page", defaultValue = "1") int page,
			@RequestParam(value = "size", defaultValue = "10") int size) {
		return postService.selectPostPage(boardType, category, searchType, keyword, page, size);
	}

	// 게시글 상세 (조회수 +1): GET /api/posts/37  (토큰이 있으면 mine 계산)
	@GetMapping("/{postSeq}")
	public ResponseEntity<?> selectPost(
			@PathVariable("postSeq") Long postSeq,
			@RequestHeader(value = AUTH, required = false) String authorization) {
		PostDTO post = postService.selectPost(postSeq, authorization);
		if (post == null) {
			return ResponseEntity.status(404).body("게시글을 찾을 수 없습니다.");
		}
		return ResponseEntity.ok(post);
	}

	// 수정 화면용 기존 글 (본인만): GET /api/posts/37/edit
	@GetMapping("/{postSeq}/edit")
	public PostDTO selectPostForEdit(
			@PathVariable("postSeq") Long postSeq,
			@RequestHeader(value = AUTH, required = false) String authorization) {
		return postService.selectPostForEdit(postSeq, authorization);
	}

	// 게시글 수정: PUT /api/posts/37  { category, title, content }
	@PutMapping("/{postSeq}")
	public ResponseEntity<Void> updatePost(
			@PathVariable("postSeq") Long postSeq,
			@RequestBody PostDTO dto,
			@RequestHeader(value = AUTH, required = false) String authorization) {
		postService.updatePost(postSeq, dto, authorization);
		return ResponseEntity.ok().build();
	}

	// 첨부파일 목록: GET /api/posts/37/files
	@GetMapping("/{postSeq}/files")
	public List<PostFileDTO> selectPostfiles(@PathVariable("postSeq") Long postSeq) {
		return postService.selectPostFiles(postSeq);
	}

	// 첨부파일 다운로드 (로그인 회원만): GET /api/posts/files/5/download
	@GetMapping("/files/{postFileSeq}/download")
	public ResponseEntity<byte[]> downloadFile(
			@PathVariable("postFileSeq") Long postFileSeq,
			@RequestHeader(value = AUTH, required = false) String authorization) {
		PostFileDTO file = postService.selectPostDownload(postFileSeq, authorization);
		byte[] data = postService.downloadFile(file);
		ContentDisposition disposition = ContentDisposition.attachment()
				.filename(file.getOriginalName(), StandardCharsets.UTF_8)
				.build();
		return ResponseEntity.ok()
				.header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
				.header("X-Content-Type-Options", "nosniff")
				.contentType(MediaType.APPLICATION_OCTET_STREAM)
				.body(data);
	}

	// 게시글 삭제 (본인만): DELETE /api/posts/37
	@DeleteMapping("/{postSeq}")
	public ResponseEntity<Void> deletePost(
			@PathVariable("postSeq") Long postSeq,
			@RequestHeader(value = AUTH, required = false) String authorization) {
		postService.deletePost(postSeq, authorization);
		return ResponseEntity.ok().build();
	}

	// 추천 여부 + 추천수: GET /api/posts/37/recommend
	@GetMapping("/{postSeq}/recommend")
	public Map<String, Object> selectRecommend(
			@PathVariable("postSeq") Long postSeq,
			@RequestHeader(value = AUTH, required = false) String authorization) {
		return postService.selectRecommend(postSeq, authorization);
	}

	// 추천 토글 (추천 ↔ 취소): POST /api/posts/37/recommend
	@PostMapping("/{postSeq}/recommend")
	public Map<String, Object> toggleRecommend(
			@PathVariable("postSeq") Long postSeq,
			@RequestHeader(value = AUTH, required = false) String authorization) {
		return postService.toggleRecommend(postSeq, authorization);
	}
}