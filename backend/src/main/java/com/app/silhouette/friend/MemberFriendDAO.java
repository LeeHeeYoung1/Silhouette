package com.app.silhouette.friend;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;

// 친구 관련 SQL을 MyBatis Mapper에 전달하는 DAO입니다.
@Repository
public class MemberFriendDAO {

    private final SqlSessionTemplate mybatis;

    public MemberFriendDAO(SqlSessionTemplate mybatis) {
        this.mybatis = mybatis;
    }

    // 수락된 친구 관계를 조회합니다.
    public List<MemberFriendDTO> selectFriendList(Long memberSeq) {
        return mybatis.selectList("MemberFriend.selectFriendList", memberSeq);
    }

    // 수락된 친구 중 닉네임 검색 결과를 조회합니다.
    public List<MemberFriendDTO> searchAcceptedFriends(String keyword, Long memberSeq) {
        Map<String, Object> param = new HashMap<>();
        param.put("keyword", keyword);
        param.put("memberSeq", memberSeq);
        return mybatis.selectList("MemberFriend.searchAcceptedFriends", param);
    }

    public int isAcceptedFriend(Long memberSeq, Long friendSeq) {
        Map<String, Object> param = new HashMap<>();
        param.put("memberSeq", memberSeq);
        param.put("friendSeq", friendSeq);
        return mybatis.selectOne("MemberFriend.isAcceptedFriend", param);
    }

    // 두 회원 사이에 이미 친구 관계/요청 데이터가 있는지 확인합니다.
    public int countRelationship(Long memberSeq, Long friendSeq) {
        Map<String, Object> param = new HashMap<>();
        param.put("memberSeq", memberSeq);
        param.put("friendSeq", friendSeq);
        return mybatis.selectOne("MemberFriend.countRelationship", param);
    }

    // 새로운 친구 요청 행을 MEMBER_FRIEND에 추가합니다.
    public int insertFriendRequest(MemberFriendDTO request) {
        return mybatis.insert("MemberFriend.insertFriendRequest", request);
    }

    public int reactivateRejectedRequest(Long requesterSeq, Long requestedSeq) {
        Map<String, Object> param = new HashMap<>();
        param.put("requesterSeq", requesterSeq);
        param.put("requestedSeq", requestedSeq);
        return mybatis.update("MemberFriend.reactivateRejectedRequest", param);
    }

    public Long selectRequestSeqByPair(Long requesterSeq, Long requestedSeq) {
        Map<String, Object> param = new HashMap<>();
        param.put("requesterSeq", requesterSeq);
        param.put("requestedSeq", requestedSeq);
        return mybatis.selectOne("MemberFriend.selectRequestSeqByPair", param);
    }

    // 나를 대상으로 들어온 PENDING 요청을 조회합니다.
    public List<MemberFriendDTO> selectIncomingRequests(Long memberSeq) {
        return mybatis.selectList("MemberFriend.selectIncomingRequests", memberSeq);
    }

    public MemberFriendDTO selectFriendRequest(Long requestSeq) {
        return mybatis.selectOne("MemberFriend.selectFriendRequest", requestSeq);
    }

    // 요청 상태를 ACCEPTED 또는 REJECTED로 변경합니다.
    public int updateFriendRequestStatus(Long requestSeq, String status) {
        Map<String, Object> param = new HashMap<>();
        param.put("requestSeq", requestSeq);
        param.put("status", status);
        return mybatis.update("MemberFriend.updateFriendRequestStatus", param);
    }
}