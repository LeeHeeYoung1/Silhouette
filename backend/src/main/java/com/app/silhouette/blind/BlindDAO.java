package com.app.silhouette.blind;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class BlindDAO {

    private static final String NS = "Blind.";

    private final SqlSessionTemplate mybatis;

    BlindDAO(SqlSessionTemplate mybatis) {
        this.mybatis = mybatis;
    }

    // ===== 회원 =====

    public BlindQueueMemberDTO selectQueueMember(String loginId) {
        return mybatis.selectOne(NS + "selectQueueMember", loginId);
    }

    public Long selectMemberSeqByLoginId(String loginId) {
        return mybatis.selectOne(NS + "selectMemberSeqByLoginId", loginId);
    }

    public boolean isBlocked(long memberSeq, long targetSeq) {
        Map<String, Object> param = new HashMap<>();
        param.put("memberSeq", memberSeq);
        param.put("targetSeq", targetSeq);
        int count = mybatis.selectOne(NS + "countBlock", param);
        return count > 0;
    }

    // ===== 매칭 + 방 생성 =====

    // 실행 후 room.blindMatchingSeq 채워짐
    public int insertMatching(BlindRoomDTO room) {
        return mybatis.insert(NS + "insertMatching", room);
    }

    // 실행 후 room.blindChatRoomSeq 채워짐
    public int insertRoom(BlindRoomDTO room) {
        return mybatis.insert(NS + "insertRoom", room);
    }

    // 진행 중인 내 블라인드 방 (없으면 null)
    public Long selectActiveRoomSeq(long memberSeq) {
        return mybatis.selectOne(NS + "selectActiveRoomSeq", memberSeq);
    }

    // ===== 방 조회 =====

    public BlindRoomDTO selectRoom(long roomSeq) {
        return mybatis.selectOne(NS + "selectRoom", roomSeq);
    }

    // 트랜잭션 안에서 호출 (방·매칭 행 잠금)
    public BlindRoomDTO selectRoomForUpdate(long roomSeq) {
        return mybatis.selectOne(NS + "selectRoomForUpdate", roomSeq);
    }

    public boolean isRoomMember(long roomSeq, String loginId) {
        Map<String, Object> param = new HashMap<>();
        param.put("roomSeq", roomSeq);
        param.put("loginId", loginId);
        int count = mybatis.selectOne(NS + "countRoomMember", param);
        return count > 0;
    }

    public List<Long> selectVoteExpiredRoomSeqs(int voteSeconds) {
        return mybatis.selectList(NS + "selectVoteExpiredRoomSeqs", voteSeconds);
    }

    // ===== 메시지 =====

    // 실행 후 message.blindChatMessageSeq 채워짐
    public int insertMessage(BlindChatMessageDTO message) {
        return mybatis.insert(NS + "insertMessage", message);
    }

    public List<BlindChatMessageDTO> selectMessages(long roomSeq) {
        return mybatis.selectList(NS + "selectMessages", roomSeq);
    }

    // ===== GO / STOP =====

    // 이미 선택했으면 0 (overrideGo: 나가기일 때 GO를 LEFT로 덮어쓸 수 있음)
    public int updateVote(long blindMatchingSeq, int slot, String vote, boolean overrideGo) {
        Map<String, Object> param = new HashMap<>();
        param.put("blindMatchingSeq", blindMatchingSeq);
        param.put("slot", slot);
        param.put("vote", vote);
        param.put("overrideGo", overrideGo);
        return mybatis.update(NS + "updateVote", param);
    }

    // ON AIR → CONTINUED / ENDED (이미 끝났으면 0)
    public int updateRoomFinished(long roomSeq, String status, Long linkedChatRoomSeq) {
        Map<String, Object> param = new HashMap<>();
        param.put("roomSeq", roomSeq);
        param.put("status", status);
        param.put("linkedChatRoomSeq", linkedChatRoomSeq);
        return mybatis.update(NS + "updateRoomFinished", param);
    }

    public int updateMatchingStatus(long blindMatchingSeq, String status) {
        Map<String, Object> param = new HashMap<>();
        param.put("blindMatchingSeq", blindMatchingSeq);
        param.put("status", status);
        return mybatis.update(NS + "updateMatchingStatus", param);
    }

    // ===== 둘 다 GO → 일반 채팅방 =====

    // 실행 후 room.linkedChatRoomSeq 채워짐
    public int insertChatRoom(BlindRoomDTO room) {
        return mybatis.insert(NS + "insertChatRoom", room);
    }

    public int insertChatParticipant(long chatRoomSeq, long memberSeq, String role) {
        Map<String, Object> param = new HashMap<>();
        param.put("chatRoomSeq", chatRoomSeq);
        param.put("memberSeq", memberSeq);
        param.put("role", role);
        return mybatis.insert(NS + "insertChatParticipant", param);
    }

    public int insertChatRoomList(long chatRoomSeq, long memberSeq) {
        Map<String, Object> param = new HashMap<>();
        param.put("chatRoomSeq", chatRoomSeq);
        param.put("memberSeq", memberSeq);
        return mybatis.insert(NS + "insertChatRoomList", param);
    }
}
