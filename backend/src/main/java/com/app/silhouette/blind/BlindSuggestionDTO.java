package com.app.silhouette.blind;

import com.fasterxml.jackson.annotation.JsonIgnore;

// AI 추천답변 한 개 (AI_REPLY_SUGGESTION 한 행)
// 화면에는 번호·톤·문장만 내려준다
public class BlindSuggestionDTO {

    private Long aiReplySuggestionSeq;
    private Long blindChatRoomSeq;
    private Long memberSeq;            // 추천을 요청한 회원
    private String batchKey;           // 한 번에 만든 추천 묶음
    private Long triggerMessageSeq;    // 추천의 기준이 된 상대 메시지
    private String tone;               // EMPATHY(공감) / QUESTION(질문) / HUMOR(유머)
    private String text;
    private String modelName;
    private String selectedYn;

    public BlindSuggestionDTO() {
    }

    public Long getAiReplySuggestionSeq() { return aiReplySuggestionSeq; }
    public void setAiReplySuggestionSeq(Long aiReplySuggestionSeq) { this.aiReplySuggestionSeq = aiReplySuggestionSeq; }

    @JsonIgnore
    public Long getBlindChatRoomSeq() { return blindChatRoomSeq; }
    public void setBlindChatRoomSeq(Long blindChatRoomSeq) { this.blindChatRoomSeq = blindChatRoomSeq; }

    @JsonIgnore
    public Long getMemberSeq() { return memberSeq; }
    public void setMemberSeq(Long memberSeq) { this.memberSeq = memberSeq; }

    @JsonIgnore
    public String getBatchKey() { return batchKey; }
    public void setBatchKey(String batchKey) { this.batchKey = batchKey; }

    public Long getTriggerMessageSeq() { return triggerMessageSeq; }
    public void setTriggerMessageSeq(Long triggerMessageSeq) { this.triggerMessageSeq = triggerMessageSeq; }

    public String getTone() { return tone; }
    public void setTone(String tone) { this.tone = tone; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    @JsonIgnore
    public String getModelName() { return modelName; }
    public void setModelName(String modelName) { this.modelName = modelName; }

    @JsonIgnore
    public String getSelectedYn() { return selectedYn; }
    public void setSelectedYn(String selectedYn) { this.selectedYn = selectedYn; }
}
