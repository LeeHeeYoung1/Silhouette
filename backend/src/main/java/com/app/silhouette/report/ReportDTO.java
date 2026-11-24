package com.app.silhouette.report;

import java.time.LocalDateTime;

public class ReportDTO {

    private Long report_seq;
    private Long reporter_seq;        // 신고한 회원
    private Long reported_seq;        // 신고당한 회원 (화면에는 절대 안 보냄)
    private String target_type;       // POST / COMMENT
    private Long target_seq;          // POST_SEQ 또는 POST_COMMENT_SEQ
    private String reason_type;       // SPAM / ABUSE / OBSCENE / FRAUD / PRIVACY / ETC
    private String reason_detail;
    private String target_content;    // 신고 당시 내용 사본
    private String status;            // WAITING / DONE / REJECTED
    private Long admin_seq;
    private String admin_memo;
    private LocalDateTime processed_at;
    private LocalDateTime created_at;
    private LocalDateTime updated_at;

    public Long getReportSeq() { return report_seq; }
    public void setReportSeq(Long report_seq) { this.report_seq = report_seq; }

    public Long getReporterSeq() { return reporter_seq; }
    public void setReporterSeq(Long reporter_seq) { this.reporter_seq = reporter_seq; }

    public Long getReportedSeq() { return reported_seq; }
    public void setReportedSeq(Long reported_seq) { this.reported_seq = reported_seq; }

    public String getTargetType() { return target_type; }
    public void setTargetType(String target_type) { this.target_type = target_type; }

    public Long getTargetSeq() { return target_seq; }
    public void setTargetSeq(Long target_seq) { this.target_seq = target_seq; }

    public String getReasonType() { return reason_type; }
    public void setReasonType(String reason_type) { this.reason_type = reason_type; }

    public String getReasonDetail() { return reason_detail; }
    public void setReasonDetail(String reason_detail) { this.reason_detail = reason_detail; }

    public String getTargetContent() { return target_content; }
    public void setTargetContent(String target_content) { this.target_content = target_content; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getAdminSeq() { return admin_seq; }
    public void setAdminSeq(Long admin_seq) { this.admin_seq = admin_seq; }

    public String getAdminMemo() { return admin_memo; }
    public void setAdminMemo(String admin_memo) { this.admin_memo = admin_memo; }

    public LocalDateTime getProcessedAt() { return processed_at; }
    public void setProcessedAt(LocalDateTime processed_at) { this.processed_at = processed_at; }

    public LocalDateTime getCreatedAt() { return created_at; }
    public void setCreatedAt(LocalDateTime created_at) { this.created_at = created_at; }

    public LocalDateTime getUpdatedAt() { return updated_at; }
    public void setUpdatedAt(LocalDateTime updated_at) { this.updated_at = updated_at; }
}