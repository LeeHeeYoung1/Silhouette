package com.app.silhouette.report;

import java.time.LocalDateTime;

public class BlacklistDTO {

    private Long blacklist_seq;
    private Long member_seq;
    private Long admin_seq;
    private Long report_seq;
    private String reason;
    private LocalDateTime start_at;
    private LocalDateTime end_at;          // null이면 영구
    private LocalDateTime released_at;
    private Long released_by;
    private LocalDateTime created_at;
    private LocalDateTime updated_at;

    // 화면용
    private String member_name;
    private String member_login_id;
    private String admin_name;
    private String active;                 // 지금 적용 중인지 'Y' / 'N'
    private Integer days;                  // 등록할 때만 사용 (0 = 영구)

    public Long getBlacklistSeq() { return blacklist_seq; }
    public void setBlacklistSeq(Long blacklist_seq) { this.blacklist_seq = blacklist_seq; }

    public Long getMemberSeq() { return member_seq; }
    public void setMemberSeq(Long member_seq) { this.member_seq = member_seq; }

    public Long getAdminSeq() { return admin_seq; }
    public void setAdminSeq(Long admin_seq) { this.admin_seq = admin_seq; }

    public Long getReportSeq() { return report_seq; }
    public void setReportSeq(Long report_seq) { this.report_seq = report_seq; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public LocalDateTime getStartAt() { return start_at; }
    public void setStartAt(LocalDateTime start_at) { this.start_at = start_at; }

    public LocalDateTime getEndAt() { return end_at; }
    public void setEndAt(LocalDateTime end_at) { this.end_at = end_at; }

    public LocalDateTime getReleasedAt() { return released_at; }
    public void setReleasedAt(LocalDateTime released_at) { this.released_at = released_at; }

    public Long getReleasedBy() { return released_by; }
    public void setReleasedBy(Long released_by) { this.released_by = released_by; }

    public LocalDateTime getCreatedAt() { return created_at; }
    public void setCreatedAt(LocalDateTime created_at) { this.created_at = created_at; }

    public LocalDateTime getUpdatedAt() { return updated_at; }
    public void setUpdatedAt(LocalDateTime updated_at) { this.updated_at = updated_at; }

    public String getMemberName() { return member_name; }
    public void setMemberName(String member_name) { this.member_name = member_name; }

    public String getMemberLoginId() { return member_login_id; }
    public void setMemberLoginId(String member_login_id) { this.member_login_id = member_login_id; }

    public String getAdminName() { return admin_name; }
    public void setAdminName(String admin_name) { this.admin_name = admin_name; }

    public String getActive() { return active; }
    public void setActive(String active) { this.active = active; }

    public Integer getDays() { return days; }
    public void setDays(Integer days) { this.days = days; }
}