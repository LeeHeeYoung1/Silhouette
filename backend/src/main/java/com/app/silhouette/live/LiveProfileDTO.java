package com.app.silhouette.live;

// 라이브 화면 프로필 모달용 (방송자·채팅 닉네임 클릭)
public class LiveProfileDTO {

    private Long member_seq;
    private String nickname;
    private String gender;
    private String mbti;
    private Integer height;
    private String drinking;
    private String smoking;
    private String religion;

    public LiveProfileDTO() {}

    public Long getMemberSeq() { return member_seq; }
    public void setMemberSeq(Long member_seq) { this.member_seq = member_seq; }

    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getMbti() { return mbti; }
    public void setMbti(String mbti) { this.mbti = mbti; }

    public Integer getHeight() { return height; }
    public void setHeight(Integer height) { this.height = height; }

    public String getDrinking() { return drinking; }
    public void setDrinking(String drinking) { this.drinking = drinking; }

    public String getSmoking() { return smoking; }
    public void setSmoking(String smoking) { this.smoking = smoking; }

    public String getReligion() { return religion; }
    public void setReligion(String religion) { this.religion = religion; }
}
