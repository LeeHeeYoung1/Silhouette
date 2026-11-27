package com.app.silhouette.post;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class PostCommentDTO {

	// ===== POST_COMMENT 테이블 컬럼 =====
	private Long post_comment_seq;          // 댓글 번호 (PK)
	private Long post_seq;                  // 어떤 글에
	private Long member_seq;                // 누가
	private Long parent_post_comment_seq;   // 부모 댓글 번호 (null이면 일반 댓글)
	private String content;                 // 내용
	private String is_deleted;              // 삭제 여부 ('N' / 'Y')
	private LocalDateTime created_at;       // 작성일
	private LocalDateTime updated_at;       // 수정일

	// ===== DB 컬럼이 아닌 값 =====
	private String login_id;                // 화면에서 받는 작성자 아이디
	private String writer_name;             // 화면에 보여줄 작성자 닉네임
	private List<PostCommentDTO> replies = new ArrayList<>();   // 대댓글 목록
	
	private Boolean mine;      // 보는 사람의 댓글인지 (서버가 계산)
	private Boolean writer;    // 게시글 작성자가 단 댓글인지 (서버가 계산)

	public PostCommentDTO() {}

	public Long getPostCommentSeq() {
		return post_comment_seq;
	}

	public void setPostCommentSeq(Long post_comment_seq) {
		this.post_comment_seq = post_comment_seq;
	}

	public Long getPostSeq() {
		return post_seq;
	}

	public void setPostSeq(Long post_seq) {
		this.post_seq = post_seq;
	}

	public Long getMemberSeq() {
		return member_seq;
	}

	public void setMemberSeq(Long member_seq) {
		this.member_seq = member_seq;
	}

	public Long getParentPostCommentSeq() {
		return parent_post_comment_seq;
	}

	public void setParentPostCommentSeq(Long parent_post_comment_seq) {
		this.parent_post_comment_seq = parent_post_comment_seq;
	}

	public String getContent() {
		return content;
	}

	public void setContent(String content) {
		this.content = content;
	}

	public String getIsDeleted() {
		return is_deleted;
	}

	public void setIsDeleted(String is_deleted) {
		this.is_deleted = is_deleted;
	}

	public LocalDateTime getCreatedAt() {
		return created_at;
	}

	public void setCreatedAt(LocalDateTime created_at) {
		this.created_at = created_at;
	}

	public LocalDateTime getUpdatedAt() {
		return updated_at;
	}

	public void setUpdatedAt(LocalDateTime updated_at) {
		this.updated_at = updated_at;
	}

	public String getLoginId() {
		return login_id;
	}

	public void setLoginId(String login_id) {
		this.login_id = login_id;
	}

	public String getWriterName() {
		return writer_name;
	}

	public void setWriterName(String writer_name) {
		this.writer_name = writer_name;
	}

	public List<PostCommentDTO> getReplies() {
		return replies;
	}

	public void setReplies(List<PostCommentDTO> replies) {
		this.replies = replies;
	}
	
	public Boolean getMine() { return mine; }
	public void setMine(Boolean mine) { this.mine = mine; }

	public Boolean getWriter() { return writer; }
	public void setWriter(Boolean writer) { this.writer = writer; }
}