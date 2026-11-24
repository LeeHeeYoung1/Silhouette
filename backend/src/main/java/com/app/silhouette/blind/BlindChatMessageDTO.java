package com.app.silhouette.blind;

import java.sql.Timestamp;

import com.fasterxml.jackson.annotation.JsonIgnore;

// 블라인드 채팅 메시지
// 익명 유지: 화면에는 보낸 사람의 회원번호·아이디 대신 슬롯(1/2)만 내려준다
public class BlindChatMessageDTO {

    private Long blind_chat_message_seq;
    private Long blind_chat_room_seq;
    private Long sender_seq;              // 서버 내부용 (응답에서 제외)
    private Integer sender_slot;          // 1 / 2 (내 슬롯과 같으면 내 메시지)
    private String content;
    private Long ai_reply_suggestion_seq;   // AI 추천을 골라서 보낸 경우
    private Timestamp sent_at;

    public BlindChatMessageDTO() {
    }

    public Long getBlindChatMessageSeq() { return blind_chat_message_seq; }
    public void setBlindChatMessageSeq(Long blind_chat_message_seq) { this.blind_chat_message_seq = blind_chat_message_seq; }

    public Long getBlindChatRoomSeq() { return blind_chat_room_seq; }
    public void setBlindChatRoomSeq(Long blind_chat_room_seq) { this.blind_chat_room_seq = blind_chat_room_seq; }

    @JsonIgnore
    public Long getSenderSeq() { return sender_seq; }
    public void setSenderSeq(Long sender_seq) { this.sender_seq = sender_seq; }

    public Integer getSenderSlot() { return sender_slot; }
    public void setSenderSlot(Integer sender_slot) { this.sender_slot = sender_slot; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    @JsonIgnore
    public Long getAiReplySuggestionSeq() { return ai_reply_suggestion_seq; }
    public void setAiReplySuggestionSeq(Long ai_reply_suggestion_seq) { this.ai_reply_suggestion_seq = ai_reply_suggestion_seq; }

    public Timestamp getSentAt() { return sent_at; }
    public void setSentAt(Timestamp sent_at) { this.sent_at = sent_at; }
}
