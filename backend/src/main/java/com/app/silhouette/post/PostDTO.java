package com.app.silhouette.post;

import java.time.LocalDateTime;

public class PostDTO {

	// ===================== POST 테이블 컬럼 (DB 컬럼명과 동일) =====================
	private Long post_seq;                  // 글 번호 (값은 SEQ_POST.NEXTVAL)
	private String board_type;              // ✅ 게시판 구분 (FREE: 자유, ANON: 익명)
	private String category;                // 카테고리 (자유/연애고민/데이트후기, 익명게시판은 '익명')
	private Long member_seq;                // 작성자 회원번호
	private String title;                   // 제목
	private String content;                 // 내용
	private Integer view_count;             // 조회수
	private Integer recommend_count;        // 추천수
	private Integer comment_count;          // 댓글수
	private String is_deleted;              // 삭제 여부 (Y/N)
	private LocalDateTime created_at;       // 등록일시
	private LocalDateTime updated_at;       // 수정일시
	private LocalDateTime deleted_at;       // 삭제일시

	// ===================== 화면용 (POST 테이블 컬럼 아님) =====================
	private String login_id;                // 작성자 아이디 (MEMBER.LOGIN_ID, 익명 글은 null로 보냄)
	private String writer_name;             // 작성자 표시 이름 (닉네임 또는 '익명')
	private Boolean mine;                   // ✅ 보는 사람의 글인지 (서버가 계산)
	
	private String profile_image_url;   // 작성자 대표 사진 주소 (익명 글이면 null)

	public PostDTO() {}

	// ===================== getter / setter (camelCase → mapper #{}, JSON 그대로) =====================

	public Long getPostSeq() {
		return post_seq;
	}

	public void setPostSeq(Long postSeq) {
		this.post_seq = postSeq;
	}

	// ✅ 게시판 구분
	public String getBoardType() {
		return board_type;
	}

	public void setBoardType(String boardType) {
		this.board_type = boardType;
	}

	public String getCategory() {
		return category;
	}

	public void setCategory(String category) {
		this.category = category;
	}

	public Long getMemberSeq() {
		return member_seq;
	}

	public void setMemberSeq(Long memberSeq) {
		this.member_seq = memberSeq;
	}

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public String getContent() {
		return content;
	}

	public void setContent(String content) {
		this.content = content;
	}

	public Integer getViewCount() {
		return view_count;
	}

	public void setViewCount(Integer viewCount) {
		this.view_count = viewCount;
	}

	public Integer getRecommendCount() {
		return recommend_count;
	}

	public void setRecommendCount(Integer recommendCount) {
		this.recommend_count = recommendCount;
	}

	public Integer getCommentCount() {
		return comment_count;
	}

	public void setCommentCount(Integer commentCount) {
		this.comment_count = commentCount;
	}

	public String getIsDeleted() {
		return is_deleted;
	}

	public void setIsDeleted(String isDeleted) {
		this.is_deleted = isDeleted;
	}

	public LocalDateTime getCreatedAt() {
		return created_at;
	}

	public void setCreatedAt(LocalDateTime createdAt) {
		this.created_at = createdAt;
	}

	public LocalDateTime getUpdatedAt() {
		return updated_at;
	}

	public void setUpdatedAt(LocalDateTime updatedAt) {
		this.updated_at = updatedAt;
	}

	public LocalDateTime getDeletedAt() {
		return deleted_at;
	}

	public void setDeletedAt(LocalDateTime deletedAt) {
		this.deleted_at = deletedAt;
	}

	public String getLoginId() {
		return login_id;
	}

	public void setLoginId(String loginId) {
		this.login_id = loginId;
	}

	public String getWriterName() {
		return writer_name;
	}

	public void setWriterName(String writerName) {
		this.writer_name = writerName;
	}

	// ✅ 내 글인지 (Boolean 대문자 → JSON에 "mine": true/false)
	public Boolean getMine() {
		return mine;
	}

	public void setMine(Boolean mine) {
		this.mine = mine;
	}
	
	public String getProfileImageUrl() { return profile_image_url; }
	public void setProfileImageUrl(String profile_image_url) { this.profile_image_url = profile_image_url; }
}