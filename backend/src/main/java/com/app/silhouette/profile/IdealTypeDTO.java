package com.app.silhouette.profile;

import java.time.LocalDateTime;

public class IdealTypeDTO {
	private Long ideal_type_seq;
	private String login_id;
	private Integer age_min;
	private Integer age_max;
	private Integer min_height;
	private Integer max_height;
	private String body_type;
	private String mbti_pref;
	private String smoking_pref;
	private String drinking_pref;
	private String military_pref;         // 원하는 병역 (여성만, 여러 개를 쉼표로)
	private String memo;
	private LocalDateTime created_at;
	private LocalDateTime updated_at;

	public IdealTypeDTO() {}

	// 이상형을 하나라도 입력했는지 (전부 비었으면 저장 안 함)
	public boolean hasAnyValue() {
		return age_min != null || age_max != null || min_height != null || max_height != null
				|| notBlank(body_type) || notBlank(mbti_pref) || notBlank(smoking_pref)
				|| notBlank(drinking_pref) || notBlank(military_pref) || notBlank(memo);
	}

	private boolean notBlank(String s) {
		return s != null && !s.isBlank();
	}

	public Long getIdealTypeSeq() { return ideal_type_seq; }
	public void setIdealTypeSeq(Long ideal_type_seq) { this.ideal_type_seq = ideal_type_seq; }

	public String getLoginId() { return login_id; }
	public void setLoginId(String login_id) { this.login_id = login_id; }

	public Integer getAgeMin() { return age_min; }
	public void setAgeMin(Integer age_min) { this.age_min = age_min; }

	public Integer getAgeMax() { return age_max; }
	public void setAgeMax(Integer age_max) { this.age_max = age_max; }

	public Integer getMinHeight() { return min_height; }
	public void setMinHeight(Integer min_height) { this.min_height = min_height; }

	public Integer getMaxHeight() { return max_height; }
	public void setMaxHeight(Integer max_height) { this.max_height = max_height; }

	public String getBodyType() { return body_type; }
	public void setBodyType(String body_type) { this.body_type = body_type; }

	public String getMbtiPref() { return mbti_pref; }
	public void setMbtiPref(String mbti_pref) { this.mbti_pref = mbti_pref; }

	public String getSmokingPref() { return smoking_pref; }
	public void setSmokingPref(String smoking_pref) { this.smoking_pref = smoking_pref; }

	public String getDrinkingPref() { return drinking_pref; }
	public void setDrinkingPref(String drinking_pref) { this.drinking_pref = drinking_pref; }

	public String getMilitaryPref() { return military_pref; }
	public void setMilitaryPref(String military_pref) { this.military_pref = military_pref; }

	public String getMemo() { return memo; }
	public void setMemo(String memo) { this.memo = memo; }

	public LocalDateTime getCreatedAt() { return created_at; }
	public void setCreatedAt(LocalDateTime created_at) { this.created_at = created_at; }

	public LocalDateTime getUpdatedAt() { return updated_at; }
	public void setUpdatedAt(LocalDateTime updated_at) { this.updated_at = updated_at; }
}