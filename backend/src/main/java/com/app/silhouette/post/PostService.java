package com.app.silhouette.post;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.app.silhouette.admin.AdminService;

import com.google.cloud.storage.Blob;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;

@Service
public class PostService {

	private static final int MAX_FILES = 6;
	private static final int DEFAULT_PAGE_SIZE = 10;   // 한 페이지 글 수 기본값
	private static final int MAX_PAGE_SIZE = 50;       // 한 번에 너무 많이 못 가져가게
	private static final int MAX_TITLE = 100;          // 제목 최대 글자 (화면과 같음)
	private static final int MAX_CONTENT = 3000;       // 본문 최대 글자 (화면과 같음)

	// 게시판 구분 (DB BOARD_TYPE 값)
	private static final String BOARD_FREE = "FREE";
	private static final String BOARD_ANON = "ANON";
	// 자유게시판 카테고리 ('익명'은 익명게시판으로 분리돼서 빠짐)
	private static final List<String> FREE_CATEGORIES = List.of("자유", "연애고민", "데이트후기");
	// 익명게시판 글의 카테고리 (항상 고정)
	private static final String ANON_CATEGORY = "익명";

	// ✅ 검색 (titleContent = 제목+내용, 기본값)
	private static final List<String> SEARCH_TYPES = List.of("titleContent", "title", "content", "author");
	private static final int MAX_KEYWORD = 50;   // 검색어 최대 글자
	private static final int MAX_WORDS = 5;      // 단어 최대 개수

	private final PostDAO postDAO;
	private final Storage storage;     // GCSConfig에서 만든 Bean
	private final AdminService adminService;

	@Value("${gcp.bucket}")
	private String bucket;

	public PostService(PostDAO postDAO, Storage storage, AdminService adminService) {
		this.postDAO = postDAO;
		this.storage = storage;
		this.adminService = adminService;
	}

	// ===================== 등록 =====================

