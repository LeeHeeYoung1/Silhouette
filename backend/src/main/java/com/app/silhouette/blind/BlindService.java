package com.app.silhouette.blind;

import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

/*
 * 블라인드 랜덤 매칭 대기열 (메모리)
 *  - 이성끼리만, 서로 차단한 사이는 제외, 먼저 온 순서대로 매칭
 *  - 웹소켓 연결이 끊기면 대기열에서 제거
 *  - 서버를 재시작하면 대기열은 비워짐 (진행 중인 방은 DB에 있어서 영향 없음,
 *    대기 중이던 화면은 재연결 시 다시 등록 요청을 보냄)
 *
 * 매칭 결과 알림: /sub/user/{loginId}/match → { status: 'MATCHED', roomSeq }
 *   (익명 유지를 위해 상대 정보는 보내지 않음)
 */
@Service
public class BlindService {

    private static final Logger log = LoggerFactory.getLogger(BlindService.class);

    // 대기 중인 회원 (loginId → 정보), 들어온 순서 유지
    private final Map<String, Waiting> queue = new LinkedHashMap<>();

    private final BlindDAO dao;
    private final BlindChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    public BlindService(BlindDAO dao, BlindChatService chatService, SimpMessagingTemplate messagingTemplate) {
        this.dao = dao;
        this.chatService = chatService;
        this.messagingTemplate = messagingTemplate;
    }

    private record Waiting(String loginId, long memberSeq, String gender, String sessionId) {
    }

    // =========================================================
    // 대기열 등록 → 조건 맞는 상대가 있으면 바로 매칭
    // =========================================================
    public void joinQueue(String loginId, String sessionId) {
        BlindQueueMemberDTO member = dao.selectQueueMember(loginId);
        if (member == null) {
            return;
        }

        // 진행 중인 블라인드 대화가 있으면 그 방으로 다시 보냄 (새로고침·재접속)
        Long activeRoom = dao.selectActiveRoomSeq(member.getMemberSeq());
        if (activeRoom != null) {
            notifyMatched(loginId, activeRoom);
            return;
        }

        synchronized (queue) {
            queue.remove(loginId);   // 재등록이면 세션 정보만 갱신 (순서는 맨 뒤로)
            Waiting me = new Waiting(loginId, member.getMemberSeq(), member.getGender(), sessionId);

            Waiting partner = findPartner(me);
            if (partner == null) {
                queue.put(loginId, me);
                log.info("블라인드 대기열 등록 - 대기 인원: {}", queue.size());
                return;
            }

            queue.remove(partner.loginId());
            try {
                // 먼저 기다리던 사람이 슬롯 1
                BlindRoomDTO room = chatService.createRoom(partner.memberSeq(), me.memberSeq());
                notifyMatched(partner.loginId(), room.getBlindChatRoomSeq());
                notifyMatched(me.loginId(), room.getBlindChatRoomSeq());
                log.info("블라인드 매칭 성공 - room {}", room.getBlindChatRoomSeq());
            } catch (RuntimeException e) {
                // 방 생성 실패 → 두 사람 모두 대기열에 다시 넣어 다음 기회에 매칭
                queue.put(partner.loginId(), partner);
                queue.put(me.loginId(), me);
                log.error("블라인드 방 생성 실패", e);
            }
        }
    }

    // 이성 + 차단 관계 아님 → 가장 먼저 온 사람
    private Waiting findPartner(Waiting me) {
        Iterator<Waiting> it = queue.values().iterator();
        while (it.hasNext()) {
            Waiting w = it.next();
            if (w.memberSeq() == me.memberSeq()) continue;
            if (w.gender() == null || w.gender().equals(me.gender())) continue;
            if (dao.isBlocked(me.memberSeq(), w.memberSeq())) continue;
            return w;
        }
        return null;
    }

    // =========================================================
    // 대기 취소 / 연결 끊김
    // =========================================================
    public void cancelQueue(String loginId) {
        synchronized (queue) {
            if (queue.remove(loginId) != null) {
                log.info("블라인드 대기 취소 - 남은 인원: {}", queue.size());
            }
        }
    }

    // 웹소켓 연결이 끊기면 그 연결로 대기 중이던 회원 제거
    @EventListener
    public void onDisconnect(SessionDisconnectEvent event) {
        String sessionId = event.getSessionId();
        synchronized (queue) {
            queue.values().removeIf(w -> w.sessionId().equals(sessionId));
        }
    }

    private void notifyMatched(String loginId, long roomSeq) {
        messagingTemplate.convertAndSend("/sub/user/" + loginId + "/match",
                (Object) Map.of("status", "MATCHED", "roomSeq", roomSeq));
    }
}
