package com.app.silhouette.post;

import java.time.LocalDateTime;

import java.time.LocalDateTime;

public class PostFileDTO {
	private Long postFileSeq;
	private Long postSeq;
	private String originalName;
	private String storedName;
	private String filePath;
	private Long fileSize;
	private String fileType;      // IMAGE / FILE
	private Integer sortOrder;
	private LocalDateTime createdAt;

	public PostFileDTO() {}

	public Long getPostFileSeq() { return postFileSeq; }
	public void setPostFileSeq(Long postFileSeq) { this.postFileSeq = postFileSeq; }

	public Long getPostSeq() { return postSeq; }
	public void setPostSeq(Long postSeq) { this.postSeq = postSeq; }

	public String getOriginalName() { return originalName; }
	public void setOriginalName(String originalName) { this.originalName = originalName; }

	public String getStoredName() { return storedName; }
	public void setStoredName(String storedName) { this.storedName = storedName; }

	public String getFilePath() { return filePath; }
	public void setFilePath(String filePath) { this.filePath = filePath; }

	public Long getFileSize() { return fileSize; }
	public void setFileSize(Long fileSize) { this.fileSize = fileSize; }

	public String getFileType() { return fileType; }
	public void setFileType(String fileType) { this.fileType = fileType; }

	public Integer getSortOrder() { return sortOrder; }
	public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }

	public LocalDateTime getCreatedAt() { return createdAt; }
	public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}