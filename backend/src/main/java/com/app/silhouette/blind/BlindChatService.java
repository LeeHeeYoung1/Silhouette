package com.app.silhouette.blind;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

/*
 * 블라인드 채팅방: 상태 조회 / 메시지 / GO·STOP
 *
 * 시간 흐름 (모두 DB 시각 기준)
 *   STARTED_AT ── 대화(timeLimitMin분) ── EXPIRE_AT ── 투표(voteSeconds초) ── 마감
 *
 * 결론
 *   둘 다 GO            → CONTINUED (일반 채팅방 생성, 프로필 공개)
 *   한 명이라도 STOP/LEFT → ENDED
 *   마감까지 둘 다 GO 아님 → ENDED (TIMEOUT, 스케줄러가 처리)
 *
 * 실시간 알림: /sub/blind/chat/{roomSeq}
 *   { kind: 'MESSAGE', ...메시지 }
 *   { kind: 'RESULT', result: 'CONTINUED', chatRoomSeq }
 *   { kind: 'RESULT', result: 'ENDED', reason: 'STOP' | 'LEFT' | 'TIMEOUT', bySlot }
 */
@Service
public class BlindChatService {

    private static final Logger log = LoggerFactory.getLogger(BlindChatService.class);

    static final String STATUS_ON_AIR = "ON AIR";
    static final String STATUS_CONTINUED = "CONTINUED";
    static final String STATUS_ENDED = "ENDED";

    static final String VOTE_GO = "GO";
    static final String VOTE_STOP = "STOP";
    static final String VOTE_LEFT = "LEFT";

    private static final int MAX_MESSAGE_LENGTH = 500;

    private final BlindDAO dao;
    private final TransactionTemplate tx;
    private final SimpMessagingTemplate messagingTemplate;

    @Value("${blind.time-limit-min:15}")
    private int timeLimitMin;

    @Value("${blind.vote-seconds:30}")
    private int voteSeconds;

    public BlindChatService(BlindDAO dao, TransactionTemplate tx, SimpMessagingTemplate messagingTemplate) {
        this.dao = dao;
        this.tx = tx;
        this.messagingTemplate = messagingTemplate;
    }

    // =========================================================
    // 관리자 동적 설정 (제한 시간 / 투표 시간)
    // =========================================================
    public int getTimeLimitMin() {
        return timeLimitMin;
    }

    public void setTimeLimitMin(int timeLimitMin) {
        if (timeLimitMin > 0) {
            this.timeLimitMin = timeLimitMin;
        }
    }

    public int getVoteSeconds() {
        return voteSeconds;
    }

    public void setVoteSeconds(int voteSeconds) {
        if (voteSeconds > 0) {
            this.voteSeconds = voteSeconds;
        }
    }

    // =========================================================
    // 방 생성 (매칭 성공 시 BlindMatchService가 호출)
    // =========================================================
    public BlindRoomDTO createRoom(long memberSeq1, long memberSeq2) {
        return tx.execute(status -> {
            BlindRoomDTO room = new BlindRoomDTO();
            room.setMemberSeq1(memberSeq1);
            room.setMemberSeq2(memberSeq2);
            room.setTimeLimitMin(timeLimitMin);
            dao.insertMatching(room);   // blindMatchingSeq 채워짐
            dao.insertRoom(room);       // blindChatRoomSeq 채워짐
            return room;
        });
    }

