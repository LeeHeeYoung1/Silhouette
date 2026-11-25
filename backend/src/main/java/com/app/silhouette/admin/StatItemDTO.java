package com.app.silhouette.admin;

/* 대시보드 비율 항목 한 줄 (예: 성별 MALE 3명 50.0%) */
public class StatItemDTO {

    private String label;   // 구분 값 (MALE, 20대, 서울 …)
    private int cnt;        // 인원 수
    private double pct;     // 전체 대비 비율 (%)

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public int getCnt() { return cnt; }
    public void setCnt(int cnt) { this.cnt = cnt; }

    public double getPct() { return pct; }
    public void setPct(double pct) { this.pct = pct; }
}