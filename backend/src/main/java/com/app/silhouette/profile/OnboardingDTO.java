package com.app.silhouette.profile;

public class OnboardingDTO {
	private String loginId;
	private ProfileDTO profile;    // 나의 정보
	private IdealTypeDTO ideal;    // 이상형 (선택)

	public OnboardingDTO() {}

	public String getLoginId() { return loginId; }
	public void setLoginId(String loginId) { this.loginId = loginId; }

	public ProfileDTO getProfile() { return profile; }
	public void setProfile(ProfileDTO profile) { this.profile = profile; }

	public IdealTypeDTO getIdeal() { return ideal; }
	public void setIdeal(IdealTypeDTO ideal) { this.ideal = ideal; }
}