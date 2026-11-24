package com.app.silhouette.matching;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.List;

import org.junit.jupiter.api.*;
import org.springframework.transaction.support.TransactionTemplate;

// 이상형 매칭: 대기 중 상태 확인 때 재탐색 + 대기 시간 전달 (DB 없이 가짜로 대체)
class IdealMatchingServiceTest {
    IdealMatchingDAO dao; IdealMatchingService service;

    @BeforeEach void setUp() {
        dao = mock(IdealMatchingDAO.class);
        service = new IdealMatchingService(dao, mock(TransactionTemplate.class));
        when(dao.selectMemberSeqByLoginId("a")).thenReturn(1);
        when(dao.countProfile(1)).thenReturn(1);
    }

    @Test void startSearchesWithZeroWait() {
        when(dao.selectQueueStatus(1)).thenReturn(null, "WAITING");
        assertEquals("WAITING", service.start("a").getStatus());
        verify(dao).insertQueue(1);
        verify(dao).selectCandidate(1, 0L);
    }

    @Test void statusWhileWaitingSearchesAgain() {
        when(dao.selectQueueStatus(1)).thenReturn("WAITING");
        assertEquals("WAITING", service.status("a").getStatus());
        verify(dao).selectCandidate(eq(1), anyLong());   // 예전에는 대기 중이면 다시 찾지 않았음
    }

    // ----- 나간 대기자 정리 -----
    long now = 1_000_000L;

    @Test void staleWaitingIsRemovedAfterNoPolling() {
        service.clock = () -> now;
        when(dao.selectQueueStatus(1)).thenReturn("WAITING");
        service.status("a");                                   // 마지막 확인
        when(dao.selectWaitingMembers()).thenReturn(List.of(1));

        now += IdealMatchingService.STALE_MILLIS - 1000;       // 아직 기준 안 넘음
        service.removeStaleWaiting();
        verify(dao, never()).deleteWaitingQueue(1);

        now += 2000;                                           // 기준 넘김
        service.removeStaleWaiting();
        verify(dao).deleteWaitingQueue(1);
    }

    @Test void pollingKeepsWaiting() {
        service.clock = () -> now;
        when(dao.selectQueueStatus(1)).thenReturn("WAITING");
        when(dao.selectWaitingMembers()).thenReturn(List.of(1));
        for (int i = 0; i < 60; i++) {                         // 3초마다 확인 × 3분
            now += 3000;
            service.status("a");
            service.removeStaleWaiting();
        }
        verify(dao, never()).deleteWaitingQueue(1);
    }

    @Test void unknownWaitingStartsTimerFirst() {                // 서버 재시작 직후: 바로 지우지 않음
        service.clock = () -> now;
        when(dao.selectWaitingMembers()).thenReturn(List.of(2));
        service.removeStaleWaiting();
        verify(dao, never()).deleteWaitingQueue(2);
        now += IdealMatchingService.STALE_MILLIS + 1;
        service.removeStaleWaiting();
        verify(dao).deleteWaitingQueue(2);
    }

    @Test void statusWhenNotQueuedIsIdle() {
        when(dao.selectQueueStatus(1)).thenReturn(null);
        assertEquals("IDLE", service.status("a").getStatus());
        verify(dao, never()).selectCandidate(anyInt(), anyLong());
    }
}