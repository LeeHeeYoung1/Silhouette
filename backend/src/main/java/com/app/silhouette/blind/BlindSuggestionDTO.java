package com.app.silhouette.blind;

import com.fasterxml.jackson.annotation.JsonIgnore;

// AI 추천답변 한 개 (AI_REPLY_SUGGESTION 한 행)
// 화면에는 번호·톤·문장만 내려준다
public class BlindSuggestionDTO {

    private Long ai_reply_suggestion_seq;
    private Long blind_chat_room_seq;
    private Long member_seq;            // 추천을 요청한 회원
    private String batch_key;           // 한 번에 만든 추천 묶음
    private Long trigger_message_seq;    // 추천의 기준이 된 상대 메시지
    private String tone;               // EMPATHY(공감) / QUESTION(질문) / HUMOR(유머)
    private String text;
    private String model_name;
    private String selected_yn;

    public BlindSuggestionDTO() {
    }

    public Long getAiReplySuggestionSeq() { return ai_reply_suggestion_seq; }
    public void setAiReplySuggestionSeq(Long ai_reply_suggestion_seq) { this.ai_reply_suggestion_seq = ai_reply_suggestion_seq; }

    @JsonIgnore
    public Long getBlindChatRoomSeq() { return blind_chat_room_seq; }
    public void setBlindChatRoomSeq(Long blind_chat_room_seq) { this.blind_chat_room_seq = blind_chat_room_seq; }

    @JsonIgnore
    public Long getMemberSeq() { return member_seq; }
    public void setMemberSeq(Long member_seq) { this.member_seq = member_seq; }

    @JsonIgnore
    public String getBatchKey() { return batch_key; }
    public void setBatchKey(String batch_key) { this.batch_key = batch_key; }

    public Long getTriggerMessageSeq() { return trigger_message_seq; }
    public void setTriggerMessageSeq(Long trigger_message_seq) { this.trigger_message_seq = trigger_message_seq; }

    public String getTone() { return tone; }
    public void setTone(String tone) { this.tone = tone; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    @JsonIgnore
    public String getModelName() { return model_name; }
    public void setModelName(String model_name) { this.model_name = model_name; }

    @JsonIgnore
    public String getSelectedYn() { return selected_yn; }
    public void setSelectedYn(String selected_yn) { this.selected_yn = selected_yn; }
}
