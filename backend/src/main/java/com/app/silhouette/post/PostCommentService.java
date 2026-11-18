package com.app.silhouette.post;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PostCommentService {

	private final PostCommentDAO postCommentDAO;
	private final PostDAO postDAO;   // 회원번호 조회 재사용

	public PostCommentService(PostCommentDAO postCommentDAO, PostDAO postDAO) {
		this.postCommentDAO = postCommentDAO;
		this.postDAO = postDAO;
	}

	// ===================== 댓글 등록 =====================
	@Transactional
	public Long insertComment(Long postSeq, PostCommentDTO dto) {
		// 1) 회원 확인 (없으면 401)
		Long memberSeq = getLoginMemberSeq(dto.getLoginId());

		// 2) 내용 확인 (비었거나 1000자 초과면 400)
		String content = dto.getContent() == null ? "" : dto.getContent().trim();
		if (content.isEmpty() || content.length() > 1000) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "댓글은 1~1000자로 입력해 주세요.");
		}

		// 3) 삭제됐거나 없는 글이면 404
		if (postCommentDAO.countActivePost(postSeq) == 0) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글이 없습니다.");
		}

		// 4) DTO에 서버가 정하는 값 채우기
		dto.setPostSeq(postSeq);
		dto.setMemberSeq(memberSeq);
		dto.setContent(content);

		// 5) 저장 + 댓글 수 +1 (쓰기 2개 → 트랜잭션)
		postCommentDAO.insertComment(dto);
		postCommentDAO.increaseCommentCount(postSeq);

		// 6) selectKey로 채워진 새 댓글 번호를 돌려줌
		return dto.getPostCommentSeq();
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
}