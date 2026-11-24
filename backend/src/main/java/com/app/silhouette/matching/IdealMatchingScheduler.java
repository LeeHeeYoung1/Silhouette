package com.app.silhouette.matching;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

// 창을 닫고 나간 이상형 매칭 대기자를 대기열에서 정리
@Component
public class IdealMatchingScheduler {

    private final IdealMatchingService service;

    public IdealMatchingScheduler(IdealMatchingService service) {
        this.service = service;
    }

    @Scheduled(fixedDelay = 10_000)
    public void removeStaleWaiting() {
        service.removeStaleWaiting();
    }
}