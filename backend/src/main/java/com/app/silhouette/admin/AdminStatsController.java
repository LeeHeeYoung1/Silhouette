package com.app.silhouette.admin;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

/* =========================================================
   관리자 메인 통계 대시보드 (A005)
   - 이용자 = 그 주에 출석체크(ATTENDANCE)한 회원
   - 주 단위: 월요일 ~ 일요일
   ========================================================= */
@RestController
@RequestMapping("/api/admin/stats")
public class AdminStatsController {

    @Autowired
    private AdminStatsService adminStatsService;

    // 한 주 통계  ?weekStart=2026-11-23 (없으면 이번 주, 월요일이 아니면 그 주 월요일로 맞춤)
    @GetMapping("/weekly")
    public Map<String, Object> weekly(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return adminStatsService.selectWeekly(weekStart, authorization);
    }

    // 주간 추이  ?weeks=8 (최근 N주, 4~26)
    @GetMapping("/trend")
    public List<WeeklyTrendDTO> trend(
            @RequestParam(defaultValue = "8") int weeks,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return adminStatsService.selectTrend(weeks, authorization);
    }
}