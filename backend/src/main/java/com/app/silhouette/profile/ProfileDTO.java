package com.app.silhouette.profile;

import java.time.LocalDateTime;

public class ProfileDTO {

	// ===== 회원 기본 정보 (MEMBER, 읽기만) =====
	private Long memberSeq;
	private String loginId;
	private String nickname;
	private String gender;
	private Integer age;              // 생년월일로 계산한 만 나이

	// ===== 나의 정보 (MEMBER_PROFILE) =====
	private Long memberProfileSeq;
	private String mbti;
	private String job;
	private Integer height;
	private Integer weight;
	private String introduction;
	private String loveType;
	private String hobby;
	private String favorite;
	private String dislike;
	private String drinking;
	private String smoking;
	private String religion;
	private String foodPreference;
	private String faceType;
	private String skinType;
	private String militaryStatus;    // 병역 (남성만: 군필, 미필, 복무 중, 면제)
	private LocalDateTime createdAt;

	public ProfileDTO() {}

	public Long getMemberSeq() { return memberSeq; }
	public void setMemberSeq(Long memberSeq) { this.memberSeq = memberSeq; }

	public String getLoginId() { return loginId; }
	public void setLoginId(String loginId) { this.loginId = loginId; }

	public String getNickname() { return nickname; }
	public void setNickname(String nickname) { this.nickname = nickname; }

	public String getGender() { return gender; }
	public void setGender(String gender) { this.gender = gender; }

	public Integer getAge() { return age; }
	public void setAge(Integer age) { this.age = age; }

	public Long getMemberProfileSeq() { return memberProfileSeq; }
	public void setMemberProfileSeq(Long memberProfileSeq) { this.memberProfileSeq = memberProfileSeq; }

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

	public String getLoveType() { return loveType; }
	public void setLoveType(String loveType) { this.loveType = loveType; }

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

	public String getFoodPreference() { return foodPreference; }
	public void setFoodPreference(String foodPreference) { this.foodPreference = foodPreference; }

	public String getFaceType() { return faceType; }
	public void setFaceType(String faceType) { this.faceType = faceType; }

	public String getSkinType() { return skinType; }
	public void setSkinType(String skinType) { this.skinType = skinType; }

	public String getMilitaryStatus() { return militaryStatus; }
	public void setMilitaryStatus(String militaryStatus) { this.militaryStatus = militaryStatus; }

	public LocalDateTime getCreatedAt() { return createdAt; }
	public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}