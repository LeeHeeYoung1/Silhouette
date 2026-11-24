package com.app.silhouette.matching;





//후보 선정 쿼리 결과(상대 번호와 점수)를 담는다
public class IdealCandidateDTO {

    private Integer candidate_seq;       // 선정된 상대 회원 번호
    private Double score_me_to_cand;     // 나 → 상대 점수
    private Double score_cand_to_me;     // 상대 → 나 점수
    private Double mutual_score;         // 상호 점수

    public IdealCandidateDTO() {
    }

    public Integer getCandidateSeq() { return candidate_seq; }
    public void setCandidateSeq(Integer candidate_seq) { this.candidate_seq = candidate_seq; }

    public Double getScoreMeToCand() { return score_me_to_cand; }
    public void setScoreMeToCand(Double score_me_to_cand) { this.score_me_to_cand = score_me_to_cand; }

    public Double getScoreCandToMe() { return score_cand_to_me; }
    public void setScoreCandToMe(Double score_cand_to_me) { this.score_cand_to_me = score_cand_to_me; }

    public Double getMutualScore() { return mutual_score; }
    public void setMutualScore(Double mutual_score) { this.mutual_score = mutual_score; }
}
