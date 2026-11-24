package com.app.silhouette.blind;

// 매칭 대기열 등록에 필요한 회원 정보
public class BlindQueueMemberDTO {

    private Long member_seq;
    private String gender;

    public BlindQueueMemberDTO() {
    }

    public Long getMemberSeq() { return member_seq; }
    public void setMemberSeq(Long member_seq) { this.member_seq = member_seq; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
}
