package com.app.silhouette.profile;

import java.time.LocalDateTime;

public class ProfileDTO {

	// ===== 회원 기본 정보 (MEMBER, 읽기만) =====
	private Long member_seq;
	private String login_id;
	private String nickname;
	private String gender;
	private Integer age;                  // 생년월일로 계산한 만 나이
	private String body_type; 
	// ===== 나의 정보 (MEMBER_PROFILE) =====
	private Long member_profile_seq;
	private String mbti;
	private String job;
	private Integer height;
	private Integer weight;
	private String introduction;
	private String love_type;
	private String hobby;
	private String favorite;
	private String dislike;
	private String drinking;
	private String smoking;
	private String religion;
	private String food_preference;
	private String face_type;
	private String skin_type;
	private String military_status;       // 병역 (남성만: 군필, 미필, 복무 중, 면제)
	private LocalDateTime created_at;

	public ProfileDTO() {}

	public Long getMemberSeq() { return member_seq; }
	public void setMemberSeq(Long member_seq) { this.member_seq = member_seq; }

	public String getLoginId() { return login_id; }
	public void setLoginId(String login_id) { this.login_id = login_id; }

	public String getNickname() { return nickname; }
	public void setNickname(String nickname) { this.nickname = nickname; }

	public String getGender() { return gender; }
	public void setGender(String gender) { this.gender = gender; }

	public Integer getAge() { return age; }
	public void setAge(Integer age) { this.age = age; }

	public Long getMemberProfileSeq() { return member_profile_seq; }
	public void setMemberProfileSeq(Long member_profile_seq) { this.member_profile_seq = member_profile_seq; }

	public String getMbti() { return mbti; }
	public void setMbti(String mbti) { this.mbti = mbti; }

	public String getJob() { return job; }
	public void setJob(String job) { this.job = job; }

	public Integer getHeight() { return height; }
	public void setHeight(Integer height) { this.height = height; }

	public Integer getWeight() { return weight; }
	public void setWeight(Integer weight) { this.weight = weight; }

	public String getIntroduction() { return introduction; }
	public void setIntroduction(String introduction) { this.introduction = introduction; }

	public String getLoveType() { return love_type; }
	public void setLoveType(String love_type) { this.love_type = love_type; }

	public String getHobby() { return hobby; }
	public void setHobby(String hobby) { this.hobby = hobby; }

	public String getFavorite() { return favorite; }
	public void setFavorite(String favorite) { this.favorite = favorite; }

	public String getDislike() { return dislike; }
	public void setDislike(String dislike) { this.dislike = dislike; }

	public String getDrinking() { return drinking; }
	public void setDrinking(String drinking) { this.drinking = drinking; }

	public String getSmoking() { return smoking; }
	public void setSmoking(String smoking) { this.smoking = smoking; }

	public String getReligion() { return religion; }
	public void setReligion(String religion) { this.religion = religion; }

	public String getFoodPreference() { return food_preference; }
	public void setFoodPreference(String food_preference) { this.food_preference = food_preference; }

	public String getFaceType() { return face_type; }
	public void setFaceType(String face_type) { this.face_type = face_type; }

	public String getSkinType() { return skin_type; }
	public void setSkinType(String skin_type) { this.skin_type = skin_type; }

	public String getMilitaryStatus() { return military_status; }
	public void setMilitaryStatus(String military_status) { this.military_status = military_status; }

	public LocalDateTime getCreatedAt() { return created_at; }
	public void setCreatedAt(LocalDateTime created_at) { this.created_at = created_at; }
	
	public String getBodyType() { return body_type; }
	public void setBodyType(String body_type) { this.body_type = body_type; }
}