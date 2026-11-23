package com.app.silhouette.report;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminReportController {

    @Autowired
    private AdminReportService adminReportService;

    // 신고 목록  ?status=WAITING|DONE|REJECTED&page=1&size=10
    @GetMapping("/reports")
    public Map<String, Object> reports(
            @RequestParam(defaultValue = "WAITING") String status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return adminReportService.selectReports(status, page, size, authorization);
    }

    // 신고 처리  body: { action: "REJECT"|"DONE", adminMemo, deleteTarget, blacklist, blacklistDays, blacklistReason }
    @PutMapping("/reports/{reportSeq}")
    public ResponseEntity<Void> process(
            @PathVariable long reportSeq,
            @RequestBody ReportProcessDTO req,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        adminReportService.processReport(reportSeq, req, authorization);
        return ResponseEntity.ok().build();
    }

    // 블랙리스트 목록  ?activeOnly=true&page=1&size=10
    @GetMapping("/blacklist")
    public Map<String, Object> blacklist(
            @RequestParam(defaultValue = "true") boolean activeOnly,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        return adminReportService.selectBlacklist(activeOnly, page, size, authorization);
    }

    // 블랙리스트 해제
    @PutMapping("/blacklist/{blacklistSeq}/release")
    public ResponseEntity<Void> release(
            @PathVariable long blacklistSeq,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        adminReportService.releaseBlacklist(blacklistSeq, authorization);
        return ResponseEntity.ok().build();
    }
}