package com.app.silhouette.blind;

import java.sql.Timestamp;

public class BlindChatMessageDTO {

	    private Long blindChatMessageSeq;
	    private Long blindChatRoomSeq;
	    private Long senderSeq;
	    private String msgType;
	    private String content;
	    private Long aiReplySuggestionSeq;
	    private String filteredYn;
	    private Timestamp readAt;
	    private Timestamp sentAt;
	    private String senderId;

	    public String getSenderId() {
			return senderId;
		}

		public void setSenderId(String senderId) {
			this.senderId = senderId;
		}

		public BlindChatMessageDTO() {
	    }

	    public BlindChatMessageDTO(Long blindChatMessageSeq, Long blindChatRoomSeq, Long senderSeq,
	                               String msgType, String content, Long aiReplySuggestionSeq,
	                               String filteredYn, Timestamp readAt, Timestamp sentAt, String senderId) {
	        this.blindChatMessageSeq = blindChatMessageSeq;
	        this.blindChatRoomSeq = blindChatRoomSeq;
	        this.senderSeq = senderSeq;
	        this.msgType = msgType;
	        this.content = content;
	        this.aiReplySuggestionSeq = aiReplySuggestionSeq;
	        this.filteredYn = filteredYn;
	        this.readAt = readAt;
	        this.sentAt = sentAt;
	        this.senderId = senderId;
	    }

	    public Long getBlindChatMessageSeq() {
	        return blindChatMessageSeq;
	    }

	    public void setBlindChatMessageSeq(Long blindChatMessageSeq) {
	        this.blindChatMessageSeq = blindChatMessageSeq;
	    }

	    public Long getBlindChatRoomSeq() {
	        return blindChatRoomSeq;
	    }

	    public void setBlindChatRoomSeq(Long blindChatRoomSeq) {
	        this.blindChatRoomSeq = blindChatRoomSeq;
	    }

	    public Long getSenderSeq() {
	        return senderSeq;
	    }

	    public void setSenderSeq(Long senderSeq) {
	        this.senderSeq = senderSeq;
	    }

	    public String getMsgType() {
	        return msgType;
	    }

	    public void setMsgType(String msgType) {
	        this.msgType = msgType;
	    }

	    public String getContent() {
	        return content;
	    }

	    public void setContent(String content) {
	        this.content = content;
	    }

	    public Long getAiReplySuggestionSeq() {
	        return aiReplySuggestionSeq;
	    }

	    public void setAiReplySuggestionSeq(Long aiReplySuggestionSeq) {
	        this.aiReplySuggestionSeq = aiReplySuggestionSeq;
	    }

	    public String getFilteredYn() {
	        return filteredYn;
	    }

	    public void setFilteredYn(String filteredYn) {
	        this.filteredYn = filteredYn;
	    }

	    public Timestamp getReadAt() {
	        return readAt;
	    }

	    public void setReadAt(Timestamp readAt) {
	        this.readAt = readAt;
	    }

	    public Timestamp getSentAt() {
	        return sentAt;
	    }

	    public void setSentAt(Timestamp sentAt) {
	        this.sentAt = sentAt;
	    }

	   
}
