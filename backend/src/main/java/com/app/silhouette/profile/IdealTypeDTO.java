package com.app.silhouette.profile;

import java.time.LocalDateTime;

public class IdealTypeDTO {
	private Long idealTypeSeq;
	private String loginId;
	private Integer ageMin;
	private Integer ageMax;
	private Integer minHeight;
	private Integer maxHeight;
	private String bodyType;
	private String mbtiPref;
	private String smokingPref;
	private String drinkingPref;
	private String memo;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;

	public IdealTypeDTO() {}

	// 이상형을 하나라도 입력했는지 (전부 비었으면 저장 안 함)
	public boolean hasAnyValue() {
		return ageMin != null || ageMax != null || minHeight != null || maxHeight != null
				|| notBlank(bodyType) || notBlank(mbtiPref) || notBlank(smokingPref)
				|| notBlank(drinkingPref) || notBlank(memo);
	}

	private boolean notBlank(String s) {
		return s != null && !s.isBlank();
	}

	public Long getIdealTypeSeq() { return idealTypeSeq; }
	public void setIdealTypeSeq(Long idealTypeSeq) { this.idealTypeSeq = idealTypeSeq; }

	public String getLoginId() { return loginId; }
	public void setLoginId(String loginId) { this.loginId = loginId; }

	public Integer getAgeMin() { return ageMin; }
	public void setAgeMin(Integer ageMin) { this.ageMin = ageMin; }

	public Integer getAgeMax() { return ageMax; }
	public void setAgeMax(Integer ageMax) { this.ageMax = ageMax; }

	public Integer getMinHeight() { return minHeight; }
	public void setMinHeight(Integer minHeight) { this.minHeight = minHeight; }

	public Integer getMaxHeight() { return maxHeight; }
	public void setMaxHeight(Integer maxHeight) { this.maxHeight = maxHeight; }

	public String getBodyType() { return bodyType; }
	public void setBodyType(String bodyType) { this.bodyType = bodyType; }

	public String getMbtiPref() { return mbtiPref; }
	public void setMbtiPref(String mbtiPref) { this.mbtiPref = mbtiPref; }

	public String getSmokingPref() { return smokingPref; }
	public void setSmokingPref(String smokingPref) { this.smokingPref = smokingPref; }

	public String getDrinkingPref() { return drinkingPref; }
	public void setDrinkingPref(String drinkingPref) { this.drinkingPref = drinkingPref; }

	public String getMemo() { return memo; }
	public void setMemo(String memo) { this.memo = memo; }

	public LocalDateTime getCreatedAt() { return createdAt; }
	public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

	public LocalDateTime getUpdatedAt() { return updatedAt; }
	public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}