package com.app.silhouette.event;

import java.time.LocalDateTime;

public class LoveValueTestResultDTO {
	private Long loveValueTestResultSeq;
    private Long memberSeq;
    private String resultType;
    private String resultTitle;
    private String resultEmoji;
    private String tags;
    private String idealMatchDesc;
    private String answers;
    private LocalDateTime createdAt;
    
    public LoveValueTestResultDTO () {}
    
	public LoveValueTestResultDTO(Long loveValueTestResultSeq, Long memberSeq, String resultType, String resultTitle,
			String resultEmoji, String tags, String idealMatchDesc, String answers, LocalDateTime createdAt) {
		super();
		this.loveValueTestResultSeq = loveValueTestResultSeq;
		this.memberSeq = memberSeq;
		this.resultType = resultType;
		this.resultTitle = resultTitle;
		this.resultEmoji = resultEmoji;
		this.tags = tags;
		this.idealMatchDesc = idealMatchDesc;
		this.answers = answers;
		this.createdAt = createdAt;
	}
	public Long getLoveValueTestResultSeq() {
		return loveValueTestResultSeq;
	}
	public void setLoveValueTestResultSeq(Long loveValueTestResultSeq) {
		this.loveValueTestResultSeq = loveValueTestResultSeq;
	}
	public Long getMemberSeq() {
		return memberSeq;
	}
	public void setMemberSeq(Long memberSeq) {
		this.memberSeq = memberSeq;
	}
	public String getResultType() {
		return resultType;
	}
	public void setResultType(String resultType) {
		this.resultType = resultType;
	}
	public String getResultTitle() {
		return resultTitle;
	}
	public void setResultTitle(String resultTitle) {
		this.resultTitle = resultTitle;
	}
	public String getResultEmoji() {
		return resultEmoji;
	}
	public void setResultEmoji(String resultEmoji) {
		this.resultEmoji = resultEmoji;
	}
	public String getTags() {
		return tags;
	}
	public void setTags(String tags) {
		this.tags = tags;
	}
	public String getIdealMatchDesc() {
		return idealMatchDesc;
	}
	public void setIdealMatchDesc(String idealMatchDesc) {
		this.idealMatchDesc = idealMatchDesc;
	}
	public String getAnswers() {
		return answers;
	}
	public void setAnswers(String answers) {
		this.answers = answers;
	}
	public LocalDateTime getCreatedAt() {
		return createdAt;
	}
	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}
}
