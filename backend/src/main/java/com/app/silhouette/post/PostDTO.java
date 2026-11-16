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
