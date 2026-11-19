package com.app.silhouette.chatting;

import java.util.Date;

public class ChattingParticipantDTO {
    private Long chat_participant_seq;
    private Long chat_room_seq;
    private Long member_seq;
    private String participant_role;
    private String participant_status;
    private Date joined_at;
    private Date left_at;

    public ChattingParticipantDTO() {}

    public Long getChat_participant_seq() { return chat_participant_seq; }
    public void setChat_participant_seq(Long chat_participant_seq) { this.chat_participant_seq = chat_participant_seq; }

    public Long getChat_room_seq() { return chat_room_seq; }
    public void setChat_room_seq(Long chat_room_seq) { this.chat_room_seq = chat_room_seq; }

    public Long getMember_seq() { return member_seq; }
    public void setMember_seq(Long member_seq) { this.member_seq = member_seq; }

    public String getParticipant_role() { return participant_role; }
    public void setParticipant_role(String participant_role) { this.participant_role = participant_role; }

    public String getParticipant_status() { return participant_status; }
    public void setParticipant_status(String participant_status) { this.participant_status = participant_status; }

    public Date getJoined_at() { return joined_at; }
    public void setJoined_at(Date joined_at) { this.joined_at = joined_at; }

    public Date getLeft_at() { return left_at; }
    public void setLeft_at(Date left_at) { this.left_at = left_at; }
}