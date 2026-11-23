package com.app.silhouette.blind;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/*
 * 블라인드 매칭 / 채팅
 *  - 매칭 대기열: STOMP  /pub/match/join, /pub/match/cancel  (회원은 웹소켓 연결 시 토큰으로 확인한 값 사용)
 *  - 채팅방:      REST   /api/blind/room/{roomSeq}/...       (회원은 토큰(LoginValidator)으로 확인한 값 사용)
 *  - 실시간 수신: STOMP  /sub/blind/chat/{roomSeq}
 */
@RestController
@RequestMapping("/api/blind")
public class BlindController {

    private final BlindService blindService;
    private final BlindChatService chatService;
    private final BlindAiService aiService;

    public BlindController(BlindService blindService, BlindChatService chatService, BlindAiService aiService) {
        this.blindService = blindService;
        this.chatService = chatService;
        this.aiService = aiService;
    }

    // ===================== 매칭 대기열 (STOMP) =====================

    @MessageMapping("/match/join")
    public void joinMatch(SimpMessageHeaderAccessor accessor) {
        String loginId = sessionUser(accessor);
        if (loginId != null) {
            blindService.joinQueue(loginId, accessor.getSessionId());
        }
    }

    @MessageMapping("/match/cancel")
    public void cancelMatch(SimpMessageHeaderAccessor accessor) {
        String loginId = sessionUser(accessor);
        if (loginId != null) {
            blindService.cancelQueue(loginId);
        }
    }

    // 웹소켓 연결 시 JwtChannelInterceptor가 저장한 로그인 아이디
    private String sessionUser(SimpMessageHeaderAccessor accessor) {
        Map<String, Object> attributes = accessor.getSessionAttributes();
        return attributes == null ? null : (String) attributes.get("userId");
    }

    // ===================== 채팅방 (REST) =====================

    // 방 상태 (단계, 남은 시간, 내 슬롯, 결론)
    @GetMapping("/room/{roomSeq}")
    public BlindRoomStateDTO state(@RequestAttribute("id") String loginId, @PathVariable long roomSeq) {
        return chatService.state(loginId, roomSeq);
    }

    // 이전 메시지 (새로고침 복원)
    @GetMapping("/room/{roomSeq}/messages")
    public List<BlindChatMessageDTO> messages(@RequestAttribute("id") String loginId, @PathVariable long roomSeq) {
        return chatService.messages(loginId, roomSeq);
    }

    // 메시지 전송 { content, aiReplySuggestionSeq? }
    @PostMapping("/room/{roomSeq}/messages")
    public BlindChatMessageDTO send(@RequestAttribute("id") String loginId, @PathVariable long roomSeq,
            @RequestBody Map<String, Object> body) {
        Object content = body.get("content");
        Long suggestionSeq = null;
        if (body.get("aiReplySuggestionSeq") instanceof Number n) {
            suggestionSeq = n.longValue();
        }
        return chatService.send(loginId, roomSeq, content == null ? null : content.toString(), suggestionSeq);
    }

    // GO / STOP { vote: 'GO' | 'STOP' }
    @PostMapping("/room/{roomSeq}/vote")
    public BlindRoomStateDTO vote(@RequestAttribute("id") String loginId, @PathVariable long roomSeq,
            @RequestBody Map<String, Object> body) {
        Object vote = body.get("vote");
        return chatService.vote(loginId, roomSeq, vote == null ? null : vote.toString());
    }

    // 대화 중 나가기 (= STOP)
    @PostMapping("/room/{roomSeq}/leave")
    public ResponseEntity<Void> leave(@RequestAttribute("id") String loginId, @PathVariable long roomSeq) {
        chatService.leave(loginId, roomSeq);
        return ResponseEntity.ok().build();
    }

    // ===================== AI 추천답변 (고스트채팅) =====================

    // AI 추천 사용 가능 여부 (API 키 설정 여부) → { available }
    @GetMapping("/ai/status")
    public Map<String, Object> aiStatus() {
        return Map.of("available", aiService.isAvailable());
    }

    // 상대의 마지막 메시지에 대한 답장 추천 3개 → [{ aiReplySuggestionSeq, tone, text, triggerMessageSeq }]
    @PostMapping("/room/{roomSeq}/suggestions")
    public List<BlindSuggestionDTO> suggest(@RequestAttribute("id") String loginId, @PathVariable long roomSeq) {
        return aiService.suggest(loginId, roomSeq);
    }

    // Service에서 던진 에러를 "상태 코드 + 메시지"로 응답
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<String> handleError(ResponseStatusException e) {
        return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
    }
}