    // =========================================================
    // 방 상태 (요청한 사람 기준)
    // =========================================================
    public BlindRoomStateDTO state(String loginId, long roomSeq) {
        long me = getMemberSeq(loginId);
        BlindRoomDTO room = getRoom(roomSeq);
        int mySlot = requireSlot(room, me);

        // 투표 마감이 지났는데 스케줄러가 아직 처리 전이면 여기서 바로 종료 처리
        if (STATUS_ON_AIR.equals(room.getStatus()) && voteRemainingMillis(room) <= 0) {
            finishByTimeout(roomSeq);
            room = getRoom(roomSeq);
        }

        BlindRoomStateDTO s = new BlindRoomStateDTO();
        s.setRoomSeq(roomSeq);
        s.setMySlot(mySlot);
        s.setTimeLimitMin(room.getTimeLimitMin() == null ? timeLimitMin : room.getTimeLimitMin());
        s.setVoteSeconds(voteSeconds);
        s.setMyVote(room.voteOf(mySlot));
        s.setRemainingSeconds(toSeconds(chatRemainingMillis(room)));
        s.setVoteRemainingSeconds(toSeconds(Math.min(voteRemainingMillis(room), voteSeconds * 1000L)));

        if (STATUS_CONTINUED.equals(room.getStatus())) {
            s.setPhase("DONE");
            s.setResult(STATUS_CONTINUED);
            s.setLinkedChatRoomSeq(room.getLinkedChatRoomSeq());
        } else if (STATUS_ENDED.equals(room.getStatus())) {
            s.setPhase("DONE");
            s.setResult(STATUS_ENDED);
            s.setEndReason(endReasonFor(room, mySlot));
        } else {
            s.setPhase(chatRemainingMillis(room) > 0 ? "CHAT" : "VOTE");
        }
        return s;
    }

    // =========================================================
    // 메시지 목록 (새로고침 시 이전 대화 복원)
    // =========================================================
    public List<BlindChatMessageDTO> messages(String loginId, long roomSeq) {
        long me = getMemberSeq(loginId);
        BlindRoomDTO room = getRoom(roomSeq);
        requireSlot(room, me);

        List<BlindChatMessageDTO> list = dao.selectMessages(roomSeq);
        for (BlindChatMessageDTO m : list) {
            m.setSenderSlot(m.getSenderSeq() == null ? 0 : room.slotOf(m.getSenderSeq()));
        }
        return list;
    }

