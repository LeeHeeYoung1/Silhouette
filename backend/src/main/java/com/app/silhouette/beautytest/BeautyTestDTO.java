package com.app.silhouette.beautytest;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class BeautyTestDTO {

	// ===== BEAUTY_TEST 테이블 컬럼 =====
	private Long beauty_test_seq;       // 테스트 번호 (PK)
	private Long member_seq;            // 누가
	private Double score;               // 평균 AI 점수 (1.00 ~ 5.00)
	private Integer score100;           // 100점 환산
	private String grade;               // S / A / B / C / D
	private Integer photo_count;        // 평가한 사진 수 (1~4)
	private LocalDateTime created_at;   // 테스트 일시
	private LocalDateTime updated_at;   // 수정일

	// ===== DB 컬럼이 아닌 값 =====
	private List<Double> photo_scores = new ArrayList<>();   // 사진별 점수 (결과 화면 표시용, DB 저장 안 함)

	public BeautyTestDTO() {}

	public Long getBeautyTestSeq() { return beauty_test_seq; }
	public void setBeautyTestSeq(Long beauty_test_seq) { this.beauty_test_seq = beauty_test_seq; }

	public Long getMemberSeq() { return member_seq; }
	public void setMemberSeq(Long member_seq) { this.member_seq = member_seq; }

	public Double getScore() { return score; }
	public void setScore(Double score) { this.score = score; }

	public Integer getScore100() { return score100; }
	public void setScore100(Integer score100) { this.score100 = score100; }

	public String getGrade() { return grade; }
	public void setGrade(String grade) { this.grade = grade; }

	public Integer getPhotoCount() { return photo_count; }
	public void setPhotoCount(Integer photo_count) { this.photo_count = photo_count; }

	public LocalDateTime getCreatedAt() { return created_at; }
	public void setCreatedAt(LocalDateTime created_at) { this.created_at = created_at; }

	public LocalDateTime getUpdatedAt() { return updated_at; }
	public void setUpdatedAt(LocalDateTime updated_at) { this.updated_at = updated_at; }

	public List<Double> getPhotoScores() { return photo_scores; }
	public void setPhotoScores(List<Double> photo_scores) { this.photo_scores = photo_scores; }
}
