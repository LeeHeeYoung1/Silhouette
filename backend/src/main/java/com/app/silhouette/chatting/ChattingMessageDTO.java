package com.app.silhouette.chatting;

import java.util.Date;

public class ChattingMessageDTO {
    private Long chat_message_seq;
    private Long chat_room_seq;
    private Long sender_seq;
    private String message_type;
    private String system_event_type;
    private String message_content;
    private Date created_at;
    private String deleted_yn;

    public ChattingMessageDTO() {}

    public Long getChat_message_seq() { return chat_message_seq; }
    public void setChat_message_seq(Long chat_message_seq) { this.chat_message_seq = chat_message_seq; }

    public Long getChat_room_seq() { return chat_room_seq; }
    public void setChat_room_seq(Long chat_room_seq) { this.chat_room_seq = chat_room_seq; }

    public Long getSender_seq() { return sender_seq; }
    public void setSender_seq(Long sender_seq) { this.sender_seq = sender_seq; }

    public String getMessage_type() { return message_type; }
    public void setMessage_type(String message_type) { this.message_type = message_type; }

    public String getSystem_event_type() { return system_event_type; }
    public void setSystem_event_type(String system_event_type) { this.system_event_type = system_event_type; }

    public String getMessage_content() { return message_content; }
    public void setMessage_content(String message_content) { this.message_content = message_content; }

    public Date getCreated_at() { return created_at; }
    public void setCreated_at(Date created_at) { this.created_at = created_at; }

    public String getDeleted_yn() { return deleted_yn; }
    public void setDeleted_yn(String deleted_yn) { this.deleted_yn = deleted_yn; }
}