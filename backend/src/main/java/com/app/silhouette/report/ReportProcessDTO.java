package com.app.silhouette.report;

public class ReportProcessDTO {

    private String action;              // REJECT 반려 / DONE 처리
    private String admin_memo;          // 처리 메모
    private Boolean delete_target;      // 신고된 글·댓글 삭제할지
    private Boolean blacklist;          // 블랙리스트 지정할지
    private Integer blacklist_days;     // 7 / 30 / 0(영구)
    private String blacklist_reason;    // 블랙리스트 사유

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getAdminMemo() { return admin_memo; }
    public void setAdminMemo(String admin_memo) { this.admin_memo = admin_memo; }

    public Boolean getDeleteTarget() { return delete_target; }
    public void setDeleteTarget(Boolean delete_target) { this.delete_target = delete_target; }

    public Boolean getBlacklist() { return blacklist; }
    public void setBlacklist(Boolean blacklist) { this.blacklist = blacklist; }

    public Integer getBlacklistDays() { return blacklist_days; }
    public void setBlacklistDays(Integer blacklist_days) { this.blacklist_days = blacklist_days; }

    public String getBlacklistReason() { return blacklist_reason; }
    public void setBlacklistReason(String blacklist_reason) { this.blacklist_reason = blacklist_reason; }
}