package com.app.silhouette.bookmark;

import java.time.LocalDateTime;

public class PostBookmarkDTO {

	// ===================== POST_BOOKMARK 테이블 컬럼 =====================
	private Long post_bookmark_seq;          // 북마크 번호 (SEQ_POST_BOOKMARK)
	private Long member_seq;                 // 북마크한 회원
	private Long post_seq;                   // 북마크한 게시글
	private LocalDateTime created_at;        // 북마크한 일시
	private LocalDateTime updated_at;        // 수정일시

	// ===================== 마이페이지 목록용 (게시글 정보) =====================
	private String board_type;               // FREE / ANON
	private String category;                 // 카테고리
	private String title;                    // 제목
	private String writer_name;              // 작성자 닉네임 (익명 글은 '익명')
	private Integer view_count;              // 조회수
	private Integer recommend_count;         // 추천수
	private Integer comment_count;           // 댓글수
	private LocalDateTime post_created_at;   // 게시글 작성일시

	public PostBookmarkDTO() {}

	public Long getPostBookmarkSeq() { return post_bookmark_seq; }
	public void setPostBookmarkSeq(Long postBookmarkSeq) { this.post_bookmark_seq = postBookmarkSeq; }

	public Long getMemberSeq() { return member_seq; }
	public void setMemberSeq(Long memberSeq) { this.member_seq = memberSeq; }

	public Long getPostSeq() { return post_seq; }
	public void setPostSeq(Long postSeq) { this.post_seq = postSeq; }

	public LocalDateTime getCreatedAt() { return created_at; }
	public void setCreatedAt(LocalDateTime createdAt) { this.created_at = createdAt; }

	public LocalDateTime getUpdatedAt() { return updated_at; }
	public void setUpdatedAt(LocalDateTime updatedAt) { this.updated_at = updatedAt; }

	public String getBoardType() { return board_type; }
	public void setBoardType(String boardType) { this.board_type = boardType; }

	public String getCategory() { return category; }
	public void setCategory(String category) { this.category = category; }

	public String getTitle() { return title; }
	public void setTitle(String title) { this.title = title; }

	public String getWriterName() { return writer_name; }
	public void setWriterName(String writerName) { this.writer_name = writerName; }

	public Integer getViewCount() { return view_count; }
	public void setViewCount(Integer viewCount) { this.view_count = viewCount; }

	public Integer getRecommendCount() { return recommend_count; }
	public void setRecommendCount(Integer recommendCount) { this.recommend_count = recommendCount; }

	public Integer getCommentCount() { return comment_count; }
	public void setCommentCount(Integer commentCount) { this.comment_count = commentCount; }

	public LocalDateTime getPostCreatedAt() { return post_created_at; }
	public void setPostCreatedAt(LocalDateTime postCreatedAt) { this.post_created_at = postCreatedAt; }
}