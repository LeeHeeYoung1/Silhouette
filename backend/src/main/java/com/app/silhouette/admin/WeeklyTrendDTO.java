package com.app.silhouette.admin;

/* 주간 추이 그래프의 한 주 */
public class WeeklyTrendDTO {

    private String week_start;     // 그 주 월요일 (yyyy-MM-dd)
    private int new_members;       // 신규 가입자 수
    private int active_members;    // 이용자 수
    private int attend_count;      // 이용 횟수
    private int blind_count;       // 블라인드 매칭 건수
    private int ideal_count;       // 이상형 매칭 건수

    public String getWeekStart() { return week_start; }
    public void setWeekStart(String week_start) { this.week_start = week_start; }

    public int getNewMembers() { return new_members; }
    public void setNewMembers(int new_members) { this.new_members = new_members; }

    public int getActiveMembers() { return active_members; }
    public void setActiveMembers(int active_members) { this.active_members = active_members; }

    public int getAttendCount() { return attend_count; }
    public void setAttendCount(int attend_count) { this.attend_count = attend_count; }

    public int getBlindCount() { return blind_count; }
    public void setBlindCount(int blind_count) { this.blind_count = blind_count; }

    public int getIdealCount() { return ideal_count; }
    public void setIdealCount(int ideal_count) { this.ideal_count = ideal_count; }
}