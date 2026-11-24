package com.app.silhouette.report;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private ReportService reportService;

    // 신고하기  body: { targetType: "POST"|"COMMENT", targetSeq, reasonType, reasonDetail }
    @PostMapping
    public ResponseEntity<Map<String, Object>> create(
            @RequestBody ReportDTO dto,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        long reportSeq = reportService.insertReport(dto, authorization);
        return ResponseEntity.ok(Map.of("reportSeq", reportSeq));
    }

    // 신고했는지 확인  ?targetType=POST&targetSeq=39
    @GetMapping("/check")
    public Map<String, Object> check(
            @RequestParam String targetType,
            @RequestParam long targetSeq,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return Map.of("reported", reportService.isReported(targetType, targetSeq, authorization));
    }

    // 내 신고 내역 (M013)  ?page=1&size=10
    @GetMapping("/me")
    public Map<String, Object> myReports(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return reportService.selectMyReports(page, size, authorization);
    }
}