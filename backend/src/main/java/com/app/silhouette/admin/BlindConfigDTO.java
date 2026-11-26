package com.app.silhouette.admin;

public class BlindConfigDTO {
	private int timeLimitMin;   // 대화 제한 시간 (분)
	private int voteSeconds;    // 최종 투표 시간 (초)

	public BlindConfigDTO() {}

	public BlindConfigDTO(int timeLimitMin, int voteSeconds) {
		this.timeLimitMin = timeLimitMin;
		this.voteSeconds = voteSeconds;
	}

	public int getTimeLimitMin() {
		return timeLimitMin;
	}

	public void setTimeLimitMin(int timeLimitMin) {
		this.timeLimitMin = timeLimitMin;
	}

	public int getVoteSeconds() {
		return voteSeconds;
	}

	public void setVoteSeconds(int voteSeconds) {
		this.voteSeconds = voteSeconds;
	}
}
