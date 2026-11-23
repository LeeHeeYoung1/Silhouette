package com.app.silhouette.blind;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.sql.Timestamp;
import java.util.*;

import org.junit.jupiter.api.*;
import org.mockito.ArgumentCaptor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.*;
import org.springframework.web.server.ResponseStatusException;

// BlindChatService의 대화·GO/STOP 흐름 단위 테스트 (DB 없이 DAO를 가짜로 대체)
class BlindChatServiceTest {
    BlindDAO dao; SimpMessagingTemplate mt; BlindChatService svc; BlindRoomDTO room;

    // 트랜잭션 없이 콜백만 실행
    static class DirectTx extends TransactionTemplate {
        @Override public <T> T execute(TransactionCallback<T> action) { return action.doInTransaction(mock(TransactionStatus.class)); }
    }

    @BeforeEach void setUp() {
        dao = mock(BlindDAO.class); mt = mock(SimpMessagingTemplate.class);
        svc = new BlindChatService(dao, new DirectTx(), mt);
        ReflectionTestUtils.setField(svc, "timeLimitMin", 15);
        ReflectionTestUtils.setField(svc, "voteSeconds", 30);
        when(dao.selectMemberSeqByLoginId("a")).thenReturn(1L);
        when(dao.selectMemberSeqByLoginId("b")).thenReturn(2L);
        when(dao.selectMemberSeqByLoginId("x")).thenReturn(9L);
        room = new BlindRoomDTO();
        room.setBlindChatRoomSeq(100L); room.setBlindMatchingSeq(7L);
        room.setMemberSeq1(1L); room.setMemberSeq2(2L); room.setStatus("ON AIR"); room.setTimeLimitMin(15);
        when(dao.selectRoom(100L)).thenAnswer(i -> copy());
        when(dao.selectRoomForUpdate(100L)).thenAnswer(i -> copy());
        when(dao.updateVote(anyLong(), anyInt(), anyString(), anyBoolean())).thenAnswer(i -> {
            int slot = i.getArgument(1); String v = i.getArgument(2); boolean o = i.getArgument(3);
            String cur = slot == 1 ? room.getVote1() : room.getVote2();
            if (cur != null && !(o && "GO".equals(cur))) return 0;
            if (slot == 1) room.setVote1(v); else room.setVote2(v); return 1;
        });
        when(dao.updateRoomFinished(anyLong(), anyString(), any())).thenAnswer(i -> {
            room.setStatus(i.getArgument(1)); room.setLinkedChatRoomSeq(i.getArgument(2)); return 1; });
        when(dao.insertChatRoom(any())).thenAnswer(i -> { ((BlindRoomDTO) i.getArgument(0)).setLinkedChatRoomSeq(555L); return 1; });
    }

    BlindRoomDTO copy() {
        BlindRoomDTO r = new BlindRoomDTO();
        r.setBlindChatRoomSeq(room.getBlindChatRoomSeq()); r.setBlindMatchingSeq(room.getBlindMatchingSeq());
        r.setMemberSeq1(room.getMemberSeq1()); r.setMemberSeq2(room.getMemberSeq2());
        r.setStatus(room.getStatus()); r.setVote1(room.getVote1()); r.setVote2(room.getVote2());
        r.setLinkedChatRoomSeq(room.getLinkedChatRoomSeq()); r.setTimeLimitMin(15);
        r.setExpireAt(room.getExpireAt()); r.setDbNow(room.getDbNow());
        return r;
    }
    // 현재 시각 기준 대화 남은 초 설정 (음수면 투표 단계)
    void chatLeft(int sec) { long now = 1_000_000_000L; room.setDbNow(new Timestamp(now)); room.setExpireAt(new Timestamp(now + sec * 1000L)); }

    @SuppressWarnings("unchecked")
    List<Map<String, Object>> events() {
        ArgumentCaptor<Object> c = ArgumentCaptor.forClass(Object.class);
        verify(mt, atLeast(0)).convertAndSend(anyString(), c.capture());
        List<Map<String, Object>> out = new ArrayList<>();
        for (Object o : c.getAllValues()) out.add((Map<String, Object>) o);
        return out;
    }

