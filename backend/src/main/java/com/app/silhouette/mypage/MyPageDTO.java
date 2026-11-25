package com.app.silhouette.mypage;

import java.time.LocalDate;
import java.time.LocalDateTime;

// 마이페이지 기본 정보 (MEMBER 테이블, 비밀번호 · 권한 · 상태는 담지 않음)
public class MyPageDTO {

	private Long member_seq;              // 회원번호 (화면에 표시 안 함)
	private String login_id;              // 아이디 (수정 불가)
	private String name;                  // 이름 (수정 불가)
	private String nickname;              // 닉네임 (수정 가능)
	private String phone;                 // 휴대전화 (수정 가능)
	private String email;                 // 이메일 (수정 가능)
	private String gender;                // 성별 MALE / FEMALE (수정 불가)
	private LocalDate birth_date;         // 생년월일 (수정 불가)
	private String zipcode;               // 우편번호 (수정 가능)
	private String address1;              // 주소 (수정 가능)
	private String address2;              // 상세주소 (수정 가능)
	private LocalDateTime created_at;     // 가입일

	// 화면용 (MEMBER 컬럼 아님)
	private String profile_image_url;     // 대표 사진 주소 (PROFILE_IMAGE, sort_order 가장 작은 것)

	public MyPageDTO() {}

	public Long getMemberSeq() { return member_seq; }
	public void setMemberSeq(Long memberSeq) { this.member_seq = memberSeq; }

	public String getLoginId() { return login_id; }
	public void setLoginId(String loginId) { this.login_id = loginId; }

	public String getName() { return name; }
	public void setName(String name) { this.name = name; }

	public String getNickname() { return nickname; }
	public void setNickname(String nickname) { this.nickname = nickname; }

	public String getPhone() { return phone; }
	public void setPhone(String phone) { this.phone = phone; }

	public String getEmail() { return email; }
	public void setEmail(String email) { this.email = email; }

	public String getGender() { return gender; }
	public void setGender(String gender) { this.gender = gender; }

	public LocalDate getBirthDate() { return birth_date; }
	public void setBirthDate(LocalDate birthDate) { this.birth_date = birthDate; }

	public String getZipcode() { return zipcode; }
	public void setZipcode(String zipcode) { this.zipcode = zipcode; }

	public String getAddress1() { return address1; }
	public void setAddress1(String address1) { this.address1 = address1; }

	public String getAddress2() { return address2; }
	public void setAddress2(String address2) { this.address2 = address2; }

	public LocalDateTime getCreatedAt() { return created_at; }
	public void setCreatedAt(LocalDateTime createdAt) { this.created_at = createdAt; }

	public String getProfileImageUrl() { return profile_image_url; }
	public void setProfileImageUrl(String profileImageUrl) { this.profile_image_url = profileImageUrl; }
}