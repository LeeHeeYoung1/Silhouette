package com.app.silhouette.profile;

public class ProfileImageDTO {
	private Long profile_image_seq;
	private Long member_seq;
	private String original_name;
	private String stored_name;
	private String file_url;
	private String review_status;
	private Integer sort_order;           // 1~4 (1 = 대표 사진)

	public ProfileImageDTO() {}

	public Long getProfileImageSeq() { return profile_image_seq; }
	public void setProfileImageSeq(Long profile_image_seq) { this.profile_image_seq = profile_image_seq; }

	public Long getMemberSeq() { return member_seq; }
	public void setMemberSeq(Long member_seq) { this.member_seq = member_seq; }

	public String getOriginalName() { return original_name; }
	public void setOriginalName(String original_name) { this.original_name = original_name; }

	public String getStoredName() { return stored_name; }
	public void setStoredName(String stored_name) { this.stored_name = stored_name; }

	public String getFileUrl() { return file_url; }
	public void setFileUrl(String file_url) { this.file_url = file_url; }

	public String getReviewStatus() { return review_status; }
	public void setReviewStatus(String review_status) { this.review_status = review_status; }

	public Integer getSortOrder() { return sort_order; }
	public void setSortOrder(Integer sort_order) { this.sort_order = sort_order; }
}