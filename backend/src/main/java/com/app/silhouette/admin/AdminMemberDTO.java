package com.app.silhouette.admin;

import java.time.LocalDateTime;

public class AdminMemberDTO {
	private Long member_seq;
    private String email;
    private String nickname;
    private String gender;
    private String status;
    private Long member_blacklist_seq;
    private String blacklist_reason;
    private String admin_memo;
    private String blacklist_status;
    private LocalDateTime created_at;

    public AdminMemberDTO() {}

	public AdminMemberDTO(Long member_seq, String email, String nickname, String gender, String status,
			Long member_blacklist_seq, String blacklist_reason, String admin_memo, String blacklist_status,
			LocalDateTime created_at) {
		super();
		this.member_seq = member_seq;
		this.email = email;
		this.nickname = nickname;
		this.gender = gender;
		this.status = status;
		this.member_blacklist_seq = member_blacklist_seq;
		this.blacklist_reason = blacklist_reason;
		this.admin_memo = admin_memo;
		this.blacklist_status = blacklist_status;
		this.created_at = created_at;
	}

	public Long getMemberSeq() {
		return member_seq;
	}

	public void setMemberSeq(Long member_seq) {
		this.member_seq = member_seq;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getNickname() {
		return nickname;
	}

	public void setNickname(String nickname) {
		this.nickname = nickname;
	}

	public String getGender() {
		return gender;
	}

	public void setGender(String gender) {
		this.gender = gender;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public Long getMemberBlacklistSeq() {
		return member_blacklist_seq;
	}

	public void setMemberBlacklistSeq(Long member_blacklist_seq) {
		this.member_blacklist_seq = member_blacklist_seq;
	}

	public String getBlacklistReason() {
		return blacklist_reason;
	}

	public void setBlacklistReason(String blacklist_reason) {
		this.blacklist_reason = blacklist_reason;
	}

	public String getAdminMemo() {
		return admin_memo;
	}

	public void setAdminMemo(String admin_memo) {
		this.admin_memo = admin_memo;
	}

	public String getBlacklistStatus() {
		return blacklist_status;
	}

	public void setBlacklistStatus(String blacklist_status) {
		this.blacklist_status = blacklist_status;
	}

	public LocalDateTime getCreatedAt() {
		return created_at;
	}

	public void setCreatedAt(LocalDateTime created_at) {
		this.created_at = created_at;
	}
}
