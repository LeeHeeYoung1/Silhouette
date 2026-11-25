package com.app.silhouette.admin;

/* 한 주의 요약 숫자 */
public class WeeklySummaryDTO {

    private int active_members;    // 이용자 수 (그 주에 출석한 회원 수, 관리자 제외)
    private int attend_count;      // 이용 횟수 (출석 건수)
    private int new_members;       // 신규 가입자 수
    private int blind_count;       // 블라인드 매칭 성사 건수
    private int blind_continued;   // 그중 둘 다 GO를 선택한 건수
    private int ideal_count;       // 이상형 매칭 성사 건수

    public int getActiveMembers() { return active_members; }
    public void setActiveMembers(int active_members) { this.active_members = active_members; }

    public int getAttendCount() { return attend_count; }
    public void setAttendCount(int attend_count) { this.attend_count = attend_count; }

    public int getNewMembers() { return new_members; }
    public void setNewMembers(int new_members) { this.new_members = new_members; }

    public int getBlindCount() { return blind_count; }
    public void setBlindCount(int blind_count) { this.blind_count = blind_count; }

    public int getBlindContinued() { return blind_continued; }
    public void setBlindContinued(int blind_continued) { this.blind_continued = blind_continued; }

    public int getIdealCount() { return ideal_count; }
    public void setIdealCount(int ideal_count) { this.ideal_count = ideal_count; }
}