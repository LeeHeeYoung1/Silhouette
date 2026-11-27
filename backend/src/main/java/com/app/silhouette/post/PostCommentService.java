package com.app.silhouette.post;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.app.silhouette.admin.AdminService;
import com.app.silhouette.commons.AuthMemberDTO;
import com.app.silhouette.commons.AuthMemberService;

/* =========================================================
   댓글 Service
   ✅ 회원 확인은 토큰으로 (loginId 파라미터 사용 안 함)
   ✅ 댓글 목록에는 작성자 아이디를 보내지 않고,
      서버가 mine(내 댓글) · writer(글쓴이 댓글)를 계산해서 보냄
   ✅ 익명 글이면 회원번호도 보내지 않음
   ========================================================= */
@Service
public class PostCommentService {

	private static final int MAX_LENGTH = 1000;
	private static final String DELETED_TEXT = "삭제된 댓글입니다.";
	private static final String BOARD_ANON = "ANON";

	private final PostCommentDAO postCommentDAO;
	private final PostDAO postDAO;
	private final AdminService adminService;
	private final AuthMemberService authMemberService;

	public PostCommentService(PostCommentDAO postCommentDAO, PostDAO postDAO,
			AdminService adminService, AuthMemberService authMemberService) {
		this.postCommentDAO = postCommentDAO;
		this.postDAO = postDAO;
		this.adminService = adminService;
		this.authMemberService = authMemberService;
	}

	// ===================== 댓글 / 대댓글 등록 =====================
	@Transactional
	public Long insertComment(Long postSeq, PostCommentDTO dto, String authorization) {
		// 1) 회원 확인 (토큰, 없으면 401)
		Long memberSeq = loginMemberSeq(authorization);

		// 2) 내용 확인 (비었거나 1000자 초과면 400)
		String content = checkContent(dto.getContent());

		// 3) 삭제됐거나 없는 글이면 404
		checkActivePost(postSeq);

		// 4) 대댓글이면 부모 댓글 확인
		Long parentSeq = dto.getParentPostCommentSeq();
		if (parentSeq != null) {
			PostCommentDTO parent = postCommentDAO.selectCommentOne(parentSeq);
			if (parent == null || !postSeq.equals(parent.getPostSeq()) || "Y".equals(parent.getIsDeleted())) {
				throw new ResponseStatusException(HttpStatus.NOT_FOUND, "답글을 달 댓글이 없습니다.");
			}
			if (parent.getParentPostCommentSeq() != null) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "답글에는 답글을 달 수 없습니다.");
			}
		}

		// 5) 서버가 정하는 값 채우기 (화면이 보낸 회원번호는 무시, 금칙어 필터링)
		dto.setPostSeq(postSeq);
		dto.setMemberSeq(memberSeq);
		dto.setContent(adminService.filterText(content));

		// 6) 저장 + 댓글 수 +1
		postCommentDAO.insertComment(dto);
		postCommentDAO.increaseCommentCount(postSeq);

		return dto.getPostCommentSeq();
	}

	// ===================== 댓글 목록 (트리 구조) =====================
	public List<PostCommentDTO> selectComments(Long postSeq, String authorization) {
		checkActivePost(postSeq);

		// 글 정보 (글쓴이 회원번호 · 게시판 구분)
		PostDTO post = postDAO.selectPostForEdit(postSeq);
		Long postWriterSeq = post == null ? null : post.getMemberSeq();
		boolean anon = post != null && BOARD_ANON.equals(post.getBoardType());

		// 보는 사람 (로그인 안 했으면 null)
		AuthMemberDTO viewer = authMemberService.loginMemberOrNull(authorization);
		Long viewerSeq = viewer == null ? null : viewer.getMemberSeq();

		List<PostCommentDTO> all = postCommentDAO.selectComment(postSeq);

		// 0) 서버에서 mine · writer 계산 후, 아이디는 지우고 익명이면 회원번호도 지움
		for (PostCommentDTO c : all) {
			boolean deleted = "Y".equals(c.getIsDeleted());
			c.setMine(!deleted && viewerSeq != null && viewerSeq.equals(c.getMemberSeq()));
			c.setWriter(!deleted && postWriterSeq != null && postWriterSeq.equals(c.getMemberSeq()));
			c.setLoginId(null);
			if (anon) {
				c.setMemberSeq(null);
				c.setWriterName("익명");
			}
		}

		// 1) 부모 댓글만 먼저 담기 (순서 유지)
		Map<Long, PostCommentDTO> parents = new LinkedHashMap<>();
		for (PostCommentDTO c : all) {
			if (c.getParentPostCommentSeq() == null) {
				parents.put(c.getPostCommentSeq(), c);
			}
		}

		// 2) 삭제 안 된 대댓글을 부모의 replies에 넣기
		for (PostCommentDTO c : all) {
			if (c.getParentPostCommentSeq() != null && "N".equals(c.getIsDeleted())) {
				PostCommentDTO parent = parents.get(c.getParentPostCommentSeq());
				if (parent != null) {
					parent.getReplies().add(c);
				}
			}
		}

		// 3) 삭제된 부모 댓글은 대댓글이 남아 있을 때만 "삭제된 댓글입니다."로 보여줌
		List<PostCommentDTO> result = new ArrayList<>();
		for (PostCommentDTO p : parents.values()) {
			if ("N".equals(p.getIsDeleted())) {
				result.add(p);
			} else if (!p.getReplies().isEmpty()) {
				p.setContent(DELETED_TEXT);
				p.setWriterName(null);
				p.setMemberSeq(null);
				result.add(p);
			}
		}
		return result;
	}

	// ===================== 댓글 / 대댓글 수정 =====================
	@Transactional
	public void updateComment(Long postSeq, Long postCommentSeq, PostCommentDTO dto, String authorization) {
		Long memberSeq = loginMemberSeq(authorization);
		String content = checkContent(dto.getContent());
		checkActivePost(postSeq);

		content = adminService.filterText(content);
		int result = postCommentDAO.updateComment(postSeq, postCommentSeq, memberSeq, content);
		if (result == 0) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인 댓글만 수정할 수 있습니다.");
		}
	}

	// ===================== 댓글 / 대댓글 삭제 (소프트 삭제) =====================
	@Transactional
	public void deleteComment(Long postSeq, Long postCommentSeq, String authorization) {
		Long memberSeq = loginMemberSeq(authorization);
		checkActivePost(postSeq);

		int result = postCommentDAO.deleteComment(postSeq, postCommentSeq, memberSeq);
		if (result == 0) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인 댓글만 삭제할 수 있습니다.");
		}
		postCommentDAO.decreaseCommentCount(postSeq);
	}

	// ===================== 공통 =====================

	// ✅ 토큰 → 회원번호 (없으면 AuthMemberService가 401)
	private Long loginMemberSeq(String authorization) {
		return authMemberService.loginMember(authorization).getMemberSeq();
	}

	// 내용 검사 (1~1000자)
	private String checkContent(String raw) {
		String content = raw == null ? "" : raw.trim();
		if (content.isEmpty() || content.length() > MAX_LENGTH) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "댓글은 1~" + MAX_LENGTH + "자로 입력해 주세요.");
		}
		return content;
	}

	// 삭제됐거나 없는 글이면 404
	private void checkActivePost(Long postSeq) {
		if (postCommentDAO.countActivePost(postSeq) == 0) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글이 없습니다.");
		}
	}
}