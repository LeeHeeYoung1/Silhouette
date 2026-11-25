package com.app.silhouette.admin;

import java.time.LocalDateTime;

public class PhotoReviewDTO {
	
	private Long photo_review_seq;
    private Long member_seq;
    private String nickname;
    private String photo_url;
    private Double ai_score;
    private String is_ai_suspect;
    private String status;
    private String reject_reason;
    private LocalDateTime reviewed_at;
    private LocalDateTime created_at;

    public PhotoReviewDTO() {}

	public PhotoReviewDTO(Long photo_review_seq, Long member_seq, String nickname, String photo_url, Double ai_score,
			String is_ai_suspect, String status, String reject_reason, LocalDateTime reviewed_at,
			LocalDateTime created_at) {
		super();
		this.photo_review_seq = photo_review_seq;
		this.member_seq = member_seq;
		this.nickname = nickname;
		this.photo_url = photo_url;
		this.ai_score = ai_score;
		this.is_ai_suspect = is_ai_suspect;
		this.status = status;
		this.reject_reason = reject_reason;
		this.reviewed_at = reviewed_at;
		this.created_at = created_at;
	}

	public Long getPhotoReviewSeq() {
		return photo_review_seq;
	}

	public void setPhotoReviewSeq(Long photo_review_seq) {
		this.photo_review_seq = photo_review_seq;
	}

	public Long getMemberSeq() {
		return member_seq;
	}

	public void setMemberSeq(Long member_seq) {
		this.member_seq = member_seq;
	}

	public String getNickname() {
		return nickname;
	}

	public void setNickname(String nickname) {
		this.nickname = nickname;
	}

	public String getPhotoUrl() {
		return photo_url;
	}

	public void setPhotoUrl(String photo_url) {
		this.photo_url = photo_url;
	}

	public Double getAiScore() {
		return ai_score;
	}

	public void setAiScore(Double ai_score) {
		this.ai_score = ai_score;
	}

	public String getIsAiSuspect() {
		return is_ai_suspect;
	}

	public void setIsAiSuspect(String is_ai_suspect) {
		this.is_ai_suspect = is_ai_suspect;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public String getRejectReason() {
		return reject_reason;
	}

	public void setRejectReason(String reject_reason) {
		this.reject_reason = reject_reason;
	}

	public LocalDateTime getReviewedAt() {
		return reviewed_at;
	}

	public void setReviewedAt(LocalDateTime reviewed_at) {
		this.reviewed_at = reviewed_at;
	}

	public LocalDateTime getCreatedAt() {
		return created_at;
	}

	public void setCreatedAt(LocalDateTime created_at) {
		this.created_at = created_at;
	}
}
