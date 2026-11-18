package com.app.silhouette.matching;

import java.time.LocalDateTime;


//IDEAL_MATCHING 테이블 한 행. 매칭을 확정할 때 INSERT에 사용

public class IdealMatchingDTO {

    private Integer ideal_Matching_Seq;
    private Integer member_Seq_1;        // 매칭을 확정한 쪽
    private Integer member_Seq_2;        // 대기 중이던 상대
    private Double score;
    private Double score_1_To_2;
    private Double score_2_To_1;
    private String status;               // MATCHED / ENDED / CANCELED
    private LocalDateTime matched_At;
    private LocalDateTime ended_At;
    private Integer chat_Room_Seq;       // 채팅방 생성 후 채워짐 (테이블 컬럼 아님)

    public IdealMatchingDTO() {
    }

    public Integer getIdeal_Matching_Seq() { return ideal_Matching_Seq; }
    public void setIdeal_Matching_Seq(Integer ideal_Matching_Seq) { this.ideal_Matching_Seq = ideal_Matching_Seq; }

    public Integer getMember_Seq_1() { return member_Seq_1; }
    public void setMember_Seq_1(Integer member_Seq_1) { this.member_Seq_1 = member_Seq_1; }

    public Integer getMember_Seq_2() { return member_Seq_2; }
    public void setMember_Seq_2(Integer member_Seq_2) { this.member_Seq_2 = member_Seq_2; }

    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }

    public Double getScore_1_To_2() { return score_1_To_2; }
    public void setScore_1_To_2(Double score_1_To_2) { this.score_1_To_2 = score_1_To_2; }

    public Double getScore_2_To_1() { return score_2_To_1; }
    public void setScore_2_To_1(Double score_2_To_1) { this.score_2_To_1 = score_2_To_1; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getMatched_At() { return matched_At; }
    public void setMatched_At(LocalDateTime matched_At) { this.matched_At = matched_At; }

    public LocalDateTime getEnded_At() { return ended_At; }
    public void setEnded_At(LocalDateTime ended_At) { this.ended_At = ended_At; }

    public Integer getChat_Room_Seq() { return chat_Room_Seq; }
    public void setChat_Room_Seq(Integer chat_Room_Seq) { this.chat_Room_Seq = chat_Room_Seq; }
}
