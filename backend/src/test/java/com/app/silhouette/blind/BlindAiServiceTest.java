package com.app.silhouette.blind;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.sql.Timestamp;
import java.util.*;

import org.junit.jupiter.api.*;
import org.mockito.ArgumentCaptor;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

// AI 추천답변(고스트채팅) 단위 테스트 (DB·Gemini 없이 가짜로 대체)
class BlindAiServiceTest {
    BlindDAO dao; ChatModel model; ObjectProvider<ChatModel> provider; BlindChatService chat; BlindAiService ai; BlindRoomDTO room;
    long seq = 900;

    @SuppressWarnings("unchecked")
    @BeforeEach void setUp() {
        dao = mock(BlindDAO.class); model = mock(ChatModel.class);
        provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(model);
        chat = new BlindChatService(dao, mock(TransactionTemplate.class), mock(SimpMessagingTemplate.class));
        ai = new BlindAiService(provider, dao, chat);
        when(dao.selectMemberSeqByLoginId("a")).thenReturn(1L);
        room = new BlindRoomDTO();
        room.setBlindChatRoomSeq(100L); room.setBlindMatchingSeq(7L); room.setMemberSeq1(1L); room.setMemberSeq2(2L);
        room.setStatus("ON AIR"); room.setDbNow(new Timestamp(1_000_000L)); room.setExpireAt(new Timestamp(1_000_000L + 600_000));
        when(dao.selectRoom(100L)).thenReturn(room);
        when(dao.selectMessages(100L)).thenReturn(List.of(msg(1, 1L, "안녕하세요"), msg(2, 2L, "반가워요! 주말에 뭐 하셨어요?")));
        when(dao.insertSuggestion(any())).thenAnswer(i -> { ((BlindSuggestionDTO) i.getArgument(0)).setAiReplySuggestionSeq(seq++); return 1; });
        when(model.call(any(Message[].class))).thenReturn("""
            ```json
            [{"tone":"EMPATHY","text":"저도 반가워요!"},{"tone":"QUESTION","text":"전 산책했어요. 님은요?"},{"tone":"HUMOR","text":"주말 내내 이불이랑 데이트했어요 ㅎㅎ"},{"tone":"EXTRA","text":"네번째"}]
            ```""");
    }
    BlindChatMessageDTO msg(long id, Long sender, String text) {
        BlindChatMessageDTO m = new BlindChatMessageDTO(); m.setBlindChatMessageSeq(id); m.setSenderSeq(sender); m.setContent(text); return m;
    }

    @Test void suggestsThreeAndSaves() {
        List<BlindSuggestionDTO> list = ai.suggest("a", 100L);
        assertEquals(3, list.size());
        assertEquals(List.of("EMPATHY", "QUESTION", "HUMOR"), list.stream().map(BlindSuggestionDTO::getTone).toList());
        verify(dao, times(3)).insertSuggestion(any());
        assertEquals(2L, list.get(0).getTriggerMessageSeq());   // 상대의 마지막 메시지 기준
    }
    @Test void promptUsesMeAndPartnerOnly() {
        ai.suggest("a", 100L);
        ArgumentCaptor<Message[]> c = ArgumentCaptor.forClass(Message[].class);
        verify(model).call(c.capture());
        String user = c.getValue()[1].getText();
        assertTrue(user.contains("나: 안녕하세요")); assertTrue(user.contains("상대: 반가워요!"));
        assertFalse(user.contains("a:"));
    }
    @Test void cooldownBlocksImmediateRetry() {
        ai.suggest("a", 100L);
        ResponseStatusException e = assertThrows(ResponseStatusException.class, () -> ai.suggest("a", 100L));
        assertEquals(429, e.getStatusCode().value());
    }
    @Test void unavailableWithoutKey() {
        when(provider.getIfAvailable()).thenReturn(null);
        assertFalse(ai.isAvailable());
        assertEquals(503, assertThrows(ResponseStatusException.class, () -> ai.suggest("a", 100L)).getStatusCode().value());
    }
    @Test void needsPartnerMessage() {
        when(dao.selectMessages(100L)).thenReturn(List.of(msg(1, 1L, "안녕하세요")));
        assertEquals(400, assertThrows(ResponseStatusException.class, () -> ai.suggest("a", 100L)).getStatusCode().value());
    }
    @Test void notAfterChatTime() {
        room.setExpireAt(new Timestamp(1_000_000L - 1));
        assertEquals(409, assertThrows(ResponseStatusException.class, () -> ai.suggest("a", 100L)).getStatusCode().value());
    }
    @Test void badAnswerGives502() {
        when(model.call(any(Message[].class))).thenReturn("죄송해요, 도와드릴 수 없어요.");
        assertEquals(502, assertThrows(ResponseStatusException.class, () -> ai.suggest("a", 100L)).getStatusCode().value());
    }
    @Test void parseFixesUnknownToneAndLength() {
        List<BlindSuggestionDTO> l = ai.parse("[{\"tone\":\"x\",\"text\":\"" + "가".repeat(100) + "\"},{\"text\":\"\"}]");
        assertEquals(1, l.size()); assertEquals("EMPATHY", l.get(0).getTone()); assertEquals(60, l.get(0).getText().length());
    }
    @Test void sendMarksSuggestionSelectedAndEdited() {
        BlindSuggestionDTO s = new BlindSuggestionDTO();
        s.setAiReplySuggestionSeq(901L); s.setMemberSeq(1L); s.setBlindChatRoomSeq(100L); s.setText("저도 반가워요!"); s.setSelectedYn("N");
        when(dao.selectSuggestion(901L)).thenReturn(s);
        chat.send("a", 100L, "저도 반가워요!", 901L);
        verify(dao).updateSuggestionSelected(901L, false);
        chat.send("a", 100L, "저도 진짜 반가워요!", 901L);
        verify(dao).updateSuggestionSelected(901L, true);
    }
    @Test void sendIgnoresOthersSuggestion() {
        BlindSuggestionDTO s = new BlindSuggestionDTO();
        s.setAiReplySuggestionSeq(902L); s.setMemberSeq(2L); s.setBlindChatRoomSeq(100L); s.setText("x"); s.setSelectedYn("N");
        when(dao.selectSuggestion(902L)).thenReturn(s);
        chat.send("a", 100L, "x", 902L);
        verify(dao, never()).updateSuggestionSelected(anyLong(), anyBoolean());
    }
}
