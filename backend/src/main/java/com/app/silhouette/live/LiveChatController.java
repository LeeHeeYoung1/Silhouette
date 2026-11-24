package com.app.silhouette.live;

import java.util.Map;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

@Controller
public class LiveChatController {

    private final LiveChatService chatService;

    public LiveChatController(LiveChatService chatService) {
        this.chatService = chatService;
    }

    // STOMP 전송: /pub/live/chat  body: { liveRoomSeq, content }
    // 구독: /sub/live/{liveRoomSeq}
    @MessageMapping("/live/chat")
    public void send(LiveMessageDTO message, SimpMessageHeaderAccessor headerAccessor) {
        Map<String, Object> session = headerAccessor.getSessionAttributes();
        Object userId = session == null ? null : session.get("userId");
        if (userId == null || message == null) {
            return;
        }
        chatService.send(userId.toString(), message.getLiveRoomSeq(), message.getContent());
    }
}
