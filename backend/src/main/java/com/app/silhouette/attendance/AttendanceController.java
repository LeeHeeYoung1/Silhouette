package com.app.silhouette.attendance;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @GetMapping("/weekly")
    public ResponseEntity<AttendanceDTO> getWeeklyAttendance(@RequestParam Long memberSeq) {
        return ResponseEntity.ok(attendanceService.getWeeklyStatus(memberSeq));
    }

    @PostMapping("/check")
    public ResponseEntity<?> checkInToday(@RequestBody Map<String, Object> body) {
        try {
            Object rawSeq = body != null ? body.get("memberSeq") : null;
            if (rawSeq == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "회원 번호가 필요합니다."));
            }
            Long memberSeq = (rawSeq instanceof Number) ? ((Number) rawSeq).longValue() : Long.parseLong(rawSeq.toString());
            return ResponseEntity.ok(attendanceService.checkInToday(memberSeq));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}