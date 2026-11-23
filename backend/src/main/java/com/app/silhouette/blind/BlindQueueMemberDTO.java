package com.app.silhouette.blind;

// 매칭 대기열 등록에 필요한 회원 정보
public class BlindQueueMemberDTO {

    private Long memberSeq;
    private String gender;

    public BlindQueueMemberDTO() {
    }

    public Long getMemberSeq() { return memberSeq; }
    public void setMemberSeq(Long memberSeq) { this.memberSeq = memberSeq; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
}
