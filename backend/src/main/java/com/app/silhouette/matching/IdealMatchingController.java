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

    // 이상형 매칭 채팅방의 상대 프로필 (채팅창 사이드 표시용, 이상형 방이 아니면 404)
    @GetMapping("/room/{chatRoomSeq}/partner")
    public ResponseEntity<IdealPartnerProfileDTO> partner(@RequestAttribute("id") String loginId,
            @PathVariable int chatRoomSeq) {
        return ResponseEntity.ok(service.partnerProfile(loginId, chatRoomSeq));
    }

    // Service에서 던진 에러를 "상태 코드 + 메시지"로 응답
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<String> handleError(ResponseStatusException e) {
        return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
    }
}