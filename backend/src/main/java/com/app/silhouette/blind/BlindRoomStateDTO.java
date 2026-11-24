package com.app.silhouette.blind;

// GET /api/blind/room/{room_seq} 응답: 블라인드 채팅방의 현재 상태 (요청한 사람 기준)
public class BlindRoomStateDTO {

    private Long room_seq;
    private int my_slot;                   // 1 / 2 (메시지의 senderSlot과 비교해 내 메시지 구분)
    private String phase;                 // CHAT(대화 중) / VOTE(GO·STOP 선택 중) / DONE(결론 남)
    private long remaining_seconds;        // 대화 남은 시간
    private long vote_remaining_seconds;    // 투표 남은 시간 (CHAT 단계에서는 투표시간 전체)
    private int time_limit_min;
    private int vote_seconds;              // 투표시간 전체 (진행바 표시용)
    private String my_vote;                // GO / STOP / LEFT / null
    private String result;                // CONTINUED / ENDED (DONE일 때만)
    private String end_reason;             // ENDED일 때: MINE / PARTNER_STOP / PARTNER_LEFT / TIMEOUT
    private Long linked_chat_room_seq;       // CONTINUED일 때 이동할 일반 채팅방

    public BlindRoomStateDTO() {
    }

    public Long getRoomSeq() { return room_seq; }
    public void setRoomSeq(Long room_seq) { this.room_seq = room_seq; }

    public int getMySlot() { return my_slot; }
    public void setMySlot(int my_slot) { this.my_slot = my_slot; }

    public String getPhase() { return phase; }
    public void setPhase(String phase) { this.phase = phase; }

    public long getRemainingSeconds() { return remaining_seconds; }
    public void setRemainingSeconds(long remaining_seconds) { this.remaining_seconds = remaining_seconds; }

    public long getVoteRemainingSeconds() { return vote_remaining_seconds; }
    public void setVoteRemainingSeconds(long vote_remaining_seconds) { this.vote_remaining_seconds = vote_remaining_seconds; }

    public int getTimeLimitMin() { return time_limit_min; }
    public void setTimeLimitMin(int time_limit_min) { this.time_limit_min = time_limit_min; }

    public int getVoteSeconds() { return vote_seconds; }
    public void setVoteSeconds(int vote_seconds) { this.vote_seconds = vote_seconds; }

    public String getMyVote() { return my_vote; }
    public void setMyVote(String my_vote) { this.my_vote = my_vote; }

    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }

    public String getEndReason() { return end_reason; }
    public void setEndReason(String end_reason) { this.end_reason = end_reason; }

    public Long getLinkedChatRoomSeq() { return linked_chat_room_seq; }
    public void setLinkedChatRoomSeq(Long linked_chat_room_seq) { this.linked_chat_room_seq = linked_chat_room_seq; }
}
