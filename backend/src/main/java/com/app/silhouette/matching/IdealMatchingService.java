package com.app.silhouette.matching;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.LongSupplier;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

@Service
public class IdealMatchingService {

    // 동시에 같은 상대를 노린 경우 다시 시도하는 최대 횟수
    private static final int MAX_RETRY = 3;

    private static final String QUEUE_WAITING = "WAITING";
    private static final String QUEUE_MATCHED = "MATCHED";

    // 이 시간 동안 상태 확인(3초 폴링)이 없으면 창을 닫고 나간 대기자로 보고 대기열에서 뺀다
    // 브라우저는 백그라운드 탭의 타이머를 최대 1분에 한 번으로 늦추므로 1분보다 넉넉하게 잡음
    static final long STALE_MILLIS = 90_000;

    private final IdealMatchingDAO dao;
    private final TransactionTemplate tx;

    // 회원별 대기 시작 시각(ms). 대기가 길수록 매칭 기준점을 낮추는 데 사용
    // 서버가 재시작되면 비워지고, 그 뒤 처음 확인한 시각부터 다시 잰다
    private final Map<Integer, Long> waitStartedAt = new ConcurrentHashMap<>();

    // 회원별 마지막 상태 확인 시각(ms). 오래 확인이 없는 대기자를 정리하는 데 사용
    private final Map<Integer, Long> lastSeenAt = new ConcurrentHashMap<>();

    // 현재 시각 (테스트에서 시간을 바꿔 끼우기 위해 분리)
    LongSupplier clock = System::currentTimeMillis;

    IdealMatchingService(IdealMatchingDAO dao, TransactionTemplate tx) {
        this.dao = dao;
        this.tx = tx;
    }

    // =========================================================
    // 매칭 신청
    // =========================================================
    public IdealMatchResultDTO start(String loginId) {
        int me = getMemberSeq(loginId);

        // 프로필이 있어야 상대가 나를 평가할 수 있음 (이상형은 선택)
        if (dao.countProfile(me) == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "프로필을 먼저 등록해주세요.");
        }

        String queue = dao.selectQueueStatus(me);

        // 대기 중에 다른 사람이 나를 이미 매칭함 → 그 결과로 바로 이동
        if (QUEUE_MATCHED.equals(queue)) {
            return receiveMatched(me);
        }

