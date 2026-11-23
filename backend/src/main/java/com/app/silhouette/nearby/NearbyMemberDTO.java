package com.app.silhouette.nearby;

// 내 주변 추천 목록의 회원 한 명
// 개인정보 보호를 위해 전체 주소 대신 "시·도 + 시·군·구"까지만 내려준다
public class NearbyMemberDTO {

    private Long memberSeq;
    private String nickname;
    private Integer age;
    private String region;        // 예: "서울 강남구"
    private Integer nearRank;     // 1: 같은 시·군·구, 2: 같은 시·도
    private String introduction;
    private String mbti;
    private String job;

    public NearbyMemberDTO() {
    }

    public Long getMemberSeq() { return memberSeq; }
    public void setMemberSeq(Long memberSeq) { this.memberSeq = memberSeq; }

    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }

    public Integer getNearRank() { return nearRank; }
    public void setNearRank(Integer nearRank) { this.nearRank = nearRank; }

    public String getIntroduction() { return introduction; }
    public void setIntroduction(String introduction) { this.introduction = introduction; }

    public String getMbti() { return mbti; }
    public void setMbti(String mbti) { this.mbti = mbti; }

    public String getJob() { return job; }
    public void setJob(String job) { this.job = job; }
}