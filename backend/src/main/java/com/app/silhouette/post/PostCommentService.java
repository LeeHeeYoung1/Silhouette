package com.app.silhouette.post;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PostCommentService {

	private static final int MAX_LENGTH = 1000;
	private static final String DELETED_TEXT = "삭제된 댓글입니다.";

	private final PostCommentDAO postCommentDAO;
	private final PostDAO postDAO;   // 회원번호 조회 재사용

	public PostCommentService(PostCommentDAO postCommentDAO, PostDAO postDAO) {
		this.postCommentDAO = postCommentDAO;
		this.postDAO = postDAO;
	}

	// ===================== 댓글 / 대댓글 등록 =====================
	@Transactional
	public Long insertComment(Long postSeq, PostCommentDTO dto) {
		// 1) 회원 확인 (없으면 401)
		Long memberSeq = getLoginMemberSeq(dto.getLoginId());

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
				// 대댓글은 1단계까지만 (답글의 답글 X)
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "답글에는 답글을 달 수 없습니다.");
			}
		}

		// 5) DTO에 서버가 정하는 값 채우기
		dto.setPostSeq(postSeq);
		dto.setMemberSeq(memberSeq);
		dto.setContent(content);

		// 6) 저장 + 댓글 수 +1 (쓰기 2개 → 트랜잭션)
		postCommentDAO.insertComment(dto);
		postCommentDAO.increaseCommentCount(postSeq);

		// 7) selectKey로 채워진 새 댓글 번호를 돌려줌
		return dto.getPostCommentSeq();
	}

	// ===================== 댓글 목록 (트리 구조) =====================
	// DB에서는 한 줄로 받아오고, 여기서 부모 댓글의 replies 안에 대댓글을 넣어줌
	public List<PostCommentDTO> selectComments(Long postSeq) {
		checkActivePost(postSeq);

		List<PostCommentDTO> all = postCommentDAO.selectComment(postSeq);

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
				p.setLoginId(null);
				p.setMemberSeq(null);
				result.add(p);
			}
		}
		return result;
	}

	// ===================== 댓글 / 대댓글 수정 =====================
	@Transactional
	public void updateComment(Long postSeq, Long postCommentSeq, PostCommentDTO dto) {
		Long memberSeq = getLoginMemberSeq(dto.getLoginId());
		String content = checkContent(dto.getContent());
		checkActivePost(postSeq);

		int result = postCommentDAO.updateComment(postSeq, postCommentSeq, memberSeq, content);
		if (result == 0) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인 댓글만 수정할 수 있습니다.");
		}
	}

	// ===================== 댓글 / 대댓글 삭제 =====================
	// 실제로 지우지 않고 IS_DELETED = 'Y' 로 바꿈 (소프트 삭제)
	@Transactional
	public void deleteComment(Long postSeq, Long postCommentSeq, String loginId) {
		Long memberSeq = getLoginMemberSeq(loginId);
		checkActivePost(postSeq);

		int result = postCommentDAO.deleteComment(postSeq, postCommentSeq, memberSeq);
		if (result == 0) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인 댓글만 삭제할 수 있습니다.");
		}
		postCommentDAO.decreaseCommentCount(postSeq);
	}

	// ===================== 공통 =====================

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
