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
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/live")
public class LiveController {

    private final LiveService service;

    public LiveController(LiveService service) {
        this.service = service;
    }

    // 방송 시작 → { live_Seq, token, url }
    @PostMapping("/start")
    public ResponseEntity<Map<String, Object>> start(@RequestAttribute("id") String loginId,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(service.start(loginId, body.get("title")));
    }

    // 방송 종료
    @PostMapping("/end")
    public ResponseEntity<String> end(@RequestAttribute("id") String loginId) {
        service.end(loginId);
        return ResponseEntity.ok("방송을 종료했어요.");
    }

    // 방송 중인 목록
    @GetMapping("/list")
    public ResponseEntity<List<LiveDTO>> list() {
        return ResponseEntity.ok(service.list());
    }

    // 시청 입장 → { token, url }
    @GetMapping("/{liveSeq}/token")
    public ResponseEntity<Map<String, Object>> watch(@RequestAttribute("id") String loginId,
            @PathVariable int liveSeq) {
        return ResponseEntity.ok(service.watch(loginId, liveSeq));
    }

    // Service에서 던진 에러를 "상태 코드 + 메시지"로 응답
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<String> handleError(ResponseStatusException e) {
        return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
    }
}