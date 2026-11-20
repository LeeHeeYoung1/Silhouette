package com.app.silhouette.live;

import java.util.Date;

// LIVE_REPORT + 관리자 목록 조회용 부가 정보
public class LiveReportDTO {

    private Long live_report_seq;
    private Long live_room_seq;
    private Long live_chat_seq;      // null이면 방송 신고, 있으면 채팅 신고
    private Long reporter_seq;
    private String reason;           // ADULT / ABUSE / SPAM / ETC
    private String detail;
    private String status;           // WAIT / DONE
    private Date created_at;

    // 조회용
    private String room_title;
    private String room_status;
    private Long host_seq;
    private String host_nickname;
    private String reporter_nickname;
    private String chat_content;
    private Long chat_member_seq;
    private String chat_member_nickname;

    public LiveReportDTO() {}

    public Long getLive_report_seq() { return live_report_seq; }
    public void setLive_report_seq(Long live_report_seq) { this.live_report_seq = live_report_seq; }

    public Long getLive_room_seq() { return live_room_seq; }
    public void setLive_room_seq(Long live_room_seq) { this.live_room_seq = live_room_seq; }

    public Long getLive_chat_seq() { return live_chat_seq; }
    public void setLive_chat_seq(Long live_chat_seq) { this.live_chat_seq = live_chat_seq; }

    public Long getReporter_seq() { return reporter_seq; }
    public void setReporter_seq(Long reporter_seq) { this.reporter_seq = reporter_seq; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getDetail() { return detail; }
    public void setDetail(String detail) { this.detail = detail; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Date getCreated_at() { return created_at; }
    public void setCreated_at(Date created_at) { this.created_at = created_at; }

    public String getRoom_title() { return room_title; }
    public void setRoom_title(String room_title) { this.room_title = room_title; }

    public String getRoom_status() { return room_status; }
    public void setRoom_status(String room_status) { this.room_status = room_status; }

    public Long getHost_seq() { return host_seq; }
    public void setHost_seq(Long host_seq) { this.host_seq = host_seq; }

    public String getHost_nickname() { return host_nickname; }
    public void setHost_nickname(String host_nickname) { this.host_nickname = host_nickname; }

    public String getReporter_nickname() { return reporter_nickname; }
    public void setReporter_nickname(String reporter_nickname) { this.reporter_nickname = reporter_nickname; }

    public String getChat_content() { return chat_content; }
    public void setChat_content(String chat_content) { this.chat_content = chat_content; }

    public Long getChat_member_seq() { return chat_member_seq; }
    public void setChat_member_seq(Long chat_member_seq) { this.chat_member_seq = chat_member_seq; }

    public String getChat_member_nickname() { return chat_member_nickname; }
    public void setChat_member_nickname(String chat_member_nickname) { this.chat_member_nickname = chat_member_nickname; }
}
