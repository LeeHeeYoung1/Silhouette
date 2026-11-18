package com.app.silhouette.chatting;

import java.util.Date;

public class ChattingRoomDTO {

    private Long chat_room_seq;
    private String room_name;
    private String room_type;
    private Long matching_seq;
    private Long created_by;
    private String room_status;
    private Date created_at;
    private Date closed_at;

    // 기본 생성자
    public ChattingRoomDTO() {
    }

    // 전체 필드 생성자
    public ChattingRoomDTO(Long chat_room_seq, String room_name, String room_type, Long matching_seq, 
                           Long created_by, String room_status, Date created_at, Date closed_at) {
        this.chat_room_seq = chat_room_seq;
        this.room_name = room_name;
        this.room_type = room_type;
        this.matching_seq = matching_seq;
        this.created_by = created_by;
        this.room_status = room_status;
        this.created_at = created_at;
        this.closed_at = closed_at;
    }

    // Getter / Setter
    public Long getChat_room_seq() { return chat_room_seq; }
    public void setChat_room_seq(Long chat_room_seq) { this.chat_room_seq = chat_room_seq; }

    public String getRoom_name() { return room_name; }
    public void setRoom_name(String room_name) { this.room_name = room_name; }

    public String getRoom_type() { return room_type; }
    public void setRoom_type(String room_type) { this.room_type = room_type; }

    public Long getMatching_seq() { return matching_seq; }
    public void setMatching_seq(Long matching_seq) { this.matching_seq = matching_seq; }

    public Long getCreated_by() { return created_by; }
    public void setCreated_by(Long created_by) { this.created_by = created_by; }

    public String getRoom_status() { return room_status; }
    public void setRoom_status(String room_status) { this.room_status = room_status; }

    public Date getCreated_at() { return created_at; }
    public void setCreated_at(Date created_at) { this.created_at = created_at; }

    public Date getClosed_at() { return closed_at; }
    public void setClosed_at(Date closed_at) { this.closed_at = closed_at; }
}