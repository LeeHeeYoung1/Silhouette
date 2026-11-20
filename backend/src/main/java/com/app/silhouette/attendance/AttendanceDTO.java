package com.app.silhouette.attendance;

import java.time.LocalDate;

public class AttendanceDTO {
	private Long attendanceSeq;
    private Long memberSeq;
    private LocalDate attendDate;
    private Integer continuousDays;
    private String rewardYn;
    private Integer rewardMileage;
    private Integer rewardTicket;
    
    public AttendanceDTO () {}
    
	public AttendanceDTO(Long attendanceSeq, Long memberSeq, LocalDate attendDate, Integer continuousDays,
			String rewardYn, Integer rewardMileage, Integer rewardTicket) {
		super();
		this.attendanceSeq = attendanceSeq;
		this.memberSeq = memberSeq;
		this.attendDate = attendDate;
		this.continuousDays = continuousDays;
		this.rewardYn = rewardYn;
		this.rewardMileage = rewardMileage;
		this.rewardTicket = rewardTicket;
	}
	public Long getAttendanceSeq() {
		return attendanceSeq;
	}
	public void setAttendanceSeq(Long attendanceSeq) {
		this.attendanceSeq = attendanceSeq;
	}
	public Long getMemberSeq() {
		return memberSeq;
	}
	public void setMemberSeq(Long memberSeq) {
		this.memberSeq = memberSeq;
	}
	public LocalDate getAttendDate() {
		return attendDate;
	}
	public void setAttendDate(LocalDate attendDate) {
		this.attendDate = attendDate;
	}
	public Integer getContinuousDays() {
		return continuousDays;
	}
	public void setContinuousDays(Integer continuousDays) {
		this.continuousDays = continuousDays;
	}
	public String getRewardYn() {
		return rewardYn;
	}
	public void setRewardYn(String rewardYn) {
		this.rewardYn = rewardYn;
	}
	public Integer getRewardMileage() {
		return rewardMileage;
	}
	public void setRewardMileage(Integer rewardMileage) {
		this.rewardMileage = rewardMileage;
	}
	public Integer getRewardTicket() {
		return rewardTicket;
	}
	public void setRewardTicket(Integer rewardTicket) {
		this.rewardTicket = rewardTicket;
	}
}
