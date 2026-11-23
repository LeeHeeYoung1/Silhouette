package com.app.silhouette.blind;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

// 투표 시간까지 끝났는데 결론이 안 난 블라인드 방을 종료 처리 (아무도 선택하지 않은 경우 등)
@Component
public class BlindScheduler {

    private final BlindChatService chatService;

    public BlindScheduler(BlindChatService chatService) {
        this.chatService = chatService;
    }

    @Scheduled(fixedDelay = 5_000)
    public void finishVoteExpiredRooms() {
        chatService.finishVoteExpiredRooms();
    }
}
