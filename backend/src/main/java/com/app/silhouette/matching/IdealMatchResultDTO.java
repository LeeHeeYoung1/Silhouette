package com.app.silhouette.matching;

//매칭 신청 API가 프론트에 돌려주는 응답
public class IdealMatchResultDTO {

    private String status;               // WAITING(상대 대기 중) / MATCHED(매칭 성공) / IDLE(대기열에 없음)
    private Integer partner_Seq;         // 매칭된 상대 (WAITING이면 null)
    private Integer ideal_Matching_Seq;
    private Integer chat_Room_Seq;
    private Double score;

    public IdealMatchResultDTO() {
    }

    public IdealMatchResultDTO(String status, Integer partner_Seq, Integer ideal_Matching_Seq,
            Integer chat_Room_Seq, Double score) {
        this.status = status;
        this.partner_Seq = partner_Seq;
        this.ideal_Matching_Seq = ideal_Matching_Seq;
        this.chat_Room_Seq = chat_Room_Seq;
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

    public Integer getPartner_Seq() { return partner_Seq; }
    public void setPartner_Seq(Integer partner_Seq) { this.partner_Seq = partner_Seq; }

    public Integer getIdeal_Matching_Seq() { return ideal_Matching_Seq; }
    public void setIdeal_Matching_Seq(Integer ideal_Matching_Seq) { this.ideal_Matching_Seq = ideal_Matching_Seq; }

    public Integer getChat_Room_Seq() { return chat_Room_Seq; }
    public void setChat_Room_Seq(Integer chat_Room_Seq) { this.chat_Room_Seq = chat_Room_Seq; }

    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }
}
