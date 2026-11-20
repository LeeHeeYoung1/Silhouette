package com.app.silhouette.profile;

public class ProfileImageDTO {
	private Long profileImageSeq;
	private Long memberSeq;
	private String originalName;
	private String storedName;
	private String fileUrl;
	private String reviewStatus;
	private Integer sortOrder;        // 1~4 (1 = 대표 사진)

	public ProfileImageDTO() {}

	public Long getProfileImageSeq() { return profileImageSeq; }
	public void setProfileImageSeq(Long profileImageSeq) { this.profileImageSeq = profileImageSeq; }

	public Long getMemberSeq() { return memberSeq; }
	public void setMemberSeq(Long memberSeq) { this.memberSeq = memberSeq; }

	public String getOriginalName() { return originalName; }
	public void setOriginalName(String originalName) { this.originalName = originalName; }

	public String getStoredName() { return storedName; }
	public void setStoredName(String storedName) { this.storedName = storedName; }

	public String getFileUrl() { return fileUrl; }
	public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }

	public String getReviewStatus() { return reviewStatus; }
	public void setReviewStatus(String reviewStatus) { this.reviewStatus = reviewStatus; }

	public Integer getSortOrder() { return sortOrder; }
	public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
}