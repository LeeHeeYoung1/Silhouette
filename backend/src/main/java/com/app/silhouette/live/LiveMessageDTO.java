package com.app.silhouette.live;

import java.util.Date;

// /sub/live/{liveRoomSeq} 로 보내는 메시지
// type: CHAT, SYSTEM(입장·퇴장·강퇴), ROOM_UPDATE, END, KICKED
public class LiveMessageDTO {

    private String type;
    private Long live_room_seq;
    private Long live_chat_seq;
    private Long member_seq;
    private String nickname;
    private String content;
    private String host_yn;          // 방송자 채팅 뱃지 표시용
    private Date created_at;
    private LiveRoomDTO room;        // ROOM_UPDATE 시 바뀐 방송 정보

    public LiveMessageDTO() {}

    public static LiveMessageDTO of(String type, long liveRoomSeq, String content) {
        LiveMessageDTO m = new LiveMessageDTO();
        m.type = type;
        m.live_room_seq = liveRoomSeq;
        m.content = content;
        m.created_at = new Date();
        return m;
    }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Long getLiveRoomSeq() { return live_room_seq; }
    public void setLiveRoomSeq(Long live_room_seq) { this.live_room_seq = live_room_seq; }

    public Long getLiveChatSeq() { return live_chat_seq; }
    public void setLiveChatSeq(Long live_chat_seq) { this.live_chat_seq = live_chat_seq; }

    public Long getMemberSeq() { return member_seq; }
    public void setMemberSeq(Long member_seq) { this.member_seq = member_seq; }

    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getHostYn() { return host_yn; }
    public void setHostYn(String host_yn) { this.host_yn = host_yn; }

    public Date getCreatedAt() { return created_at; }
    public void setCreatedAt(Date created_at) { this.created_at = created_at; }

    public LiveRoomDTO getRoom() { return room; }
    public void setRoom(LiveRoomDTO room) { this.room = room; }
}
