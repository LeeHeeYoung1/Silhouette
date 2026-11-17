package com.app.silhouette.matching;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

@Service
public class IdealMatchingService {

    // 동시에 같은 상대를 노린 경우 다시 시도하는 최대 횟수
    private static final int MAX_RETRY = 3;

    private final IdealMatchingDAO dao;
    private final TransactionTemplate tx;

    IdealMatchingService(IdealMatchingDAO dao, TransactionTemplate tx) {
        this.dao = dao;
        this.tx = tx;
    }

    // =========================================================
    // 매칭 신청
    // =========================================================
    public IdealMatchResultDTO start(String loginId) {
        int me = getMemberSeq(loginId);

        // 이미 매칭된 상태면 그 결과를 그대로 돌려줌
        IdealMatchingDTO active = dao.selectActiveMatching(me);
        if (active != null) {
            return toResult(active, me);
        }

        // 프로필과 이상형이 모두 있어야 점수 계산 가능
        if (dao.countProfileAndIdeal(me) < 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "프로필과 이상형을 먼저 입력해주세요.");
        }

        // 대기열 등록 (블라인드든 이상형이든 이미 있으면 PK 중복)
        try {
            dao.insertQueue(me);
        } catch (DuplicateKeyException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 매칭이 진행 중이에요.");
        }

        return tryMatch(me);
    }

    // 후보를 찾아 매칭 확정까지 시도 (동시성 충돌이면 재시도)
    private IdealMatchResultDTO tryMatch(int me) {
        for (int i = 0; i < MAX_RETRY; i++) {

            // 그 사이 다른 사람이 나를 먼저 매칭했을 수 있음
            IdealMatchingDTO active = dao.selectActiveMatching(me);
            if (active != null) {
                return toResult(active, me);
            }

            IdealCandidateDTO cand = dao.selectCandidate(me);
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
    private IdealMatchResultDTO confirm(int me, IdealCandidateDTO cand,
            org.springframework.transaction.TransactionStatus status) {

        int target = cand.getCandidate_Seq();

        // 두 사람 모두 WAITING일 때만 성공 → 2건이 아니면 롤백
        if (dao.updateQueueMatched(me, target) != 2) {
            status.setRollbackOnly();
            return null;
        }

        IdealMatchingDTO dto = new IdealMatchingDTO();
        dto.setMember_Seq_1(me);
        dto.setMember_Seq_2(target);
        dto.setScore(cand.getMutual_Score());
        dto.setScore_1_To_2(cand.getScore_Me_To_Cand());
        dto.setScore_2_To_1(cand.getScore_Cand_To_Me());

        dao.insertMatching(dto);    // dto.ideal_Matching_Seq 채워짐
        dao.insertChatRoom(dto);    // dto.chat_Room_Seq 채워짐
        dao.insertParticipant(dto.getChat_Room_Seq(), me, "OWNER");
        dao.insertParticipant(dto.getChat_Room_Seq(), target, "MEMBER");

        return new IdealMatchResultDTO("MATCHED", target,
                dto.getIdeal_Matching_Seq(), dto.getChat_Room_Seq(), dto.getScore());
    }

    // =========================================================
    // 매칭 상태 확인 (대기 중인 사람이 주기적으로 호출)
    // =========================================================
    public IdealMatchResultDTO status(String loginId) {
        int me = getMemberSeq(loginId);

        IdealMatchingDTO active = dao.selectActiveMatching(me);
        if (active != null) {
            return toResult(active, me);
        }
        return IdealMatchResultDTO.waiting();
    }

    // =========================================================
    // 대기 취소
    // =========================================================
    public void cancel(String loginId) {
        int me = getMemberSeq(loginId);

        if (dao.deleteWaitingQueue(me) == 0) {
            // 지워진 게 없음 → 이미 매칭됐거나 대기 중이 아님
            if (dao.selectActiveMatching(me) != null) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 매칭이 완료됐어요.");
            }
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "대기 중인 매칭이 없어요.");
        }
    }

    // =========================================================
    // 매칭 종료 (채팅방 나가기)
    // =========================================================
    @Transactional
    public void end(String loginId, int chatRoomSeq) {
        int me = getMemberSeq(loginId);

        IdealMatchingDTO matching = dao.selectMatchingByRoom(chatRoomSeq);
        if (matching == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "채팅방을 찾을 수 없어요.");
        }

        // 이 채팅방의 참여자만 종료 가능
        int m1 = matching.getMember_Seq_1();
        int m2 = matching.getMember_Seq_2();
        if (me != m1 && me != m2) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "참여 중인 채팅방이 아니에요.");
        }

        // 이미 종료된 방이면 (상대가 먼저 나간 경우) 아무것도 안 함
        if (dao.updateChatRoomClosed(chatRoomSeq) == 0) {
            return;
        }
        dao.updateParticipantsLeft(chatRoomSeq);
        dao.updateMatchingEnded(matching.getIdeal_Matching_Seq());
        dao.deleteMatchedQueue(m1, m2);
    }

    // =========================================================
    // 내부 공통
    // =========================================================

    // 로그인 아이디 → 회원 번호
    private int getMemberSeq(String loginId) {
        Integer seq = dao.selectMemberSeqByLoginId(loginId);
        if (seq == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "회원 정보를 찾을 수 없어요.");
        }
        return seq;
    }

    // 매칭 이력 → 응답 (상대 번호는 내가 1번인지 2번인지에 따라 결정)
    private IdealMatchResultDTO toResult(IdealMatchingDTO m, int me) {
        int partner = (m.getMember_Seq_1() == me) ? m.getMember_Seq_2() : m.getMember_Seq_1();
        return new IdealMatchResultDTO("MATCHED", partner,
                m.getIdeal_Matching_Seq(), m.getChat_Room_Seq(), m.getScore());
    }
}