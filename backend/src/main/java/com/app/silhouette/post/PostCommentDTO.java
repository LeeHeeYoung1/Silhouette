package com.app.silhouette.post;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class PostCommentDTO {

	// ===== POST_COMMENT 테이블 컬럼 =====
	private Long postCommentSeq;          // 댓글 번호 (PK)
	private Long postSeq;                 // 어떤 글에
	private Long memberSeq;               // 누가
	private Long parentPostCommentSeq;    // 부모 댓글 번호 (null이면 일반 댓글)
	private String content;               // 내용
	private String isDeleted;             // 삭제 여부 ('N' / 'Y')
	private LocalDateTime createdAt;      // 작성일
	private LocalDateTime updatedAt;      // 수정일

	// ===== DB 컬럼이 아닌 값 =====
	private String loginId;               // 화면에서 받는 작성자 아이디
	private String writerName;            // 화면에 보여줄 작성자 닉네임
	private List<PostCommentDTO> replies = new ArrayList<>();   // 대댓글 목록

	public PostCommentDTO() {}

	public Long getPostCommentSeq() {
		return postCommentSeq;
	}

	public void setPostCommentSeq(Long postCommentSeq) {
		this.postCommentSeq = postCommentSeq;
	}

	public Long getPostSeq() {
		return postSeq;
	}

	public void setPostSeq(Long postSeq) {
		this.postSeq = postSeq;
	}

	public Long getMemberSeq() {
		return memberSeq;
	}

	public void setMemberSeq(Long memberSeq) {
		this.memberSeq = memberSeq;
	}

	public Long getParentPostCommentSeq() {
		return parentPostCommentSeq;
	}

	public void setParentPostCommentSeq(Long parentPostCommentSeq) {
		this.parentPostCommentSeq = parentPostCommentSeq;
	}

	public String getContent() {
		return content;
	}

	public void setContent(String content) {
		this.content = content;
	}

	public String getIsDeleted() {
		return isDeleted;
	}

	public void setIsDeleted(String isDeleted) {
		this.isDeleted = isDeleted;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}

	public LocalDateTime getUpdatedAt() {
		return updatedAt;
	}

	public void setUpdatedAt(LocalDateTime updatedAt) {
		this.updatedAt = updatedAt;
	}

	public String getLoginId() {
		return loginId;
	}

	public void setLoginId(String loginId) {
		this.loginId = loginId;
	}

	public String getWriterName() {
		return writerName;
	}

	public void setWriterName(String writerName) {
		this.writerName = writerName;
	}

	public List<PostCommentDTO> getReplies() {
		return replies;
	}

	public void setReplies(List<PostCommentDTO> replies) {
		this.replies = replies;
	}
}