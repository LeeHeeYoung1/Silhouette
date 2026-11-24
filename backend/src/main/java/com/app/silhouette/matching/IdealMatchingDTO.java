package com.app.silhouette.matching;

import java.time.LocalDateTime;


//IDEAL_MATCHING 테이블 한 행. 매칭을 확정할 때 INSERT에 사용

public class IdealMatchingDTO {

    private Integer ideal_matching_seq;
    private Integer member_seq_1;        // 매칭을 확정한 쪽
    private Integer member_seq_2;        // 대기 중이던 상대
    private Double score;
    private Double score_1_to_2;
    private Double score_2_to_1;
    private String status;               // MATCHED / ENDED / CANCELED
    private LocalDateTime matched_at;
    private LocalDateTime ended_at;
    private Integer chat_room_seq;       // 채팅방 생성 후 채워짐 (테이블 컬럼 아님)

    public IdealMatchingDTO() {
    }

    public Integer getIdealMatchingSeq() { return ideal_matching_seq; }
    public void setIdealMatchingSeq(Integer ideal_matching_seq) { this.ideal_matching_seq = ideal_matching_seq; }

    public Integer getMemberSeq1() { return member_seq_1; }
    public void setMemberSeq1(Integer member_seq_1) { this.member_seq_1 = member_seq_1; }

    public Integer getMemberSeq2() { return member_seq_2; }
    public void setMemberSeq2(Integer member_seq_2) { this.member_seq_2 = member_seq_2; }

    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }

    public Double getScore1To2() { return score_1_to_2; }
    public void setScore1To2(Double score_1_to_2) { this.score_1_to_2 = score_1_to_2; }

    public Double getScore2To1() { return score_2_to_1; }
    public void setScore2To1(Double score_2_to_1) { this.score_2_to_1 = score_2_to_1; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getMatchedAt() { return matched_at; }
    public void setMatchedAt(LocalDateTime matched_at) { this.matched_at = matched_at; }

    public LocalDateTime getEndedAt() { return ended_at; }
    public void setEndedAt(LocalDateTime ended_at) { this.ended_at = ended_at; }

    public Integer getChatRoomSeq() { return chat_room_seq; }
    public void setChatRoomSeq(Integer chat_room_seq) { this.chat_room_seq = chat_room_seq; }
}