    @Test void chatPhaseState() {
        chatLeft(600);
        BlindRoomStateDTO s = svc.state("b", 100L);
        assertEquals("CHAT", s.getPhase()); assertEquals(2, s.getMySlot()); assertEquals(600, s.getRemainingSeconds()); assertEquals(30, s.getVoteRemainingSeconds());
    }
    @Test void nonMemberForbidden() { chatLeft(600); assertThrows(ResponseStatusException.class, () -> svc.state("x", 100L)); }
    @Test void goDuringChatRejected() { chatLeft(600); assertThrows(ResponseStatusException.class, () -> svc.vote("a", 100L, "GO")); }
    @Test void sendAfterExpiryRejected() { chatLeft(-1); assertThrows(ResponseStatusException.class, () -> svc.send("a", 100L, "hi")); }
    @Test void sendBroadcastsSlotNotId() {
        chatLeft(600);
        when(dao.insertMessage(any())).thenAnswer(i -> { ((BlindChatMessageDTO) i.getArgument(0)).setBlindChatMessageSeq(11L); return 1; });
        svc.send("b", 100L, " 안녕 ");
        Map<String, Object> e = events().get(0);
        assertEquals("MESSAGE", e.get("kind")); assertEquals(2, e.get("senderSlot")); assertEquals("안녕", e.get("content"));
        assertFalse(e.toString().contains("senderSeq"));
    }
    @Test void bothGoContinues() {
        chatLeft(-5);
        BlindRoomStateDTO s1 = svc.vote("a", 100L, "GO");
        assertEquals("VOTE", s1.getPhase()); assertEquals("GO", s1.getMyVote()); assertTrue(events().isEmpty());
        BlindRoomStateDTO s2 = svc.vote("b", 100L, "GO");
        assertEquals("DONE", s2.getPhase()); assertEquals("CONTINUED", s2.getResult()); assertEquals(555L, s2.getLinkedChatRoomSeq());
        verify(dao, times(2)).insertChatParticipant(eq(555L), anyLong(), anyString());
        verify(dao, times(2)).insertChatRoomList(eq(555L), anyLong());
        assertEquals("CONTINUED", events().get(0).get("result"));
    }
    @Test void goThenStopEnds() {
        chatLeft(-5);
        svc.vote("a", 100L, "GO");
        svc.vote("b", 100L, "STOP");
        Map<String, Object> e = events().get(0);
        assertEquals("ENDED", e.get("result")); assertEquals("STOP", e.get("reason")); assertEquals(2, e.get("bySlot"));
        assertEquals("PARTNER_STOP", svc.state("a", 100L).getEndReason());
        assertEquals("MINE", svc.state("b", 100L).getEndReason());
        verify(dao, never()).insertChatRoom(any());
    }
    @Test void doubleVoteRejected() { chatLeft(-5); svc.vote("a", 100L, "GO"); assertThrows(ResponseStatusException.class, () -> svc.vote("a", 100L, "STOP")); }
    @Test void leaveDuringChatEndsForPartner() {
        chatLeft(300);
        svc.leave("a", 100L);
        Map<String, Object> e = events().get(0);
        assertEquals("LEFT", e.get("reason")); assertEquals(1, e.get("bySlot"));
        assertEquals("PARTNER_LEFT", svc.state("b", 100L).getEndReason());
    }
    @Test void leaveAfterGoOverrides() {
        chatLeft(-5); svc.vote("a", 100L, "GO"); svc.leave("a", 100L);
        assertEquals("ENDED", room.getStatus()); assertEquals("LEFT", room.getVote1());
    }
    @Test void timeoutWhenNobodyVotes() {
        chatLeft(-31);
        BlindRoomStateDTO s = svc.state("a", 100L);
        assertEquals("DONE", s.getPhase()); assertEquals("TIMEOUT", s.getEndReason());
        assertEquals("TIMEOUT", events().get(0).get("reason"));
    }
    @Test void voteAfterDeadlineTimesOut() {
        chatLeft(-31);
        svc.vote("a", 100L, "GO");
        assertEquals("ENDED", room.getStatus()); assertNull(room.getVote1());
    }
}
