package com.app.silhouette.commons;

/* 로그인한 회원의 권한 정보 (MEMBER 테이블에서 필요한 것만) */
public class AuthMemberDTO {

	private Long member_seq;          // MEMBER_SEQ
	private String login_id;          // LOGIN_ID
	private String nickname;          // NICKNAME
	private String role;              // ROLE (ROLE_USER / ROLE_ADMIN)
	private String member_status;     // MEMBER_STATUS (ACTIVE ...)

	public AuthMemberDTO() {}

	// 관리자인지
	public boolean isAdmin() {
		return "ROLE_ADMIN".equals(role);
	}

	public Long getMemberSeq() { return member_seq; }
	public void setMemberSeq(Long memberSeq) { this.member_seq = memberSeq; }

	public String getLoginId() { return login_id; }
	public void setLoginId(String loginId) { this.login_id = loginId; }

	public String getNickname() { return nickname; }
	public void setNickname(String nickname) { this.nickname = nickname; }

	public String getRole() { return role; }
	public void setRole(String role) { this.role = role; }

	public String getMemberStatus() { return member_status; }
	public void setMemberStatus(String memberStatus) { this.member_status = memberStatus; }
}