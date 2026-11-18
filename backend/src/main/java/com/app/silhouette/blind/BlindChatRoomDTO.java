package com.app.silhouette.blind;

import java.sql.Timestamp;

public class BlindChatRoomDTO {

    private Long blindChatRoomSeq;
    private Long blindMatchingSeq;
    private Long linkedChatRoomSeq;
    private Long timeLimitMin;
    private Timestamp startedAt;
    private Timestamp expireAt;
    private String status;
    private Timestamp endedAt;
    private Timestamp createdAt;

    public BlindChatRoomDTO() {
    }
    
	public BlindChatRoomDTO(Long blindChatRoomSeq, Long blindMatchingSeq, Long linkedChatRoomSeq, Long timeLimitMin,
			Timestamp startedAt, Timestamp expireAt, String status, Timestamp endedAt, Timestamp createdAt) {
		this.blindChatRoomSeq = blindChatRoomSeq;
		this.blindMatchingSeq = blindMatchingSeq;
		this.linkedChatRoomSeq = linkedChatRoomSeq;
		this.timeLimitMin = timeLimitMin;
		this.startedAt = startedAt;
		this.expireAt = expireAt;
		this.status = status;
		this.endedAt = endedAt;
		this.createdAt = createdAt;
	}

	public Long getBlindChatRoomSeq() {
		return blindChatRoomSeq;
	}

	public void setBlindChatRoomSeq(Long blindChatRoomSeq) {
		this.blindChatRoomSeq = blindChatRoomSeq;
	}

	public Long getBlindMatchingSeq() {
		return blindMatchingSeq;
	}

	public void setBlindMatchingSeq(Long blindMatchingSeq) {
		this.blindMatchingSeq = blindMatchingSeq;
	}

	public Long getLinkedChatRoomSeq() {
		return linkedChatRoomSeq;
	}

	public void setLinkedChatRoomSeq(Long linkedChatRoomSeq) {
		this.linkedChatRoomSeq = linkedChatRoomSeq;
	}

	public Long getTimeLimitMin() {
		return timeLimitMin;
	}

	public void setTimeLimitMin(Long timeLimitMin) {
		this.timeLimitMin = timeLimitMin;
	}

	public Timestamp getStartedAt() {
		return startedAt;
	}

	public void setStartedAt(Timestamp startedAt) {
		this.startedAt = startedAt;
	}

	public Timestamp getExpireAt() {
		return expireAt;
	}

	public void setExpireAt(Timestamp expireAt) {
		this.expireAt = expireAt;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public Timestamp getEndedAt() {
		return endedAt;
	}

	public void setEndedAt(Timestamp endedAt) {
		this.endedAt = endedAt;
	}

	public Timestamp getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(Timestamp createdAt) {
		this.createdAt = createdAt;
	}

   

}
