package com.app.silhouette.blind;

// GET /api/blind/room/{roomSeq} 응답: 블라인드 채팅방의 현재 상태 (요청한 사람 기준)
public class BlindRoomStateDTO {

    private Long roomSeq;
    private int mySlot;                   // 1 / 2 (메시지의 senderSlot과 비교해 내 메시지 구분)
    private String phase;                 // CHAT(대화 중) / VOTE(GO·STOP 선택 중) / DONE(결론 남)
    private long remainingSeconds;        // 대화 남은 시간
    private long voteRemainingSeconds;    // 투표 남은 시간 (CHAT 단계에서는 투표시간 전체)
    private int timeLimitMin;
    private int voteSeconds;              // 투표시간 전체 (진행바 표시용)
    private String myVote;                // GO / STOP / LEFT / null
    private String result;                // CONTINUED / ENDED (DONE일 때만)
    private String endReason;             // ENDED일 때: MINE / PARTNER_STOP / PARTNER_LEFT / TIMEOUT
    private Long linkedChatRoomSeq;       // CONTINUED일 때 이동할 일반 채팅방

    public BlindRoomStateDTO() {
    }

    public Long getRoomSeq() { return roomSeq; }
    public void setRoomSeq(Long roomSeq) { this.roomSeq = roomSeq; }

    public int getMySlot() { return mySlot; }
    public void setMySlot(int mySlot) { this.mySlot = mySlot; }

    public String getPhase() { return phase; }
    public void setPhase(String phase) { this.phase = phase; }

    public long getRemainingSeconds() { return remainingSeconds; }
    public void setRemainingSeconds(long remainingSeconds) { this.remainingSeconds = remainingSeconds; }

    public long getVoteRemainingSeconds() { return voteRemainingSeconds; }
    public void setVoteRemainingSeconds(long voteRemainingSeconds) { this.voteRemainingSeconds = voteRemainingSeconds; }

    public int getTimeLimitMin() { return timeLimitMin; }
    public void setTimeLimitMin(int timeLimitMin) { this.timeLimitMin = timeLimitMin; }

    public int getVoteSeconds() { return voteSeconds; }
    public void setVoteSeconds(int voteSeconds) { this.voteSeconds = voteSeconds; }

    public String getMyVote() { return myVote; }
    public void setMyVote(String myVote) { this.myVote = myVote; }

    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }

    public String getEndReason() { return endReason; }
    public void setEndReason(String endReason) { this.endReason = endReason; }

    public Long getLinkedChatRoomSeq() { return linkedChatRoomSeq; }
    public void setLinkedChatRoomSeq(Long linkedChatRoomSeq) { this.linkedChatRoomSeq = linkedChatRoomSeq; }
}