    // =========================================================
    // 메시지 전송 (대화 시간 안에만)
    // aiReplySuggestionSeq: AI 추천을 골라서 보낸 경우 그 추천 번호 (없으면 null)
    // =========================================================
    public BlindChatMessageDTO send(String loginId, long roomSeq, String content, Long aiReplySuggestionSeq) {
        long me = getMemberSeq(loginId);
        BlindRoomDTO room = getRoom(roomSeq);
        int mySlot = requireSlot(room, me);

        if (!STATUS_ON_AIR.equals(room.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 종료된 대화예요.");
        }
        if (chatRemainingMillis(room) <= 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "대화 시간이 끝났어요.");
        }
        if (VOTE_LEFT.equals(room.voteOf(mySlot))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 나간 대화예요.");
        }

        String text = content == null ? "" : content.trim();
        if (text.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "메시지를 입력해주세요.");
        }
        if (text.length() > MAX_MESSAGE_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "메시지는 " + MAX_MESSAGE_LENGTH + "자까지 보낼 수 있어요.");
        }

        // AI 추천을 골라서 보낸 경우: 내 추천이고 이 방의 것이며 아직 안 쓴 것만 인정
        BlindSuggestionDTO suggestion = null;
        if (aiReplySuggestionSeq != null) {
            BlindSuggestionDTO s = dao.selectSuggestion(aiReplySuggestionSeq);
            if (s != null && Long.valueOf(me).equals(s.getMemberSeq())
                    && Long.valueOf(roomSeq).equals(s.getBlindChatRoomSeq()) && "N".equals(s.getSelectedYn())) {
                suggestion = s;
            }
        }

        BlindChatMessageDTO message = new BlindChatMessageDTO();
        message.setBlindChatRoomSeq(roomSeq);
        message.setSenderSeq(me);
        message.setContent(text);
        message.setAiReplySuggestionSeq(suggestion == null ? null : suggestion.getAiReplySuggestionSeq());
        dao.insertMessage(message);   // blindChatMessageSeq 채워짐

        if (suggestion != null) {
            // 고쳐서 보냈는지도 기록 (추천 품질 확인용)
            dao.updateSuggestionSelected(suggestion.getAiReplySuggestionSeq(), !text.equals(suggestion.getText()));
        }

        message.setSenderSlot(mySlot);
        message.setSentAt(room.getDbNow());

        Map<String, Object> event = new HashMap<>();
        event.put("kind", "MESSAGE");
        event.put("blindChatMessageSeq", message.getBlindChatMessageSeq());
        event.put("senderSlot", mySlot);
        event.put("content", text);
        event.put("sentAt", message.getSentAt());
        broadcast(roomSeq, event);

        return message;
    }

    // =========================================================
    // GO / STOP (투표 시간 안에만)
    // =========================================================
    public BlindRoomStateDTO vote(String loginId, long roomSeq, String vote) {
        if (!VOTE_GO.equals(vote) && !VOTE_STOP.equals(vote)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "GO 또는 STOP만 선택할 수 있어요.");
        }
        long me = getMemberSeq(loginId);
        applyVote(roomSeq, me, vote, false);
        return state(loginId, roomSeq);
    }

    // =========================================================
    // 대화 중 나가기 (= STOP, 상대에게는 "상대가 대화를 종료했어요")
    // =========================================================
    public void leave(String loginId, long roomSeq) {
        long me = getMemberSeq(loginId);
        applyVote(roomSeq, me, VOTE_LEFT, true);
    }

    // 선택 저장 + 결론 판단 (하나의 트랜잭션), 결론이 나면 커밋 후 두 사람에게 알림
    private void applyVote(long roomSeq, long me, String vote, boolean leaving) {
        Map<String, Object> event = tx.execute(status -> {
            BlindRoomDTO room = dao.selectRoomForUpdate(roomSeq);
            if (room == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "대화방을 찾을 수 없어요.");
            }
            int slot = requireSlot(room, me);

            if (!STATUS_ON_AIR.equals(room.getStatus())) {
                if (leaving) return null;   // 이미 끝난 방에서 나가기 → 그냥 무시
                throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 종료된 대화예요.");
            }
            if (voteRemainingMillis(room) <= 0) {
                return null;                // 마감 지남 → 아래에서 시간초과로 처리
            }
            if (!leaving && chatRemainingMillis(room) > 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "아직 대화 시간이에요.");
            }

            String current = room.voteOf(slot);
            if (current != null && !(leaving && VOTE_GO.equals(current))) {
                if (leaving) return null;   // 이미 STOP/LEFT
                throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 선택했어요.");
            }

            dao.updateVote(room.getBlindMatchingSeq(), slot, vote, leaving);
            if (slot == 1) room.setVote1(vote); else room.setVote2(vote);

            return decide(room);
        });

        if (event == null) {
            // 마감이 지나서 처리하지 못한 경우: 시간초과 종료
            finishByTimeout(roomSeq);
            return;
        }
        if (!event.isEmpty()) {
            broadcast(roomSeq, event);
        }
    }

    // 두 사람의 선택으로 결론 (아직이면 빈 Map)
    private Map<String, Object> decide(BlindRoomDTO room) {
        long roomSeq = room.getBlindChatRoomSeq();
        Set<String> stops = Set.of(VOTE_STOP, VOTE_LEFT);

        for (int slot = 1; slot <= 2; slot++) {
            String v = room.voteOf(slot);
            if (v != null && stops.contains(v)) {
                dao.updateRoomFinished(roomSeq, STATUS_ENDED, null);
                dao.updateMatchingStatus(room.getBlindMatchingSeq(), STATUS_ENDED);
                Map<String, Object> event = new HashMap<>();
                event.put("kind", "RESULT");
                event.put("result", STATUS_ENDED);
                event.put("reason", v);          // STOP / LEFT
                event.put("bySlot", slot);
                return event;
            }
        }

        if (VOTE_GO.equals(room.getVote1()) && VOTE_GO.equals(room.getVote2())) {
            // 일반 채팅방 생성 (채팅 기능 규칙: CHAT_ROOM + CHAT_PARTICIPANT + CHAT_ROOM_LIST)
            dao.insertChatRoom(room);   // linkedChatRoomSeq 채워짐
            long chatRoomSeq = room.getLinkedChatRoomSeq();
            dao.insertChatParticipant(chatRoomSeq, room.getMemberSeq1(), "OWNER");
            dao.insertChatParticipant(chatRoomSeq, room.getMemberSeq2(), "MEMBER");
            dao.insertChatRoomList(chatRoomSeq, room.getMemberSeq1());
            dao.insertChatRoomList(chatRoomSeq, room.getMemberSeq2());

            dao.updateRoomFinished(roomSeq, STATUS_CONTINUED, chatRoomSeq);
            dao.updateMatchingStatus(room.getBlindMatchingSeq(), STATUS_CONTINUED);

            Map<String, Object> event = new HashMap<>();
            event.put("kind", "RESULT");
            event.put("result", STATUS_CONTINUED);
            event.put("chatRoomSeq", chatRoomSeq);
            return event;
        }

        return Map.of();   // 한 명만 GO → 상대 선택 대기
    }

    // =========================================================
    // 투표 마감 처리 (스케줄러 + 상태 조회 시)
    // =========================================================
    public void finishVoteExpiredRooms() {
        for (Long roomSeq : dao.selectVoteExpiredRoomSeqs(voteSeconds)) {
            try {
                finishByTimeout(roomSeq);
            } catch (Exception e) {
                log.warn("블라인드 투표 마감 처리 실패 - room {}", roomSeq, e);
            }
        }
    }

    private void finishByTimeout(long roomSeq) {
        Boolean finished = tx.execute(status -> {
            BlindRoomDTO room = dao.selectRoomForUpdate(roomSeq);
            if (room == null || !STATUS_ON_AIR.equals(room.getStatus()) || voteRemainingMillis(room) > 0) {
                return false;
            }
            dao.updateRoomFinished(roomSeq, STATUS_ENDED, null);
            dao.updateMatchingStatus(room.getBlindMatchingSeq(), STATUS_ENDED);
            return true;
        });

        if (Boolean.TRUE.equals(finished)) {
            Map<String, Object> event = new HashMap<>();
            event.put("kind", "RESULT");
            event.put("result", STATUS_ENDED);
            event.put("reason", "TIMEOUT");
            broadcast(roomSeq, event);
        }
    }

    // =========================================================
    // 내부 공통
    // =========================================================

    long getMemberSeq(String loginId) {
        Long seq = loginId == null ? null : dao.selectMemberSeqByLoginId(loginId);
        if (seq == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "회원 정보를 찾을 수 없어요.");
        }
        return seq;
    }

    BlindRoomDTO getRoom(long roomSeq) {
        BlindRoomDTO room = dao.selectRoom(roomSeq);
        if (room == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "대화방을 찾을 수 없어요.");
        }
        return room;
    }

    int requireSlot(BlindRoomDTO room, long memberSeq) {
        int slot = room.slotOf(memberSeq);
        if (slot == 0) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "참여 중인 대화방이 아니에요.");
        }
        return slot;
    }

    // 대화 남은 시간 (ms)
    long chatRemainingMillis(BlindRoomDTO room) {
        return room.getExpireAt().getTime() - room.getDbNow().getTime();
    }

    // 투표 마감까지 남은 시간 (ms)
    private long voteRemainingMillis(BlindRoomDTO room) {
        return chatRemainingMillis(room) + voteSeconds * 1000L;
    }

    private long toSeconds(long millis) {
        return millis <= 0 ? 0 : (millis + 999) / 1000;   // 올림
    }

    private String endReasonFor(BlindRoomDTO room, int mySlot) {
        String mine = room.voteOf(mySlot);
        String partner = room.voteOf(mySlot == 1 ? 2 : 1);
        if (VOTE_STOP.equals(mine) || VOTE_LEFT.equals(mine)) return "MINE";
        if (VOTE_STOP.equals(partner)) return "PARTNER_STOP";
        if (VOTE_LEFT.equals(partner)) return "PARTNER_LEFT";
        return "TIMEOUT";
    }

    private void broadcast(long roomSeq, Map<String, Object> event) {
        messagingTemplate.convertAndSend("/sub/blind/chat/" + roomSeq, (Object) event);
    }
}