	// 게시글 등록 + 첨부파일 저장 (회원이 없으면 null 반환)
	@Transactional
	public Long insertPost(PostDTO dto, List<MultipartFile> files) throws Exception {
		// ① 회원 확인
		Long memberSeq = postDAO.selectMemberSeqByLoginId(dto.getLoginId());
		if (memberSeq == null) {
			return null;
		}

		// ② 게시판 · 카테고리 · 제목 · 내용 검사
		String boardType = checkBoardType(dto.getBoardType());
		dto.setBoardType(boardType);
		checkPostInput(dto, boardType);

		// 금칙어 필터링 적용
		dto.setTitle(adminService.filterText(dto.getTitle()));
		dto.setContent(adminService.filterText(dto.getContent()));

		if (files != null && files.size() > MAX_FILES) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "첨부파일은 최대 " + MAX_FILES + "개입니다.");
		}

		// ③ 게시글 저장 → dto.postSeq에 새 글 번호
		dto.setMemberSeq(memberSeq);
		postDAO.insertPost(dto);

		// ④ 첨부파일 저장
		if (files != null) {
			int order = 1;
			for (MultipartFile file : files) {
				if (file.isEmpty()) continue;
				postDAO.insertPostFile(uploadToGcs(file, dto.getPostSeq(), order++));
			}
		}
		return dto.getPostSeq();
	}

	// GCS 버킷에 업로드하고 POST_FILE 정보를 만들어 돌려줌
	private PostFileDTO uploadToGcs(MultipartFile file, Long postSeq, int order) throws Exception {
		String originalName = file.getOriginalFilename();
		String storedName = "post/" + postSeq + "/" + UUID.randomUUID() + "_" + originalName;

		BlobInfo blobInfo = BlobInfo.newBuilder(bucket, storedName)
				.setContentType(file.getContentType())
				.build();
		storage.create(blobInfo, file.getBytes());

		PostFileDTO fileDto = new PostFileDTO();
		fileDto.setPostSeq(postSeq);
		fileDto.setOriginalName(originalName);
		fileDto.setStoredName(storedName);
		fileDto.setFilePath("https://storage.googleapis.com/" + bucket + "/" + storedName);
		fileDto.setFileSize(file.getSize());
		fileDto.setFileType(file.getContentType() != null && file.getContentType().startsWith("image/") ? "IMAGE" : "FILE");
		fileDto.setSortOrder(order);
		return fileDto;
	}

	// ===================== 목록 (페이징 + 검색) =====================

	// ✅ 해당 게시판 · 페이지 글 + 전체 글 수 + 전체 페이지 수 (검색 포함)
	public Map<String, Object> selectPostPage(String boardType, String category,
			String searchType, String keyword, int page, int size) {
		if (size < 1 || size > MAX_PAGE_SIZE) size = DEFAULT_PAGE_SIZE;
		if (page < 1) page = 1;

		String type = checkBoardType(boardType);   // FREE / ANON

		// 검색어 정리 (앞뒤 공백 제거, 최대 50자)
		String kw = keyword == null ? "" : keyword.trim();
		if (kw.length() > MAX_KEYWORD) kw = kw.substring(0, MAX_KEYWORD);

		// 검색 종류 (모르는 값이면 제목+내용)
		String st = (searchType != null && SEARCH_TYPES.contains(searchType)) ? searchType : "titleContent";

		// 익명게시판은 작성자 검색 금지 (누가 썼는지 알아낼 수 있어서)
		if (BOARD_ANON.equals(type) && "author".equals(st) && !kw.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "익명게시판은 작성자 검색을 할 수 없습니다.");
		}

		// 띄어쓰기로 단어 나누기 → 중복 제거 → 최대 5개 → 특수문자 처리
		List<String> keywords = kw.isEmpty() ? List.of()
				: Arrays.stream(kw.split("\\s+"))
						.filter(w -> !w.isBlank())
						.distinct()
						.limit(MAX_WORDS)
						.map(this::escapeLike)
						.toList();

		Map<String, Object> params = new HashMap<>();
		params.put("boardType", type);
		params.put("category", BOARD_ANON.equals(type) ? null : category);   // 카테고리는 자유게시판만
		params.put("searchType", st);
		params.put("keywords", keywords.isEmpty() ? null : keywords);

		int totalCount = postDAO.countPostList(params);
		int totalPages = Math.max(1, (int) Math.ceil((double) totalCount / size));
		if (page > totalPages) page = totalPages;

		params.put("startRow", (page - 1) * size + 1);
		params.put("endRow", page * size);

		List<PostDTO> list = postDAO.selectPostList(params);

		return Map.of(
				"list", list,
				"totalCount", totalCount,
				"totalPages", totalPages,
				"page", page);
	}

	// ✅ LIKE 특수문자(%, _, \)를 글자 그대로 검색되게 바꿈 (mapper의 escape '\'와 짝)
	private String escapeLike(String s) {
		return s.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
	}

	// ===================== 상세 =====================

	// 게시글 상세 (조회수 +1, 내 글인지 계산, 익명 글은 작성자 정보 지움)
	@Transactional
	public PostDTO selectPost(Long postSeq, String loginId) {
		postDAO.updateViewCount(postSeq);
		PostDTO post = postDAO.selectPost(postSeq);
		if (post == null) {
			return null;
		}

		// 보는 사람의 회원번호 (로그인 안 했으면 null)
		Long viewerSeq = (loginId == null || loginId.isBlank())
				? null
				: postDAO.selectMemberSeqByLoginId(loginId);
		post.setMine(viewerSeq != null && viewerSeq.equals(post.getMemberSeq()));

		// 익명 글은 아이디 · 회원번호를 화면에 안 보냄 (F12 Network에서도 안 보이게)
		if (BOARD_ANON.equals(post.getBoardType())) {
			post.setLoginId(null);
			post.setMemberSeq(null);
		}
		return post;
	}

	public List<PostFileDTO> selectPostFiles(Long postSeq) {
		return postDAO.selectPostFiles(postSeq);
	}

	public PostFileDTO selectPostDownload(Long postFileSeq, String loginId) {
		checkMember(loginId);
		PostFileDTO file = postDAO.PostDownLoad(postFileSeq);
		if (file == null) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "파일을 찾을 수 없습니다.");
		}
		return file;
	}

	// GCS에서 파일 내용 꺼내기
	public byte[] downloadFile(PostFileDTO file) {
		String objectName = file.getStoredName();
		Blob blob = storage.get(BlobId.of(bucket, objectName));
		if (blob == null) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "저장소에 파일이 없습니다.");
		}
		return blob.getContent();
	}

	// 회원 확인 (JWT 완성 전 임시: loginId로 확인)
	private void checkMember(String loginId) {
		if (loginId == null || loginId.isBlank()
				|| postDAO.selectMemberSeqByLoginId(loginId) == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인한 회원만 다운로드할 수 있습니다.");
		}
	}

	// ===================== 수정 =====================

	// 수정 화면용 기존 글 (본인 글만, 조회수 안 올림)
	public PostDTO selectPostForEdit(Long postSeq, String loginId) {
		Long memberSeq = getLoginMemberSeq(loginId);     // 로그인 확인 (401)
		return getMyPost(postSeq, memberSeq);           // 있는지(404) + 본인 글인지(403)
	}

	// 게시글 수정 (카테고리·제목·내용, 게시판은 못 바꿈)
	@Transactional
	public void updatePost(Long postSeq, PostDTO dto) {
		// 1) 로그인 + 본인 글 확인
		Long memberSeq = getLoginMemberSeq(dto.getLoginId());
		PostDTO saved = getMyPost(postSeq, memberSeq);

		// 2) 원래 게시판 기준으로 입력값 검사 (익명 글이면 카테고리 '익명' 고정)
		checkPostInput(dto, saved.getBoardType());

		// 금칙어 필터링 적용
		dto.setTitle(adminService.filterText(dto.getTitle()));
		dto.setContent(adminService.filterText(dto.getContent()));

		// 3) 서버가 정하는 값 채우고 수정
		dto.setPostSeq(postSeq);
		dto.setMemberSeq(memberSeq);

		if (postDAO.updatePost(dto) == 0) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인 글만 수정할 수 있습니다.");
		}
	}

	// 글이 있는지 + 본인 글인지 확인하고 글을 돌려줌
	private PostDTO getMyPost(Long postSeq, Long memberSeq) {
		PostDTO post = postDAO.selectPostForEdit(postSeq);
		if (post == null) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없습니다.");
		}
		if (!memberSeq.equals(post.getMemberSeq())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인 글만 수정할 수 있습니다.");
		}
		return post;
	}

	// ===================== 입력값 검사 (등록 · 수정 공용) =====================

	// 게시판 구분 확인 (없으면 FREE, FREE/ANON 말고는 400)
	private String checkBoardType(String boardType) {
		if (boardType == null || boardType.isBlank()) {
			return BOARD_FREE;
		}
		String type = boardType.trim().toUpperCase();
		if (!BOARD_FREE.equals(type) && !BOARD_ANON.equals(type)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "잘못된 게시판입니다.");
		}
		return type;
	}

	// 카테고리 · 제목 · 내용 검사 후 정리된 값을 dto에 다시 넣음
	private void checkPostInput(PostDTO dto, String boardType) {
		// 카테고리: 익명게시판은 무조건 '익명', 자유게시판은 3개 중 하나
		if (BOARD_ANON.equals(boardType)) {
			dto.setCategory(ANON_CATEGORY);
		} else {
			String category = dto.getCategory();
			if (category == null || !FREE_CATEGORIES.contains(category)) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "카테고리를 다시 선택해 주세요.");
			}
		}

		String title = dto.getTitle() == null ? "" : dto.getTitle().trim();
		String content = dto.getContent() == null ? "" : dto.getContent().trim();

		if (title.isEmpty() || title.length() > MAX_TITLE) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "제목은 1~" + MAX_TITLE + "자로 입력해 주세요.");
		}
		if (content.isEmpty() || content.length() > MAX_CONTENT) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "내용은 1~" + MAX_CONTENT + "자로 입력해 주세요.");
		}

		dto.setTitle(title);
		dto.setContent(content);
	}

	// ===================== 삭제 =====================

	@Transactional
	public void deletePost(Long postSeq, String loginId) {
		Long memberSeq = (loginId == null || loginId.isBlank()) ? null
				: postDAO.selectMemberSeqByLoginId(loginId);
		if (memberSeq == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인한 회원만 삭제할 수 있습니다.");
		}
		int result = postDAO.deletePost(postSeq, memberSeq);
		if (result == 0) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인 글만 삭제할 수 있습니다.");
		}
	}

	// ===================== 추천 =====================

	// 내가 추천했는지 + 현재 추천수 조회
	public Map<String, Object> selectRecommend(Long postSeq, String loginId) {
		Long memberSeq = getLoginMemberSeq(loginId);

		Integer count = postDAO.selectRecommendCount(postSeq);
		if (count == null) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글이 없습니다.");
		}

		boolean liked = postDAO.countRecommend(postSeq, memberSeq) > 0;
		return Map.of("liked", liked, "recommendCount", count);
	}

	// 추천 토글 (추천 ↔ 취소)
	@Transactional
	public Map<String, Object> toggleRecommend(Long postSeq, String loginId) {
		Long memberSeq = getLoginMemberSeq(loginId);

		if (postDAO.selectRecommendCount(postSeq) == null) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글이 없습니다.");
		}

		boolean liked;
		if (postDAO.countRecommend(postSeq, memberSeq) > 0) {
			postDAO.deleteRecommend(postSeq, memberSeq);
			postDAO.updateRecommendCount(postSeq, -1);
			liked = false;
		} else {
			postDAO.insertRecommend(postSeq, memberSeq);
			postDAO.updateRecommendCount(postSeq, 1);
			liked = true;
		}

		int newCount = postDAO.selectRecommendCount(postSeq);
		return Map.of("liked", liked, "recommendCount", newCount);
	}

	// 로그인 아이디 → 회원번호 (JWT 전 임시 방식, 없으면 401)
	private Long getLoginMemberSeq(String loginId) {
		Long memberSeq = (loginId == null || loginId.isBlank())
				? null
				: postDAO.selectMemberSeqByLoginId(loginId);
		if (memberSeq == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인한 회원만 이용할 수 있습니다.");
		}
		return memberSeq;
	}
}