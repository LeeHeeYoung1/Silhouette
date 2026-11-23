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
	// ✅ boardType: FREE(자유) / ANON(익명), 안 보내면 FREE
	@PostMapping
	public ResponseEntity<?> insertPost(
			@RequestParam(value = "boardType", defaultValue = "FREE") String boardType,
			@RequestParam(value = "category", required = false) String category,
			@RequestParam("title") String title,
			@RequestParam("content") String content,
			@RequestParam("loginId") String loginId,
			@RequestParam(value = "files", required = false) List<MultipartFile> files) throws Exception {

		PostDTO dto = new PostDTO();
		dto.setBoardType(boardType);
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

	// 게시글 목록 (페이징): GET /api/posts?boardType=FREE&category=자유&page=1&size=10
	@GetMapping
	public Map<String, Object> selectPostList(
			@RequestParam(value = "boardType", defaultValue = "FREE") String boardType,   // ✅
			@RequestParam(value = "category", required = false) String category,
			@RequestParam(value = "page", defaultValue = "1") int page,
			@RequestParam(value = "size", defaultValue = "10") int size) {
		return postService.selectPostPage(boardType, category, page, size);
	}

	// 게시글 상세 (조회수 +1): GET /api/posts/37?loginId=
	// ✅ loginId로 '내 글인지(mine)' 계산 (로그인 안 했으면 안 보내도 됨)
	@GetMapping("/{postSeq}")
	public ResponseEntity<?> selectPost(
			@PathVariable("postSeq") Long postSeq,
			@RequestParam(value = "loginId", required = false) String loginId) {
		PostDTO post = postService.selectPost(postSeq, loginId);
		if (post == null) {
			return ResponseEntity.status(404).body("게시글을 찾을 수 없습니다.");
		}
		return ResponseEntity.ok(post);
	}

	// 수정 화면용 기존 글 (본인만, 조회수 안 올림): GET /api/posts/37/edit?loginId=
	@GetMapping("/{postSeq}/edit")
	public PostDTO selectPostForEdit(
			@PathVariable("postSeq") Long postSeq,
			@RequestParam(value = "loginId", required = false) String loginId) {
		return postService.selectPostForEdit(postSeq, loginId);
	}

	// 게시글 수정: PUT /api/posts/37  { loginId, category, title, content }
	@PutMapping("/{postSeq}")
	public ResponseEntity<Void> updatePost(
			@PathVariable("postSeq") Long postSeq,
			@RequestBody PostDTO dto) {
		postService.updatePost(postSeq, dto);
		return ResponseEntity.ok().build();
	}

	// 첨부파일 목록: GET /api/posts/37/files
	@GetMapping("/{postSeq}/files")
	public List<PostFileDTO> selectPostfiles(@PathVariable("postSeq") Long postSeq) {
		return postService.selectPostFiles(postSeq);
	}

	// 첨부파일 다운로드: GET /api/posts/files/5/download?loginId=
	@GetMapping("/files/{postFileSeq}/download")
	public ResponseEntity<byte[]> downloadFile(
			@PathVariable("postFileSeq") Long postFileSeq,
			@RequestParam(value = "loginId", required = false) String loginId) {
		PostFileDTO file = postService.selectPostDownload(postFileSeq, loginId);
		byte[] data = postService.downloadFile(file);
		ContentDisposition disposition = ContentDisposition.attachment()
				.filename(file.getOriginalName(), StandardCharsets.UTF_8)
				.build();
		return ResponseEntity.ok()
				.header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
				.contentType(MediaType.APPLICATION_OCTET_STREAM)
				.body(data);
	}

	// 게시글 삭제: DELETE /api/posts/37?loginId=
	@DeleteMapping("/{postSeq}")
	public ResponseEntity<Void> deletePost(
			@PathVariable("postSeq") Long postSeq,
			@RequestParam(value = "loginId", required = false) String loginId) {
		postService.deletePost(postSeq, loginId);
		return ResponseEntity.ok().build();
	}

	// 추천 여부 + 추천수: GET /api/posts/37/recommend?loginId=
	@GetMapping("/{postSeq}/recommend")
	public Map<String, Object> selectRecommend(
			@PathVariable("postSeq") Long postSeq,
			@RequestParam(value = "loginId", required = false) String loginId) {
		return postService.selectRecommend(postSeq, loginId);
	}

	// 추천 토글 (추천 ↔ 취소): POST /api/posts/37/recommend?loginId=
	@PostMapping("/{postSeq}/recommend")
	public Map<String, Object> toggleRecommend(
			@PathVariable("postSeq") Long postSeq,
			@RequestParam(value = "loginId", required = false) String loginId) {
		return postService.toggleRecommend(postSeq, loginId);
	}
}