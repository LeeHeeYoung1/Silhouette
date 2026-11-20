package com.app.silhouette.live;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

// 방송자 연결이 끊긴 채 30초 넘게 지난 방송을 TIMEOUT으로 종료
@Component
public class LiveScheduler {

    private final LiveService liveService;

    public LiveScheduler(LiveService liveService) {
        this.liveService = liveService;
    }

    @Scheduled(fixedDelay = 10_000)
    public void endTimedOutLives() {
        liveService.endTimedOutLives();
    }
}
