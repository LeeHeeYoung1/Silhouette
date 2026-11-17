package com.app.silhouette.matching;

import java.util.HashMap;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class IdealMatchingDAO {

    private static final String NS = "IdealMatching.";

    private final SqlSessionTemplate mybatis;

    IdealMatchingDAO(SqlSessionTemplate mybatis) {
        this.mybatis = mybatis;
    }

    // ===== 공통 =====

    // 로그인 아이디 → 회원 번호 (없으면 null)
    public Integer selectMemberSeqByLoginId(String loginId) {
        return mybatis.selectOne(NS + "selectMemberSeqByLoginId", loginId);
    }

    // ===== 매칭 요청 =====

    // 프로필 + 이상형 입력 개수 (2면 신청 가능)
    public int countProfileAndIdeal(int memberSeq) {
        return mybatis.selectOne(NS + "countProfileAndIdeal", memberSeq);
    }

    // 대기열 등록 (이미 있으면 DuplicateKeyException)
    public int insertQueue(int memberSeq) {
        return mybatis.insert(NS + "insertQueue", memberSeq);
    }

    // 대기 취소 (이미 매칭됐으면 0)
    public int deleteWaitingQueue(int memberSeq) {
        return mybatis.delete(NS + "deleteWaitingQueue", memberSeq);
    }

    // ===== 후보 선정 =====

    // 조건 + 점수 통과한 후보 중 랜덤 1명 (없으면 null)
    public IdealCandidateDTO selectCandidate(int memberSeq) {
        return mybatis.selectOne(NS + "selectCandidate", memberSeq);
    }

    // ===== 매칭 확정 =====

    // 두 사람 모두 WAITING → MATCHED (2가 아니면 실패)
    public int updateQueueMatched(int memberSeq, int targetSeq) {
        return mybatis.update(NS + "updateQueueMatched", pair(memberSeq, targetSeq));
    }

    // 매칭 이력 저장 (실행 후 dto에 ideal_Matching_Seq가 채워짐)
    public int insertMatching(IdealMatchingDTO dto) {
        return mybatis.insert(NS + "insertMatching", dto);
    }

    // 채팅방 생성 (실행 후 dto에 chat_Room_Seq가 채워짐)
    public int insertChatRoom(IdealMatchingDTO dto) {
        return mybatis.insert(NS + "insertChatRoom", dto);
    }

    // 채팅방 참여자 등록 (role: OWNER / MEMBER)
    public int insertParticipant(int chatRoomSeq, int memberSeq, String role) {
        Map<String, Object> param = new HashMap<>();
        param.put("chatRoomSeq", chatRoomSeq);
        param.put("memberSeq", memberSeq);
        param.put("role", role);
        return mybatis.insert(NS + "insertParticipant", param);
    }

    // 진행 중인 매칭 조회 (없으면 null)
    public IdealMatchingDTO selectActiveMatching(int memberSeq) {
        return mybatis.selectOne(NS + "selectActiveMatching", memberSeq);
    }

    // ===== 매칭 종료 =====

    // 채팅방 번호로 매칭 정보 조회 (없으면 null)
    public IdealMatchingDTO selectMatchingByRoom(int chatRoomSeq) {
        return mybatis.selectOne(NS + "selectMatchingByRoom", chatRoomSeq);
    }

    public int updateChatRoomClosed(int chatRoomSeq) {
        return mybatis.update(NS + "updateChatRoomClosed", chatRoomSeq);
    }

    public int updateParticipantsLeft(int chatRoomSeq) {
        return mybatis.update(NS + "updateParticipantsLeft", chatRoomSeq);
    }

    public int updateMatchingEnded(int idealMatchingSeq) {
        return mybatis.update(NS + "updateMatchingEnded", idealMatchingSeq);
    }

    public int deleteMatchedQueue(int memberSeq, int targetSeq) {
        return mybatis.delete(NS + "deleteMatchedQueue", pair(memberSeq, targetSeq));
    }

    // 두 회원 번호를 파라미터로 넘길 때 사용
    private Map<String, Object> pair(int memberSeq, int targetSeq) {
        Map<String, Object> param = new HashMap<>();
        param.put("memberSeq", memberSeq);
        param.put("targetSeq", targetSeq);
        return param;
    }
}