        // 처음 신청이면 대기열 등록 (WAITING이면 이미 대기 중 → 그대로 후보 탐색)
        if (queue == null) {
            try {
                dao.insertQueue(me);
            } catch (DuplicateKeyException e) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 매칭이 진행 중이에요.");
            }
            waitStartedAt.put(me, clock.getAsLong());
        }
        lastSeenAt.put(me, clock.getAsLong());

        return tryMatch(me);
    }

    // 후보를 찾아 매칭 확정까지 시도 (동시성 충돌이면 재시도)
    private IdealMatchResultDTO tryMatch(int me) {
        for (int i = 0; i < MAX_RETRY; i++) {

            // 그 사이 다른 사람이 나를 먼저 매칭했을 수 있음
            if (QUEUE_MATCHED.equals(dao.selectQueueStatus(me))) {
                return receiveMatched(me);
            }

            IdealCandidateDTO cand = dao.selectCandidate(me, waitedSec(me));
            if (cand == null) {
                return IdealMatchResultDTO.waiting();   // 후보 없음 → 대기
            }

            IdealMatchResultDTO result = tx.execute(status -> confirm(me, cand, status));
            if (result != null) {
                return result;                          // 매칭 성공
            }
            // null → 다른 사람이 그 후보를 먼저 데려감 → 다시 시도
        }
        return IdealMatchResultDTO.waiting();
    }

    // 매칭 확정 + 채팅방 생성 (하나의 트랜잭션)
    private IdealMatchResultDTO confirm(int me, IdealCandidateDTO cand, TransactionStatus status) {

        int target = cand.getCandidateSeq();

        // 두 사람 모두 WAITING일 때만 성공 → 2건이 아니면 롤백
        if (dao.updateQueueMatched(me, target) != 2) {
            status.setRollbackOnly();
            return null;
        }

        IdealMatchingDTO dto = new IdealMatchingDTO();
        dto.setMemberSeq1(me);
        dto.setMemberSeq2(target);
        dto.setScore(cand.getMutualScore());
        dto.setScore1To2(cand.getScoreMeToCand());
        dto.setScore2To1(cand.getScoreCandToMe());

        dao.insertMatching(dto);    // dto.idealMatchingSeq 채워짐
        dao.insertChatRoom(dto);    // dto.chatRoomSeq 채워짐

        int room = dto.getChatRoomSeq();
        dao.insertParticipant(room, me, "OWNER");
        dao.insertParticipant(room, target, "MEMBER");
        dao.insertChatRoomList(room, me);
        dao.insertChatRoomList(room, target);

        forget(me);
        forget(target);

        // 나는 바로 채팅방으로 가므로 대기열에서 제거
        // 상대는 MATCHED로 남겨 두고, 상대가 상태를 확인할 때 결과를 받고 제거됨
        dao.deleteMyQueue(me);

        return new IdealMatchResultDTO("MATCHED", target,
                dto.getIdealMatchingSeq(), room, dto.getScore());
    }

    // =========================================================
    // 매칭 상태 확인 (대기 중인 사람이 주기적으로 호출)
    // WAITING: 계속 대기 / MATCHED: 채팅방으로 이동 / IDLE: 대기열에 없음
    // =========================================================
    public IdealMatchResultDTO status(String loginId) {
        int me = getMemberSeq(loginId);

        String queue = dao.selectQueueStatus(me);
        if (QUEUE_MATCHED.equals(queue)) {
            return receiveMatched(me);
        }
        if (QUEUE_WAITING.equals(queue)) {
            lastSeenAt.put(me, clock.getAsLong());   // 아직 화면을 보고 있음
            // 대기 시간이 늘어 기준점이 낮아졌을 수 있으니 다시 찾아본다
            // (새로 들어오는 사람이 없어도 기존 대기자끼리 매칭되도록)
            return tryMatch(me);
        }
        forget(me);
        return IdealMatchResultDTO.idle();
    }

    // =========================================================
    // 대기 취소
    // =========================================================
    public void cancel(String loginId) {
        int me = getMemberSeq(loginId);

        forget(me);
        if (dao.deleteWaitingQueue(me) == 0) {
            // 지워진 게 없음 → 이미 매칭됐거나 대기 중이 아님
            if (QUEUE_MATCHED.equals(dao.selectQueueStatus(me))) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 매칭이 완료됐어요.");
            }
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "대기 중인 매칭이 없어요.");
        }
    }

    // =========================================================
    // 채팅창 사이드: 상대 프로필
    // =========================================================
    public IdealPartnerProfileDTO partnerProfile(String loginId, int chatRoomSeq) {
        int me = getMemberSeq(loginId);

        IdealPartnerProfileDTO partner = dao.selectPartnerProfile(chatRoomSeq, me);
        if (partner == null) {
            // 매칭(이상형/블라인드 GO) 방이 아니거나 내가 참여한 방이 아님
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "매칭으로 연결된 채팅방이 아니에요.");
        }
        return partner;
    }

    // =========================================================
    // 내부 공통
    // =========================================================

    // 다른 사람이 나를 매칭한 결과를 받아가고 대기열에서 빠짐
    private IdealMatchResultDTO receiveMatched(int me) {
        forget(me);
        IdealMatchingDTO m = dao.selectLatestMatching(me);
        dao.deleteMyQueue(me);

        if (m == null) {
            // 매칭 이력이 없는 비정상 상태 → 대기열만 정리하고 다시 시작하게 함
            return IdealMatchResultDTO.idle();
        }

        int partner = (m.getMemberSeq1() == me) ? m.getMemberSeq2() : m.getMemberSeq1();
        return new IdealMatchResultDTO("MATCHED", partner,
                m.getIdealMatchingSeq(), m.getChatRoomSeq(), m.getScore());
    }

    // =========================================================
    // 나간 대기자 정리 (IdealMatchingScheduler가 10초마다 호출)
    // 창을 강제로 닫거나 네트워크가 끊기면 취소 요청이 오지 않아 대기열에 계속 남는다
    // → STALE_MILLIS 동안 상태 확인이 없는 WAITING 행을 지운다
    // =========================================================
    public void removeStaleWaiting() {
        long now = clock.getAsLong();
        for (int seq : dao.selectWaitingMembers()) {
            // 기록이 없으면(서버 재시작 등) 지금부터 잰다
            Long seen = lastSeenAt.putIfAbsent(seq, now);
            if (seen != null && now - seen > STALE_MILLIS) {
                dao.deleteWaitingQueue(seq);   // 그 사이 매칭됐으면 0건 (WAITING만 지움)
                forget(seq);
            }
        }
    }

    // 대기 관련 메모리 기록 정리
    private void forget(int memberSeq) {
        waitStartedAt.remove(memberSeq);
        lastSeenAt.remove(memberSeq);
    }

    // 대기한 시간(초). 기록이 없으면(서버 재시작 등) 지금부터 잰다
    private long waitedSec(int me) {
        long now = clock.getAsLong();
        long started = waitStartedAt.computeIfAbsent(me, k -> now);
        return Math.max(0, (now - started) / 1000);
    }

    // 로그인 아이디 → 회원 번호
    private int getMemberSeq(String loginId) {
        Integer seq = dao.selectMemberSeqByLoginId(loginId);
        if (seq == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "회원 정보를 찾을 수 없어요.");
        }
        return seq;
    }
}