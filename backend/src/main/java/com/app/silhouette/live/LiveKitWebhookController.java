package com.app.silhouette.live;

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
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        WebhookEvent event;
        try {
            event = receiver.receive(body, auth);   // 서명·본문 해시 검증
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        liveService.handleWebhook(event);
        return ResponseEntity.ok().build();
    }
}
