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

    // 프로필(온보딩) 등록 여부 (1이면 신청 가능)
    public int countProfile(int memberSeq) {
        return mybatis.selectOne(NS + "countProfile", memberSeq);
    }

    // ===== 대기열 =====

    // 내 대기열 상태 (WAITING / MATCHED / null)
    public String selectQueueStatus(int memberSeq) {
        return mybatis.selectOne(NS + "selectQueueStatus", memberSeq);
    }

    // 대기열 등록 (이미 있으면 DuplicateKeyException)
    public int insertQueue(int memberSeq) {
        return mybatis.insert(NS + "insertQueue", memberSeq);
    }

    // 대기 취소 (이미 매칭됐으면 0)
    public int deleteWaitingQueue(int memberSeq) {
        return mybatis.delete(NS + "deleteWaitingQueue", memberSeq);
    }

    // 매칭 결과를 받은 뒤 내 대기열 행 제거
    public int deleteMyQueue(int memberSeq) {
        return mybatis.delete(NS + "deleteMyQueue", memberSeq);
    }

    // 두 사람 모두 WAITING → MATCHED (2가 아니면 실패)
    public int updateQueueMatched(int memberSeq, int targetSeq) {
        Map<String, Object> param = new HashMap<>();
        param.put("memberSeq", memberSeq);
        param.put("targetSeq", targetSeq);
        return mybatis.update(NS + "updateQueueMatched", param);
    }

    // ===== 후보 선정 =====

    // 조건 + 점수 통과한 후보 중 랜덤 1명 (없으면 null)
    public IdealCandidateDTO selectCandidate(int memberSeq) {
        return mybatis.selectOne(NS + "selectCandidate", memberSeq);
    }

    // ===== 매칭 확정 + 채팅방 생성 =====

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
        Map<String, Object> param = room(chatRoomSeq, memberSeq);
        param.put("role", role);
        return mybatis.insert(NS + "insertParticipant", param);
    }

    // 내 채팅 목록에 방 추가
    public int insertChatRoomList(int chatRoomSeq, int memberSeq) {
        return mybatis.insert(NS + "insertChatRoomList", room(chatRoomSeq, memberSeq));
    }

    // 나의 가장 최근 매칭 (없으면 null)
    public IdealMatchingDTO selectLatestMatching(int memberSeq) {
        return mybatis.selectOne(NS + "selectLatestMatching", memberSeq);
    }

    // ===== 채팅창 사이드 프로필 =====

    // 이상형 매칭 방의 상대 프로필 (방이 없거나 내가 참여자가 아니면 null)
    public IdealPartnerProfileDTO selectPartnerProfile(int chatRoomSeq, int memberSeq) {
        return mybatis.selectOne(NS + "selectPartnerProfile", room(chatRoomSeq, memberSeq));
    }

    // 채팅방 번호 + 회원 번호를 파라미터로 넘길 때 사용
    private Map<String, Object> room(int chatRoomSeq, int memberSeq) {
        Map<String, Object> param = new HashMap<>();
        param.put("chatRoomSeq", chatRoomSeq);
        param.put("memberSeq", memberSeq);
        return param;
    }
}
