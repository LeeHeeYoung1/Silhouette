package com.app.silhouette.chatting;

public class ChattingMessageReadDTO {
    private Long chat_message_read_seq;
    private Long chat_message_seq;
    private Long member_seq;

    public ChattingMessageReadDTO() {}

    public Long getChat_message_read_seq() { return chat_message_read_seq; }
    public void setChat_message_read_seq(Long chat_message_read_seq) { this.chat_message_read_seq = chat_message_read_seq; }

    public Long getChat_message_seq() { return chat_message_seq; }
    public void setChat_message_seq(Long chat_message_seq) { this.chat_message_seq = chat_message_seq; }

    public Long getMember_seq() { return member_seq; }
    public void setMember_seq(Long member_seq) { this.member_seq = member_seq; }
}