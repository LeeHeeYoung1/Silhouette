package com.app.silhouette.blind;

import java.sql.Timestamp;

import com.fasterxml.jackson.annotation.JsonIgnore;

// 블라인드 채팅 메시지
// 익명 유지: 화면에는 보낸 사람의 회원번호·아이디 대신 슬롯(1/2)만 내려준다
public class BlindChatMessageDTO {

    private Long blindChatMessageSeq;
    private Long blindChatRoomSeq;
    private Long senderSeq;              // 서버 내부용 (응답에서 제외)
    private Integer senderSlot;          // 1 / 2 (내 슬롯과 같으면 내 메시지)
    private String content;
    private Long aiReplySuggestionSeq;   // AI 추천을 골라서 보낸 경우
    private Timestamp sentAt;

    public BlindChatMessageDTO() {
    }

    public Long getBlindChatMessageSeq() { return blindChatMessageSeq; }
    public void setBlindChatMessageSeq(Long blindChatMessageSeq) { this.blindChatMessageSeq = blindChatMessageSeq; }

    public Long getBlindChatRoomSeq() { return blindChatRoomSeq; }
    public void setBlindChatRoomSeq(Long blindChatRoomSeq) { this.blindChatRoomSeq = blindChatRoomSeq; }

    @JsonIgnore
    public Long getSenderSeq() { return senderSeq; }
    public void setSenderSeq(Long senderSeq) { this.senderSeq = senderSeq; }

    public Integer getSenderSlot() { return senderSlot; }
    public void setSenderSlot(Integer senderSlot) { this.senderSlot = senderSlot; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    @JsonIgnore
    public Long getAiReplySuggestionSeq() { return aiReplySuggestionSeq; }
    public void setAiReplySuggestionSeq(Long aiReplySuggestionSeq) { this.aiReplySuggestionSeq = aiReplySuggestionSeq; }

    public Timestamp getSentAt() { return sentAt; }
    public void setSentAt(Timestamp sentAt) { this.sentAt = sentAt; }
}
