package com.app.silhouette.report;

public class AdminReportDTO extends ReportDTO {

    private String reporter_name;       // 신고한 회원 닉네임
    private String reported_name;       // 신고당한 회원 닉네임
    private String reported_login_id;   // 신고당한 회원 아이디 (관리자만 봄)
    private Integer reported_count;     // 신고당한 회원의 누적 신고 횟수
    private String blacklisted;         // 지금 블랙리스트인지 'Y' / 'N'

    public String getReporterName() { return reporter_name; }
    public void setReporterName(String reporter_name) { this.reporter_name = reporter_name; }

    public String getReportedName() { return reported_name; }
    public void setReportedName(String reported_name) { this.reported_name = reported_name; }

    public String getReportedLoginId() { return reported_login_id; }
    public void setReportedLoginId(String reported_login_id) { this.reported_login_id = reported_login_id; }

    public Integer getReportedCount() { return reported_count; }
    public void setReportedCount(Integer reported_count) { this.reported_count = reported_count; }

    public String getBlacklisted() { return blacklisted; }
    public void setBlacklisted(String blacklisted) { this.blacklisted = blacklisted; }
}