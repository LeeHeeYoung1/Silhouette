package com.app.silhouette.matching;

//매칭 신청 API가 프론트에 돌려주는 응답
public class IdealMatchResultDTO {

    private String status;               // WAITING(상대 대기 중) / MATCHED(매칭 성공) / IDLE(대기열에 없음)
    private Integer partner_seq;         // 매칭된 상대 (WAITING이면 null)
    private Integer ideal_matching_seq;
    private Integer chat_room_seq;
    private Double score;

    public IdealMatchResultDTO() {
    }

    public IdealMatchResultDTO(String status, Integer partner_seq, Integer ideal_matching_seq,
            Integer chat_room_seq, Double score) {
        this.status = status;
        this.partner_seq = partner_seq;
        this.ideal_matching_seq = ideal_matching_seq;
        this.chat_room_seq = chat_room_seq;
        this.score = score;
    }

    // 아직 상대를 못 찾았을 때
    public static IdealMatchResultDTO waiting() {
        return new IdealMatchResultDTO("WAITING", null, null, null, null);
    }

    // 대기열에 없을 때 (취소했거나 처음 상태)
    public static IdealMatchResultDTO idle() {
        return new IdealMatchResultDTO("IDLE", null, null, null, null);
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getPartnerSeq() { return partner_seq; }
    public void setPartnerSeq(Integer partner_seq) { this.partner_seq = partner_seq; }

    public Integer getIdealMatchingSeq() { return ideal_matching_seq; }
    public void setIdealMatchingSeq(Integer ideal_matching_seq) { this.ideal_matching_seq = ideal_matching_seq; }

    public Integer getChatRoomSeq() { return chat_room_seq; }
    public void setChatRoomSeq(Integer chat_room_seq) { this.chat_room_seq = chat_room_seq; }

    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }
}
