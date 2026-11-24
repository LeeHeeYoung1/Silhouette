package com.app.silhouette.blind;

import java.sql.Timestamp;

// 블라인드 채팅방 + 매칭 정보 한 묶음 (BLIND_CHAT_ROOM JOIN BLIND_MATCHING)
// 방 생성(INSERT)과 조회(SELECT) 모두에 사용
public class BlindRoomDTO {

    private Long blind_chat_room_seq;
    private Long blind_matching_seq;
    private Long linked_chat_room_seq;   // 둘 다 GO일 때 만들어진 일반 채팅방
    private Integer time_limit_min;
    private Timestamp expire_at;       // 채팅 종료 시각 (이후 투표시간 시작)
    private String status;            // ON AIR / CONTINUED / ENDED
    private Long member_seq_1;          // 슬롯 1
    private Long member_seq_2;          // 슬롯 2
    private String vote_1;             // GO / STOP / LEFT / null
    private String vote_2;
    private Timestamp db_now;          // 조회 시점의 DB 시각 (서버·DB 시간차 없이 남은 시간 계산)

    public BlindRoomDTO() {
    }

    // 회원 번호 → 슬롯(1/2), 참여자가 아니면 0
    public int slotOf(long memberSeq) {
        if (member_seq_1 != null && member_seq_1 == memberSeq) return 1;
        if (member_seq_2 != null && member_seq_2 == memberSeq) return 2;
        return 0;
    }

    public String voteOf(int slot) {
        return slot == 1 ? vote_1 : vote_2;
    }

    public Long getBlindChatRoomSeq() { return blind_chat_room_seq; }
    public void setBlindChatRoomSeq(Long blind_chat_room_seq) { this.blind_chat_room_seq = blind_chat_room_seq; }

    public Long getBlindMatchingSeq() { return blind_matching_seq; }
    public void setBlindMatchingSeq(Long blind_matching_seq) { this.blind_matching_seq = blind_matching_seq; }

    public Long getLinkedChatRoomSeq() { return linked_chat_room_seq; }
    public void setLinkedChatRoomSeq(Long linked_chat_room_seq) { this.linked_chat_room_seq = linked_chat_room_seq; }

    public Integer getTimeLimitMin() { return time_limit_min; }
    public void setTimeLimitMin(Integer time_limit_min) { this.time_limit_min = time_limit_min; }

    public Timestamp getExpireAt() { return expire_at; }
    public void setExpireAt(Timestamp expire_at) { this.expire_at = expire_at; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getMemberSeq1() { return member_seq_1; }
    public void setMemberSeq1(Long member_seq_1) { this.member_seq_1 = member_seq_1; }

    public Long getMemberSeq2() { return member_seq_2; }
    public void setMemberSeq2(Long member_seq_2) { this.member_seq_2 = member_seq_2; }

    public String getVote1() { return vote_1; }
    public void setVote1(String vote_1) { this.vote_1 = vote_1; }

    public String getVote2() { return vote_2; }
    public void setVote2(String vote_2) { this.vote_2 = vote_2; }

    public Timestamp getDbNow() { return db_now; }
    public void setDbNow(Timestamp db_now) { this.db_now = db_now; }
}
