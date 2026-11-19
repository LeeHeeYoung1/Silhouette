package com.app.silhouette.chatting;

import java.sql.Timestamp;
import java.util.Date;

public class ChattingRoomListDTO {

    // CHATTINGROOM_LIST 컬럼
    private Long chat_room_list_seq;
    private Long member_seq;
    private Long chat_room_seq;
    private String status;
    private Long last_read_message_seq;
    private Long deleted_message_seq;
    private Timestamp left_at;
    private Timestamp deleted_at;
    private Timestamp created_at;

    // 채팅방 목록 화면 출력을 위한 추가 필드 (조인 결과)
    private String room_name;          // 채팅방 이름
    private String room_type;          // 채팅방 타입
    private Long partner_seq;          // 상대방 회원 번호
    private String partner_nick;       // 상대방 닉네임
    private String partner_profile;    // 상대방 프로필 이미지
    private String last_message;       // 최근 메시지 내용
    private Timestamp last_send_time;  // 최근 메시지 전송 시간
    private int unread_count;          // 안 읽은 메시지 수

    // 기본 생성자
    public ChattingRoomListDTO() {
    }

    // Getter / Setter
    public Long getChat_room_list_seq() { return chat_room_list_seq; }
    public void setChat_room_list_seq(Long chat_room_list_seq) { this.chat_room_list_seq = chat_room_list_seq; }

    public Long getMember_seq() { return member_seq; }
    public void setMember_seq(Long member_seq) { this.member_seq = member_seq; }

    public Long getChat_room_seq() { return chat_room_seq; }
    public void setChat_room_seq(Long chat_room_seq) { this.chat_room_seq = chat_room_seq; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getLast_read_message_seq() { return last_read_message_seq; }
    public void setLast_read_message_seq(Long last_read_message_seq) { this.last_read_message_seq = last_read_message_seq; }

    public Long getDeleted_message_seq() { return deleted_message_seq; }
    public void setDeleted_message_seq(Long deleted_message_seq) { this.deleted_message_seq = deleted_message_seq; }

    public Timestamp getLeft_at() { return left_at; }
    public void setLeft_at(Timestamp left_at) { this.left_at = left_at; }

    public Timestamp getDeleted_at() { return deleted_at; }
    public void setDeleted_at(Timestamp deleted_at) { this.deleted_at = deleted_at; }

    public Timestamp getCreated_at() { return created_at; }
    public void setCreated_at(Timestamp created_at) { this.created_at = created_at; }

    public String getRoom_name() { return room_name; }
    public void setRoom_name(String room_name) { this.room_name = room_name; }

    public String getRoom_type() { return room_type; }
    public void setRoom_type(String room_type) { this.room_type = room_type; }

    public Long getPartner_seq() { return partner_seq; }
    public void setPartner_seq(Long partner_seq) { this.partner_seq = partner_seq; }

    public String getPartner_nick() { return partner_nick; }
    public void setPartner_nick(String partner_nick) { this.partner_nick = partner_nick; }

    public String getPartner_profile() { return partner_profile; }
    public void setPartner_profile(String partner_profile) { this.partner_profile = partner_profile; }

    public String getLast_message() { return last_message; }
    public void setLast_message(String last_message) { this.last_message = last_message; }

    public Timestamp getLast_send_time() { return last_send_time; }
    public void setLast_send_time(Timestamp last_send_time) { this.last_send_time = last_send_time; }

    public int getUnread_count() { return unread_count; }
    public void setUnread_count(int unread_count) { this.unread_count = unread_count; }
}