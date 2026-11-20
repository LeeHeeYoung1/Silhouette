package com.app.silhouette.attendance;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;

@Service
public class AttendanceService {

    private final AttendanceDAO attendanceDao;

    private static final String[] DAY_NAMES = {"월", "화", "수", "목", "금", "토", "일"};
    private static final DateTimeFormatter LABEL_FMT = DateTimeFormatter.ofPattern("MM/dd");

    public AttendanceService(AttendanceDAO attendanceDao) {
        this.attendanceDao = attendanceDao;
    }

    @Transactional(readOnly = true)
    public AttendanceDTO getWeeklyStatus(Long memberSeq) {
        LocalDate today = LocalDate.now();
        LocalDate monday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate sunday = monday.plusDays(6);

        List<AttendanceDTO> records = attendanceDao.selectWeeklyAttendance(memberSeq, monday, sunday);
        Map<LocalDate, AttendanceDTO> recordMap = records.stream()
                .collect(Collectors.toMap(AttendanceDTO::getAttendDate, dto -> dto));

        List weekDays = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            LocalDate date = monday.plusDays(i);
            boolean attended = recordMap.containsKey(date);

            String bonusBadge = null;
            if (i == 2) bonusBadge = "+20M";
            else if (i == 4) bonusBadge = "+30M";
            else if (i == 6) bonusBadge = "이용권";

            Map<String, Object> dayInfo = new HashMap<>();
            dayInfo.put("dayOfWeek", DAY_NAMES[i]);
            dayInfo.put("dateLabel", date.format(LABEL_FMT));
            dayInfo.put("fullDate", date.toString());
            dayInfo.put("attended", attended);
            dayInfo.put("today", date.equals(today));
            dayInfo.put("bonusBadge", bonusBadge);
            weekDays.add(dayInfo);
        }

        AttendanceDTO todayRecord = recordMap.get(today);
        boolean todayAttended = (todayRecord != null);
        int currentStreak = 0;

        if (todayAttended) {
            currentStreak = todayRecord.getContinuousDays();
        } else if (!today.equals(monday)) {
            AttendanceDTO yesterdayRecord = recordMap.get(today.minusDays(1));
            if (yesterdayRecord != null) {
                currentStreak = yesterdayRecord.getContinuousDays();
            }
        }

        int nextStreak = todayAttended ? currentStreak : currentStreak + 1;
        String rewardTitle = "10 마일리지";
        String rewardSub = "연속 3일 +20M · 5일 +30M · 7일 이용권 1회";

        if (nextStreak == 3) {
            rewardTitle = "30 마일리지 (기본 10 + 3일 보너스 20)";
        } else if (nextStreak == 5) {
            rewardTitle = "40 마일리지 (기본 10 + 5일 보너스 30)";
        } else if (nextStreak == 7) {
            rewardTitle = "10 마일리지 + 매칭 이용권 1회 🎉";
        }

        AttendanceDTO result = new AttendanceDTO();
        result.setMemberSeq(memberSeq);
        result.setWeekDays(weekDays);
        result.setCurrentStreak(currentStreak);
        result.setTodayAttended(todayAttended);
        result.setTodayRewardTitle(rewardTitle);
        result.setTodayRewardSub(rewardSub);
        result.setCurrentMileage(attendanceDao.selectLatestMileageBalance(memberSeq));
        result.setCurrentTicket(attendanceDao.selectLatestTicketBalance(memberSeq));
        return result;
    }

    @Transactional
    public AttendanceDTO checkInToday(Long memberSeq) {
        LocalDate today = LocalDate.now();
        LocalDate monday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        if (attendanceDao.selectAttendanceByDate(memberSeq, today) != null) {
            throw new IllegalStateException("오늘은 이미 출석체크를 완료했습니다.");
        }

        int streak = 1;
        if (!today.equals(monday)) {
            AttendanceDTO yesterdayRecord = attendanceDao.selectAttendanceByDate(memberSeq, today.minusDays(1));
            if (yesterdayRecord != null) {
                streak = yesterdayRecord.getContinuousDays() + 1;
            }
        }

        int rewardMileage = 10;
        int rewardTicket = 0;
        String desc = "일일 출석 보상 (" + streak + "일 연속)";

        if (streak == 3) {
            rewardMileage += 20;
            desc = "일일 출석 + 3일 연속 보너스 (+20M)";
        } else if (streak == 5) {
            rewardMileage += 30;
            desc = "일일 출석 + 5일 연속 보너스 (+30M)";
        } else if (streak == 7) {
            rewardTicket = 1;
            desc = "일일 출석 + 7일 개근 보너스 (이용권 1회)";
        }

        AttendanceDTO newRecord = new AttendanceDTO();
        newRecord.setMemberSeq(memberSeq);
        newRecord.setAttendDate(today);
        newRecord.setContinuousDays(streak);
        newRecord.setRewardYn("Y");
        newRecord.setRewardMileage(rewardMileage);
        newRecord.setRewardTicket(rewardTicket);

        try {
        	attendanceDao.insertAttendance(newRecord);
        } catch (DuplicateKeyException e) {
            throw new IllegalStateException("오늘은 이미 출석체크를 완료했습니다.");
        }

        int currentMileage = attendanceDao.selectLatestMileageBalance(memberSeq);
        attendanceDao.insertMileageLedger(memberSeq, "ATTENDANCE", rewardMileage, currentMileage + rewardMileage, desc);

        if (rewardTicket > 0) {
            int currentTicket = attendanceDao.selectLatestTicketBalance(memberSeq);
            attendanceDao.insertTicketLedger(memberSeq, "ATTENDANCE", rewardTicket, currentTicket + rewardTicket, "주간 7일 연속 출석 달성 보상");
        }

        return getWeeklyStatus(memberSeq);
    }
}
