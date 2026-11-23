package com.app.silhouette.blind;

import java.sql.Timestamp;

// 블라인드 채팅방 + 매칭 정보 한 묶음 (BLIND_CHAT_ROOM JOIN BLIND_MATCHING)
// 방 생성(INSERT)과 조회(SELECT) 모두에 사용
public class BlindRoomDTO {

    private Long blindChatRoomSeq;
    private Long blindMatchingSeq;
    private Long linkedChatRoomSeq;   // 둘 다 GO일 때 만들어진 일반 채팅방
    private Integer timeLimitMin;
    private Timestamp expireAt;       // 채팅 종료 시각 (이후 투표시간 시작)
    private String status;            // ON AIR / CONTINUED / ENDED
    private Long memberSeq1;          // 슬롯 1
    private Long memberSeq2;          // 슬롯 2
    private String vote1;             // GO / STOP / LEFT / null
    private String vote2;
    private Timestamp dbNow;          // 조회 시점의 DB 시각 (서버·DB 시간차 없이 남은 시간 계산)

    public BlindRoomDTO() {
    }

    // 회원 번호 → 슬롯(1/2), 참여자가 아니면 0
    public int slotOf(long memberSeq) {
        if (memberSeq1 != null && memberSeq1 == memberSeq) return 1;
        if (memberSeq2 != null && memberSeq2 == memberSeq) return 2;
        return 0;
    }

    public String voteOf(int slot) {
        return slot == 1 ? vote1 : vote2;
    }

    public Long getBlindChatRoomSeq() { return blindChatRoomSeq; }
    public void setBlindChatRoomSeq(Long blindChatRoomSeq) { this.blindChatRoomSeq = blindChatRoomSeq; }

    public Long getBlindMatchingSeq() { return blindMatchingSeq; }
    public void setBlindMatchingSeq(Long blindMatchingSeq) { this.blindMatchingSeq = blindMatchingSeq; }

    public Long getLinkedChatRoomSeq() { return linkedChatRoomSeq; }
    public void setLinkedChatRoomSeq(Long linkedChatRoomSeq) { this.linkedChatRoomSeq = linkedChatRoomSeq; }

    public Integer getTimeLimitMin() { return timeLimitMin; }
    public void setTimeLimitMin(Integer timeLimitMin) { this.timeLimitMin = timeLimitMin; }

    public Timestamp getExpireAt() { return expireAt; }
    public void setExpireAt(Timestamp expireAt) { this.expireAt = expireAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getMemberSeq1() { return memberSeq1; }
    public void setMemberSeq1(Long memberSeq1) { this.memberSeq1 = memberSeq1; }

    public Long getMemberSeq2() { return memberSeq2; }
    public void setMemberSeq2(Long memberSeq2) { this.memberSeq2 = memberSeq2; }

    public String getVote1() { return vote1; }
    public void setVote1(String vote1) { this.vote1 = vote1; }

    public String getVote2() { return vote2; }
    public void setVote2(String vote2) { this.vote2 = vote2; }

    public Timestamp getDbNow() { return dbNow; }
    public void setDbNow(Timestamp dbNow) { this.dbNow = dbNow; }
}
