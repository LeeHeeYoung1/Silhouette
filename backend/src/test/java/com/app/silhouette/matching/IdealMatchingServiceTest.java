package com.app.silhouette.matching;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

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

    @Test void statusWhenNotQueuedIsIdle() {
        when(dao.selectQueueStatus(1)).thenReturn(null);
        assertEquals("IDLE", service.status("a").getStatus());
        verify(dao, never()).selectCandidate(anyInt(), anyLong());
    }
}
