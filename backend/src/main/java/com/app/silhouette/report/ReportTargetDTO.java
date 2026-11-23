package com.app.silhouette.report;

public class ReportTargetDTO {

    private Long member_seq;      // 작성자
    private String board_type;    // 게시글일 때만 (FREE / ANON)
    private String title;         // 게시글일 때만
    private String content;
    private String is_deleted;

    public Long getMemberSeq() { return member_seq; }
    public void setMemberSeq(Long member_seq) { this.member_seq = member_seq; }

    public String getBoardType() { return board_type; }
    public void setBoardType(String board_type) { this.board_type = board_type; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getIsDeleted() { return is_deleted; }
    public void setIsDeleted(String is_deleted) { this.is_deleted = is_deleted; }
}