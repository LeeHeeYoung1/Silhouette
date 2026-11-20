package com.app.silhouette.live;

import java.util.Date;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class LiveChatService {

    private static final int CONTENT_MAX = 100;
    private static final long SEND_INTERVAL_MILLIS = 1_000;

    private final LiveDAO dao;
    private final LiveChatFilter filter;
    private final SimpMessagingTemplate messagingTemplate;

    // 회원 번호 → 마지막 전송 시각 (1초에 1개 제한)
    private final Map<Long, Long> lastSent = new ConcurrentHashMap<>();

    public LiveChatService(LiveDAO dao, LiveChatFilter filter, SimpMessagingTemplate messagingTemplate) {
        this.dao = dao;
        this.filter = filter;
        this.messagingTemplate = messagingTemplate;
    }

    // 보낸 사람은 클라이언트 값이 아니라 WebSocket 세션의 로그인 아이디로 판단
    // 조건에 안 맞으면 조용히 무시 (클라이언트에서도 같은 검사를 함)
    public void send(String loginId, Long liveRoomSeq, String rawContent) {
        if (loginId == null || liveRoomSeq == null || rawContent == null) {
            return;
        }
        Long me = dao.selectMemberSeqByLoginId(loginId);
        if (me == null) {
            return;
        }

        LiveRoomDTO room = dao.selectLiveRoom(liveRoomSeq);
        if (room == null || !"LIVE".equals(room.getStatus())) {
            return;
        }
        boolean isHost = room.getHost_seq().longValue() == me;

        // ① 현재 시청 중인지 + ② 강퇴 여부 (countWatching에서 KICKED_YN='N'까지 확인)
        if (!isHost && !dao.isWatching(liveRoomSeq, me)) {
            return;
        }

        // ③ 100자 이하
        String content = rawContent.replaceAll("\\p{Cntrl}", " ").trim();
        if (content.isEmpty() || content.codePointCount(0, content.length()) > CONTENT_MAX) {
            return;
        }

        // ④ 1초에 1개
        if (!tryAcquire(me)) {
            return;
        }

        // ⑤ 금칙어 치환 → ⑥ 저장 → ⑦ 브로드캐스트
        content = filter.apply(content);
        long chatSeq = dao.insertChat(liveRoomSeq, me, content);

        LiveMessageDTO msg = LiveMessageDTO.of("CHAT", liveRoomSeq, content);
        msg.setLive_chat_seq(chatSeq);
        msg.setMember_seq(me);
        msg.setNickname(dao.selectNickname(me));
        msg.setHost_yn(isHost ? "Y" : "N");
        msg.setCreated_at(new Date());
        messagingTemplate.convertAndSend("/sub/live/" + liveRoomSeq, msg);
    }

    private boolean tryAcquire(long memberSeq) {
        long now = System.currentTimeMillis();
        boolean[] ok = { false };
        lastSent.compute(memberSeq, (k, last) -> {
            if (last != null && now - last < SEND_INTERVAL_MILLIS) {
                return last;
            }
            ok[0] = true;
            return now;
        });
        return ok[0];
    }
}
