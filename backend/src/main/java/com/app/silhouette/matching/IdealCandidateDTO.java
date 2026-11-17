package com.app.silhouette.matching;





//후보 선정 쿼리 결과(상대 번호와 점수)를 담는다
public class IdealCandidateDTO {

    private Integer candidate_Seq;       // 선정된 상대 회원 번호
    private Double score_Me_To_Cand;     // 나 → 상대 점수
    private Double score_Cand_To_Me;     // 상대 → 나 점수
    private Double mutual_Score;         // 상호 점수

    public IdealCandidateDTO() {
    }

    public Integer getCandidate_Seq() { return candidate_Seq; }
    public void setCandidate_Seq(Integer candidate_Seq) { this.candidate_Seq = candidate_Seq; }

    public Double getScore_Me_To_Cand() { return score_Me_To_Cand; }
    public void setScore_Me_To_Cand(Double score_Me_To_Cand) { this.score_Me_To_Cand = score_Me_To_Cand; }

    public Double getScore_Cand_To_Me() { return score_Cand_To_Me; }
    public void setScore_Cand_To_Me(Double score_Cand_To_Me) { this.score_Cand_To_Me = score_Cand_To_Me; }

    public Double getMutual_Score() { return mutual_Score; }
    public void setMutual_Score(Double mutual_Score) { this.mutual_Score = mutual_Score; }
}
