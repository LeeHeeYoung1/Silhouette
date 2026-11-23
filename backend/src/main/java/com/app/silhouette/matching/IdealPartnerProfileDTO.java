package com.app.silhouette.matching;

// 이상형 매칭 / 블라인드(둘 다 GO) 채팅방 사이드에 보여줄 상대 프로필
public class IdealPartnerProfileDTO {

    private String roomType;       // IDEAL / BLIND
    private String nickname;
    private Integer age;
    private String mbti;
    private String job;
    private String introduction;
    private String hobby;          // 쉼표로 구분 ("운동,여행,카페")

    public IdealPartnerProfileDTO() {
    }

    public String getRoomType() { return roomType; }
    public void setRoomType(String roomType) { this.roomType = roomType; }

    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public String getMbti() { return mbti; }
    public void setMbti(String mbti) { this.mbti = mbti; }

    public String getJob() { return job; }
    public void setJob(String job) { this.job = job; }

    public String getIntroduction() { return introduction; }
    public void setIntroduction(String introduction) { this.introduction = introduction; }

    public String getHobby() { return hobby; }
    public void setHobby(String hobby) { this.hobby = hobby; }
}
