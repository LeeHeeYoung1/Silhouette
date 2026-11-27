package com.app.silhouette.nearby;

// 내 주변 추천 목록의 회원 한 명
// 개인정보 보호를 위해 전체 주소 대신 "시·도 + 시·군·구"까지만 내려준다
public class NearbyMemberDTO {

    private Long member_seq;
    private String nickname;
    private Integer age;
    private String region;        // 예: "서울 강남구"
    private Integer near_rank;     // 1: 같은 시·군·구, 2: 같은 시·도
    private String introduction;
    private String mbti;
    private String job;
    private String profile_image;

    public NearbyMemberDTO() {
    }

    public Long getMemberSeq() { return member_seq; }
    public void setMemberSeq(Long member_seq) { this.member_seq = member_seq; }

    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }

    public Integer getNearRank() { return near_rank; }
    public void setNearRank(Integer near_rank) { this.near_rank = near_rank; }

    public String getIntroduction() { return introduction; }
    public void setIntroduction(String introduction) { this.introduction = introduction; }

    public String getMbti() { return mbti; }
    public void setMbti(String mbti) { this.mbti = mbti; }

    public String getJob() { return job; }
    public void setJob(String job) { this.job = job; }

    public String getProfileImage() { return profile_image; }
    public void setProfileImage(String profile_image) { this.profile_image = profile_image; }

    public String getProfile_image() { return profile_image; }
    public void setProfile_image(String profile_image) { this.profile_image = profile_image; }
}