package com.app.silhouette.chatting;

import java.util.Date;

public class ChattingInvitationDTO {
    private Long chat_invitation_seq;
    private Long chat_room_seq;
    private Long inviter_seq;
    private Long invitee_seq;
    private String invitation_status;
    private Date invited_at;
    private Date responded_at;
    private String room_name;
    private String inviter_nick;

    public Long getChat_invitation_seq() { return chat_invitation_seq; }
    public void setChat_invitation_seq(Long value) { this.chat_invitation_seq = value; }
    public Long getChat_room_seq() { return chat_room_seq; }
    public void setChat_room_seq(Long value) { this.chat_room_seq = value; }
    public Long getInviter_seq() { return inviter_seq; }
    public void setInviter_seq(Long value) { this.inviter_seq = value; }
    public Long getInvitee_seq() { return invitee_seq; }
    public void setInvitee_seq(Long value) { this.invitee_seq = value; }
    public String getInvitation_status() { return invitation_status; }
    public void setInvitation_status(String value) { this.invitation_status = value; }
    public Date getInvited_at() { return invited_at; }
    public void setInvited_at(Date value) { this.invited_at = value; }
    public Date getResponded_at() { return responded_at; }
    public void setResponded_at(Date value) { this.responded_at = value; }
    public String getRoom_name() { return room_name; }
    public void setRoom_name(String value) { this.room_name = value; }
    public String getInviter_nick() { return inviter_nick; }
    public void setInviter_nick(String value) { this.inviter_nick = value; }
}
