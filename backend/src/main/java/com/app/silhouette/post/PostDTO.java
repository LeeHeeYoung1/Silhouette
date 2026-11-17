package com.app.silhouette.post;

import java.time.LocalDateTime;

public class PostDTO {
	private Long postSeq;
	private String category;
	private Long memberSeq;
	private String loginId;          // 화면에서 받는 작성자 아이디 (DB 컬럼 아님)
	private String title;
	private String content;
	private Integer viewCount;
	private Integer recommendCount;
	private Integer commentCount;
	private String isDeleted;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;
	private LocalDateTime deletedAt;

	public PostDTO() {}

	public Long getPostSeq() { return postSeq; }
	public void setPostSeq(Long postSeq) { this.postSeq = postSeq; }

	public String getCategory() { return category; }
	public void setCategory(String category) { this.category = category; }

	public Long getMemberSeq() { return memberSeq; }
	public void setMemberSeq(Long memberSeq) { this.memberSeq = memberSeq; }

	public String getLoginId() { return loginId; }
	public void setLoginId(String loginId) { this.loginId = loginId; }

	public String getTitle() { return title; }
	public void setTitle(String title) { this.title = title; }

	public String getContent() { return content; }
	public void setContent(String content) { this.content = content; }

	public Integer getViewCount() { return viewCount; }
	public void setViewCount(Integer viewCount) { this.viewCount = viewCount; }

	public Integer getRecommendCount() { return recommendCount; }
	public void setRecommendCount(Integer recommendCount) { this.recommendCount = recommendCount; }

	public Integer getCommentCount() { return commentCount; }
	public void setCommentCount(Integer commentCount) { this.commentCount = commentCount; }

	public String getIsDeleted() { return isDeleted; }
	public void setIsDeleted(String isDeleted) { this.isDeleted = isDeleted; }

	public LocalDateTime getCreatedAt() { return createdAt; }
	public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

	public LocalDateTime getUpdatedAt() { return updatedAt; }
	public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

	public LocalDateTime getDeletedAt() { return deletedAt; }
	public void setDeletedAt(LocalDateTime deletedAt) { this.deletedAt = deletedAt; }
}