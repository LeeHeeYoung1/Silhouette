package com.app.silhouette.post;

import java.time.LocalDateTime;

public class PostDTO {
	private Long postSeq;
	private Long postCategorySeq;
	private Long memberSeq;
	private String title;
	private String content;
	private Integer viewCount;
	private Integer recommendCount;
	private Integer commentCount;
	private String isDeleted;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;
	private LocalDateTime deletedAt;

	public Long getPostSeq() {
		return postSeq;
	}
	public void setPostSeq(Long postSeq) {
		this.postSeq = postSeq;
	}
	public Long getPostCategorySeq() {
		return postCategorySeq;
	}
	public void setPostCategorySeq(Long postCategorySeq) {
		this.postCategorySeq = postCategorySeq;
	}
	public Long getMemberSeq() {
		return memberSeq;
	}
	public void setMemberSeq(Long memberSeq) {
		this.memberSeq = memberSeq;
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
		return viewCount;
	}
	public void setViewCount(Integer viewCount) {
		this.viewCount = viewCount;
	}
	public Integer getRecommendCount() {
		return recommendCount;
	}
	public void setRecommendCount(Integer recommendCount) {
		this.recommendCount = recommendCount;
	}
	public Integer getCommentCount() {
		return commentCount;
	}
	public void setCommentCount(Integer commentCount) {
		this.commentCount = commentCount;
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
	public LocalDateTime getDeletedAt() {
		return deletedAt;
	}
	public void setDeletedAt(LocalDateTime deletedAt) {
		this.deletedAt = deletedAt;
	}
	public PostDTO() {

	}
	public PostDTO(Long postSeq, Long postCategorySeq, Long memberSeq, String title, String content,
			Integer viewCount, Integer recommendCount, Integer commentCount, String isDeleted,
			LocalDateTime createdAt, LocalDateTime updatedAt, LocalDateTime deletedAt) {
		this.postSeq = postSeq;
		this.postCategorySeq = postCategorySeq;
		this.memberSeq = memberSeq;
		this.title = title;
		this.content = content;
		this.viewCount = viewCount;
		this.recommendCount = recommendCount;
		this.commentCount = commentCount;
		this.isDeleted = isDeleted;
		this.createdAt = createdAt;
		this.updatedAt = updatedAt;
		this.deletedAt = deletedAt;
	}}
