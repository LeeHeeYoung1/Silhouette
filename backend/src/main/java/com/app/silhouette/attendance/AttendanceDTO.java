package com.app.silhouette.attendance;

import java.time.LocalDate;
import java.util.List;

public class AttendanceDTO {
	// DB 컬럼 매핑용
    private Long attendanceSeq;
    private Long memberSeq;
    private LocalDate attendDate;
    private Integer continuousDays;
    private String rewardYn;
    private Integer rewardMileage;
    private Integer rewardTicket;

    // 프론트 화면 응답용
    private List<?> weekDays;
	private int currentStreak;
    private boolean todayAttended;
    private String todayRewardTitle;
    private String todayRewardSub;
    private int currentMileage;
    private int currentTicket;
    
    public AttendanceDTO () {}
    
    public AttendanceDTO(Long attendanceSeq, Long memberSeq, LocalDate attendDate, Integer continuousDays,
			String rewardYn, Integer rewardMileage, Integer rewardTicket, List<?> weekDays, int currentStreak,
			boolean todayAttended, String todayRewardTitle, String todayRewardSub, int currentMileage,
			int currentTicket) {
		super();
		this.attendanceSeq = attendanceSeq;
		this.memberSeq = memberSeq;
		this.attendDate = attendDate;
		this.continuousDays = continuousDays;
		this.rewardYn = rewardYn;
		this.rewardMileage = rewardMileage;
		this.rewardTicket = rewardTicket;
		this.weekDays = weekDays;
		this.currentStreak = currentStreak;
		this.todayAttended = todayAttended;
		this.todayRewardTitle = todayRewardTitle;
		this.todayRewardSub = todayRewardSub;
		this.currentMileage = currentMileage;
		this.currentTicket = currentTicket;
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
	public List<?> getWeekDays() {
		return weekDays;
	}
	public void setWeekDays(List<?> weekDays) {
		this.weekDays = weekDays;
	}
	public int getCurrentStreak() {
		return currentStreak;
	}
	public void setCurrentStreak(int currentStreak) {
		this.currentStreak = currentStreak;
	}
	public boolean isTodayAttended() {
		return todayAttended;
	}
	public void setTodayAttended(boolean todayAttended) {
		this.todayAttended = todayAttended;
	}
	public String getTodayRewardTitle() {
		return todayRewardTitle;
	}
	public void setTodayRewardTitle(String todayRewardTitle) {
		this.todayRewardTitle = todayRewardTitle;
	}
	public String getTodayRewardSub() {
		return todayRewardSub;
	}
	public void setTodayRewardSub(String todayRewardSub) {
		this.todayRewardSub = todayRewardSub;
	}
	public int getCurrentMileage() {
		return currentMileage;
	}
	public void setCurrentMileage(int currentMileage) {
		this.currentMileage = currentMileage;
	}
	public int getCurrentTicket() {
		return currentTicket;
	}
	public void setCurrentTicket(int currentTicket) {
		this.currentTicket = currentTicket;
	}
}
