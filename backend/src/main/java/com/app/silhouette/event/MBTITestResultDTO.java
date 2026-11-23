package com.app.silhouette.event;

import java.time.LocalDateTime;

public class MBTITestResultDTO {
	private Long mbtiTestResultSeq;
    private Long memberSeq;
    private String mbtiType;
    private String resultTitle;
    private String resultEmoji;
    private String tags;
    private String bestMatchMbti;
    private String matchDesc;
    private String answers;
    private LocalDateTime createdAt;
    
    public MBTITestResultDTO () {};
    
	public MBTITestResultDTO(Long mbtiTestResultSeq, Long memberSeq, String mbtiType, String resultTitle,
			String resultEmoji, String tags, String bestMatchMbti, String matchDesc, String answers,
			LocalDateTime createdAt) {
		super();
		this.mbtiTestResultSeq = mbtiTestResultSeq;
		this.memberSeq = memberSeq;
		this.mbtiType = mbtiType;
		this.resultTitle = resultTitle;
		this.resultEmoji = resultEmoji;
		this.tags = tags;
		this.bestMatchMbti = bestMatchMbti;
		this.matchDesc = matchDesc;
		this.answers = answers;
		this.createdAt = createdAt;
	}
	public Long getMbtiTestResultSeq() {
		return mbtiTestResultSeq;
	}
	public void setMbtiTestResultSeq(Long mbtiTestResultSeq) {
		this.mbtiTestResultSeq = mbtiTestResultSeq;
	}
	public Long getMemberSeq() {
		return memberSeq;
	}
	public void setMemberSeq(Long memberSeq) {
		this.memberSeq = memberSeq;
	}
	public String getMbtiType() {
		return mbtiType;
	}
	public void setMbtiType(String mbtiType) {
		this.mbtiType = mbtiType;
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
	public String getBestMatchMbti() {
		return bestMatchMbti;
	}
	public void setBestMatchMbti(String bestMatchMbti) {
		this.bestMatchMbti = bestMatchMbti;
	}
	public String getMatchDesc() {
		return matchDesc;
	}
	public void setMatchDesc(String matchDesc) {
		this.matchDesc = matchDesc;
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
