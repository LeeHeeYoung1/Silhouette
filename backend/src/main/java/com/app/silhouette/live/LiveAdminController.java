package com.app.silhouette.live;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

// 관리자 전용 (MEMBER.ROLE = 'ROLE_ADMIN')
@RestController
@RequestMapping("/api/admin/live")
public class LiveAdminController {

    private final LiveReportService service;

    public LiveAdminController(LiveReportService service) {
        this.service = service;
    }

    // 방송 강제 종료  body: { end_reason }
    @PostMapping("/{liveRoomSeq}/end")
    public ResponseEntity<String> forceEnd(@RequestAttribute("id") String loginId,
            @PathVariable long liveRoomSeq,
            @RequestBody(required = false) Map<String, String> body) {
        service.forceEnd(loginId, liveRoomSeq, body == null ? null : body.get("end_reason"));
        return ResponseEntity.ok("방송을 강제 종료했어요.");
    }

    // 신고 목록  ?status=WAIT|DONE&page=1
    @GetMapping("/report")
    public ResponseEntity<List<LiveReportDTO>> reports(@RequestAttribute("id") String loginId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") int page) {
        return ResponseEntity.ok(service.reports(loginId, status, page));
    }

    // 신고 처리 완료
    @PostMapping("/report/{liveReportSeq}/done")
    public ResponseEntity<String> done(@RequestAttribute("id") String loginId,
            @PathVariable long liveReportSeq) {
        service.done(loginId, liveReportSeq);
        return ResponseEntity.ok("처리 완료했어요.");
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<String> handleError(ResponseStatusException e) {
        return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
    }
}
