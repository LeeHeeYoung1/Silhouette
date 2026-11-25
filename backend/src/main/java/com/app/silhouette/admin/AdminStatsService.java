package com.app.silhouette.admin;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.app.silhouette.commons.AuthMemberService;

@Service
public class AdminStatsService {

    private static final int MIN_WEEKS = 4;
    private static final int MAX_WEEKS = 26;

    @Autowired
    private AdminStatsDAO adminStatsDAO;

    @Autowired
    private AuthMemberService authMemberService;

    /* ===================== 한 주 통계 ===================== */
    public Map<String, Object> selectWeekly(LocalDate weekStart, String authorization) {
        authMemberService.adminMember(authorization);   // 관리자만

        LocalDate thisMonday = monday(LocalDate.now());
        LocalDate start = (weekStart == null) ? thisMonday : monday(weekStart);
        if (start.isAfter(thisMonday)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "아직 오지 않은 주는 조회할 수 없어요.");
        }

        Map<String, Object> param = range(start);
        Map<String, Object> prevParam = range(start.minusWeeks(1));

        Map<String, Object> result = new HashMap<>();
        result.put("weekStart", start.toString());
        result.put("weekEnd", start.plusDays(6).toString());
        result.put("inProgress", start.equals(thisMonday));   // 이번 주면 아직 집계 중
        result.put("summary", adminStatsDAO.selectWeeklySummary(param));
        result.put("prevSummary", adminStatsDAO.selectWeeklySummary(prevParam));
        result.put("gender", adminStatsDAO.selectGenderRatio(param));
        result.put("age", adminStatsDAO.selectAgeRatio(param));
        result.put("region", adminStatsDAO.selectRegionRatio(param));
        return result;
    }

    /* ===================== 최근 N주 추이 ===================== */
    public List<WeeklyTrendDTO> selectTrend(int weeks, String authorization) {
        authMemberService.adminMember(authorization);   // 관리자만

        int safeWeeks = Math.min(Math.max(weeks, MIN_WEEKS), MAX_WEEKS);
        LocalDate lastMonday = monday(LocalDate.now());

        Map<String, Object> param = new HashMap<>();
        param.put("weeks", safeWeeks);
        param.put("lastWeekStart", lastMonday);
        param.put("rangeStart", lastMonday.minusWeeks(safeWeeks - 1));
        param.put("rangeEnd", lastMonday.plusWeeks(1));
        return adminStatsDAO.selectWeeklyTrend(param);
    }

    /* ===================== 공통 ===================== */
    private LocalDate monday(LocalDate date) {
        return date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }

    // 주 범위: weekStart(월요일 00시) 이상 ~ weekEnd(다음 주 월요일 00시) 미만
    private Map<String, Object> range(LocalDate start) {
        Map<String, Object> param = new HashMap<>();
        param.put("weekStart", start);
        param.put("weekEnd", start.plusWeeks(1));
        param.put("weekYear", start.getYear());   // 연 나이 계산 기준 연도
        return param;
    }
}