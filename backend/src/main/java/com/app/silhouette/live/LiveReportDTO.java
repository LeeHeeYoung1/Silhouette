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

    public Long getLiveReportSeq() { return live_report_seq; }
    public void setLiveReportSeq(Long live_report_seq) { this.live_report_seq = live_report_seq; }

    public Long getLiveRoomSeq() { return live_room_seq; }
    public void setLiveRoomSeq(Long live_room_seq) { this.live_room_seq = live_room_seq; }

    public Long getLiveChatSeq() { return live_chat_seq; }
    public void setLiveChatSeq(Long live_chat_seq) { this.live_chat_seq = live_chat_seq; }

    public Long getReporterSeq() { return reporter_seq; }
    public void setReporterSeq(Long reporter_seq) { this.reporter_seq = reporter_seq; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getDetail() { return detail; }
    public void setDetail(String detail) { this.detail = detail; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Date getCreatedAt() { return created_at; }
    public void setCreatedAt(Date created_at) { this.created_at = created_at; }

    public String getRoomTitle() { return room_title; }
    public void setRoomTitle(String room_title) { this.room_title = room_title; }

    public String getRoomStatus() { return room_status; }
    public void setRoomStatus(String room_status) { this.room_status = room_status; }

    public Long getHostSeq() { return host_seq; }
    public void setHostSeq(Long host_seq) { this.host_seq = host_seq; }

    public String getHostNickname() { return host_nickname; }
    public void setHostNickname(String host_nickname) { this.host_nickname = host_nickname; }

    public String getReporterNickname() { return reporter_nickname; }
    public void setReporterNickname(String reporter_nickname) { this.reporter_nickname = reporter_nickname; }

    public String getChatContent() { return chat_content; }
    public void setChatContent(String chat_content) { this.chat_content = chat_content; }

    public Long getChatMemberSeq() { return chat_member_seq; }
    public void setChatMemberSeq(Long chat_member_seq) { this.chat_member_seq = chat_member_seq; }

    public String getChatMemberNickname() { return chat_member_nickname; }
    public void setChatMemberNickname(String chat_member_nickname) { this.chat_member_nickname = chat_member_nickname; }
}
