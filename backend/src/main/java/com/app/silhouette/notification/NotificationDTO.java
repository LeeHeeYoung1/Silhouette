package com.app.silhouette.notification;

public class NotificationDTO {

    // 알림 고유 번호와 알림을 받는 회원/보내는 회원 번호
    private Long notification_seq;
    private Long receiver_seq;
    private Long sender_seq;
    private String notification_type;
    private Long reference_seq;
    private String notification_content;
    private String read_yn;
    // 목록 화면에서 이름과 채팅방 이름을 표시하기 위한 조회 전용 필드
    private String sender_nick;
    private String room_name;
    private Long chat_room_seq;

    public Long getNotification_seq() { return notification_seq; }
    public void setNotification_seq(Long notification_seq) { this.notification_seq = notification_seq; }
    public Long getReceiver_seq() { return receiver_seq; }
    public void setReceiver_seq(Long receiver_seq) { this.receiver_seq = receiver_seq; }
    public Long getSender_seq() { return sender_seq; }
    public void setSender_seq(Long sender_seq) { this.sender_seq = sender_seq; }
    public String getNotification_type() { return notification_type; }
    public void setNotification_type(String notification_type) { this.notification_type = notification_type; }
    public Long getReference_seq() { return reference_seq; }
    public void setReference_seq(Long reference_seq) { this.reference_seq = reference_seq; }
    public String getNotification_content() { return notification_content; }
    public void setNotification_content(String notification_content) { this.notification_content = notification_content; }
    public String getRead_yn() { return read_yn; }
    public void setRead_yn(String read_yn) { this.read_yn = read_yn; }
    public String getSender_nick() { return sender_nick; }
    public void setSender_nick(String sender_nick) { this.sender_nick = sender_nick; }
    public String getRoom_name() { return room_name; }
    public void setRoom_name(String room_name) { this.room_name = room_name; }
    public Long getChat_room_seq() { return chat_room_seq; }
    public void setChat_room_seq(Long chat_room_seq) { this.chat_room_seq = chat_room_seq; }
}