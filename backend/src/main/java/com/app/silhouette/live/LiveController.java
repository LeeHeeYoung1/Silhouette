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

@RestController
@RequestMapping("/api/live")
public class LiveController {

    private final LiveService service;

    public LiveController(LiveService service) {
        this.service = service;
    }

    // 방송 시작 → { live_room_seq, token, url }
    // body: { title, description, category, hashtags: [], thumbnail_url }
    @PostMapping
    public ResponseEntity<Map<String, Object>> start(@RequestAttribute("id") String loginId,
            @RequestBody LiveRoomDTO body) {
        return ResponseEntity.ok(service.start(loginId, body));
    }

    // 방송 중 목록 (시청자 수 내림차순, 페이지당 20개)
    @GetMapping
    public ResponseEntity<List<LiveRoomDTO>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "1") int page) {
        return ResponseEntity.ok(service.list(keyword, category, page));
    }

    // 방송 상세
    @GetMapping("/{liveRoomSeq}")
    public ResponseEntity<LiveRoomDTO> detail(@PathVariable long liveRoomSeq) {
        return ResponseEntity.ok(service.detail(liveRoomSeq));
    }

    // 시청 입장 검증 → { token, url, room }
    @PostMapping("/{liveRoomSeq}/join")
    public ResponseEntity<Map<String, Object>> join(@RequestAttribute("id") String loginId,
            @PathVariable long liveRoomSeq) {
        return ResponseEntity.ok(service.join(loginId, liveRoomSeq));
    }

    // 방송자 종료
    @PostMapping("/{liveRoomSeq}/end")
    public ResponseEntity<String> end(@RequestAttribute("id") String loginId,
            @PathVariable long liveRoomSeq) {
        service.endByHost(loginId, liveRoomSeq);
        return ResponseEntity.ok("방송을 종료했어요.");
    }

    // Service에서 던진 에러를 "상태 코드 + 메시지"로 응답
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<String> handleError(ResponseStatusException e) {
        return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
    }
}
