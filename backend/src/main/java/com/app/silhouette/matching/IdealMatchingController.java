package com.app.silhouette.matching;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/matching/ideal")
public class IdealMatchingController {

    private final IdealMatchingService service;

    public IdealMatchingController(IdealMatchingService service) {
        this.service = service;
    }

    // 매칭 신청
    @PostMapping("/start")
    public ResponseEntity<IdealMatchResultDTO> start(@RequestAttribute("id") String loginId) {
        return ResponseEntity.ok(service.start(loginId));
    }

    // 매칭 상태 확인 (대기 중일 때 주기적으로 호출)
    @GetMapping("/status")
    public ResponseEntity<IdealMatchResultDTO> status(@RequestAttribute("id") String loginId) {
        return ResponseEntity.ok(service.status(loginId));
    }

    // 대기 취소
    @PostMapping("/cancel")
    public ResponseEntity<String> cancel(@RequestAttribute("id") String loginId) {
        service.cancel(loginId);
        return ResponseEntity.ok("매칭 대기를 취소했어요.");
    }

    // 매칭 종료 (채팅방 나가기)
    @PostMapping("/end/{chatRoomSeq}")
    public ResponseEntity<String> end(@RequestAttribute("id") String loginId,
            @PathVariable int chatRoomSeq) {
        service.end(loginId, chatRoomSeq);
        return ResponseEntity.ok("매칭을 종료했어요.");
    }

    // Service에서 던진 에러를 "상태 코드 + 메시지"로 응답
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<String> handleError(ResponseStatusException e) {
        return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
    }
}