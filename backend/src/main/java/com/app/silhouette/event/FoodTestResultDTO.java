package com.app.silhouette.event;

import java.sql.Timestamp;

public class FoodTestResultDTO {
	
	 	private Long foodTestResultSeq;
	    private Long memberSeq;
	    private String resultType;
	    private String resultTitle;
	    private String resultEmoji;
	    private String tags;
	    private String recommendMenu;
	    private String answers;
	    private Timestamp createdAt;
		public Long getFoodTestResultSeq() {
			return foodTestResultSeq;
		}
		public void setFoodTestResultSeq(Long foodTestResultSeq) {
			this.foodTestResultSeq = foodTestResultSeq;
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
		public String getRecommendMenu() {
			return recommendMenu;
		}
		public void setRecommendMenu(String recommendMenu) {
			this.recommendMenu = recommendMenu;
		}
		public String getAnswers() {
			return answers;
		}
		public void setAnswers(String answers) {
			this.answers = answers;
		}
		public Timestamp getCreatedAt() {
			return createdAt;
		}
		public void setCreatedAt(Timestamp createdAt) {
			this.createdAt = createdAt;
		}
		
		public FoodTestResultDTO () {}
		
		public FoodTestResultDTO(Long foodTestResultSeq, Long memberSeq, String resultType, String resultTitle,
				String resultEmoji, String tags, String recommendMenu, String answers, Timestamp createdAt) {
			this.foodTestResultSeq = foodTestResultSeq;
			this.memberSeq = memberSeq;
			this.resultType = resultType;
			this.resultTitle = resultTitle;
			this.resultEmoji = resultEmoji;
			this.tags = tags;
			this.recommendMenu = recommendMenu;
			this.answers = answers;
			this.createdAt = createdAt;
		}
	    
	    
}
