package com.app.silhouette.live;


import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.livekit.server.WebhookReceiver;
import livekit.LivekitWebhook.WebhookEvent;

// LiveKit 서버 → 우리 서버 이벤트 수신
// JWT 대신 LiveKit 서명(Authorization 헤더)으로 검증한다 (InterceptorConfig에서 제외)
// ※ LiveKit Cloud는 localhost로 못 보내므로 로컬 개발 시 ngrok 등 터널 필요
@RestController
@RequestMapping("/api/livekit")
public class LiveKitWebhookController {

    private static final Logger log = LoggerFactory.getLogger(LiveKitWebhookController.class);
    private final WebhookReceiver receiver;
    private final LiveService liveService;

    public LiveKitWebhookController(LiveService liveService,
            @Value("${livekit.api-key}") String apiKey,
            @Value("${livekit.api-secret}") String apiSecret) {
        this.liveService = liveService;
        this.receiver = new WebhookReceiver(apiKey, apiSecret);
    }

    @PostMapping("/webhook")
    public ResponseEntity<Void> receive(@RequestBody String body,
            @RequestHeader(value = "Authorization", required = false) String auth) {
        if (auth == null || auth.isBlank()) {
            log.warn("LiveKit webhook 거부: Authorization 헤더 없음");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        WebhookEvent event;
        try {
            event = receiver.receive(body, auth);   // 서명·본문 해시 검증
        } catch (Exception e) {
            log.warn("LiveKit webhook 서명 검증 실패: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        log.info("LiveKit webhook 수신: {} room={} identity={}", event.getEvent(),
                event.getRoom().getName(), event.getParticipant().getIdentity());
        liveService.handleWebhook(event);
        return ResponseEntity.ok().build();
    }
}
