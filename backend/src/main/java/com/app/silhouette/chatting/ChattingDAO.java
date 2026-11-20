package com.app.silhouette.chatting;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ChattingDAO {
    private final SqlSessionTemplate mybatis;

    public ChattingDAO(SqlSessionTemplate mybatis) {
        this.mybatis = mybatis;
    }

    public Integer getMemberSeq(String id) {
        return mybatis.selectOne("Chatting.getMemberSeq", id);
    }

    public int createChatRoom(ChattingRoomDTO room) {
        return mybatis.insert("Chatting.createChatRoom", room);
    }

    public int createParticipant(ChattingParticipantDTO participant) {
        return mybatis.insert("Chatting.createParticipant", participant);
    }

    public int createChatRoomList(ChattingRoomListDTO roomList) {
        return mybatis.insert("Chatting.createChatRoomList", roomList);
    }

    public List<ChattingRoomListDTO> selectRoomList(Long memberSeq) {
        return mybatis.selectList("Chatting.selectRoomList", memberSeq);
    }

    public ChattingRoomDTO selectRoomBySeq(Long roomSeq) {
        return mybatis.selectOne("Chatting.selectRoomBySeq", roomSeq);
    }

    public int insertMessage(ChattingMessageDTO message) {
        return mybatis.insert("Chatting.insertMessage", message);
    }

    public int insertMessageRead(ChattingMessageReadDTO messageRead) {
        return mybatis.insert("Chatting.insertMessageRead", messageRead);
    }

    public List<ChattingMessageDTO> selectMessageList(Long roomSeq) {
        return mybatis.selectList("Chatting.selectMessageList", roomSeq);
    }

    public List<ChattingMessageDTO> selectMessageListForMember(Long roomSeq, Long memberSeq) {
        Map<String, Object> param = new HashMap<>();
        param.put("roomSeq", roomSeq);
        param.put("memberSeq", memberSeq);
        return mybatis.selectList("Chatting.selectMessageListForMember", param);
    }

    public int isRoomMember(Long roomSeq, Long memberSeq) {
        Map<String, Object> param = new HashMap<>();
        param.put("roomSeq", roomSeq);
        param.put("memberSeq", memberSeq);
        return mybatis.selectOne("Chatting.isRoomMember", param);
    }

    public List<ChattingMemberDTO> searchMembers(String keyword, Long mySeq) {
        Map<String, Object> param = new HashMap<>();
        param.put("keyword", keyword);
        param.put("mySeq", mySeq);
        return mybatis.selectList("Chatting.searchMembers", param);
    }

    public int createInvitation(ChattingInvitationDTO invitation) {
        return mybatis.insert("Chatting.createInvitation", invitation);
    }

    public int countPendingInvitation(Long roomSeq, Long inviteeSeq) {
        Map<String, Object> param = new HashMap<>();
        param.put("roomSeq", roomSeq);
        param.put("inviteeSeq", inviteeSeq);
        return mybatis.selectOne("Chatting.countPendingInvitation", param);
    }

    public List<ChattingInvitationDTO> selectInvitations(Long memberSeq) {
        return mybatis.selectList("Chatting.selectInvitations", memberSeq);
    }

    public ChattingInvitationDTO selectInvitation(Long invitationSeq) {
        return mybatis.selectOne("Chatting.selectInvitation", invitationSeq);
    }

    public int updateInvitationStatus(Long invitationSeq, String status) {
        Map<String, Object> param = new HashMap<>();
        param.put("invitationSeq", invitationSeq);
        param.put("status", status);
        return mybatis.update("Chatting.updateInvitationStatus", param);
    }

    public int countParticipant(Long roomSeq, Long memberSeq) {
        Map<String, Object> param = new HashMap<>();
        param.put("roomSeq", roomSeq);
        param.put("memberSeq", memberSeq);
        return mybatis.selectOne("Chatting.countParticipant", param);
    }

    public int reactivateParticipant(Long roomSeq, Long memberSeq) {
        Map<String, Object> param = new HashMap<>();
        param.put("roomSeq", roomSeq);
        param.put("memberSeq", memberSeq);
        return mybatis.update("Chatting.reactivateParticipant", param);
    }

    public int reactivateRoomList(Long roomSeq, Long memberSeq) {
        Map<String, Object> param = new HashMap<>();
        param.put("roomSeq", roomSeq);
        param.put("memberSeq", memberSeq);
        return mybatis.update("Chatting.reactivateRoomList", param);
    }

    public int countRoomList(Long roomSeq, Long memberSeq) {
        Map<String, Object> param = new HashMap<>();
        param.put("roomSeq", roomSeq);
        param.put("memberSeq", memberSeq);
        return mybatis.selectOne("Chatting.countRoomList", param);
    }

    public int leaveParticipant(Long roomSeq, Long memberSeq) {
        Map<String, Object> param = new HashMap<>();
        param.put("roomSeq", roomSeq);
        param.put("memberSeq", memberSeq);
        return mybatis.update("Chatting.leaveParticipant", param);
    }

    public int leaveRoomList(Long roomSeq, Long memberSeq) {
        Map<String, Object> param = new HashMap<>();
        param.put("roomSeq", roomSeq);
        param.put("memberSeq", memberSeq);
        return mybatis.update("Chatting.leaveRoomList", param);
    }
    
    public int isRoomOwner(Long roomSeq, Long memberSeq) {
        Map<String, Object> param = new HashMap<>();
        param.put("roomSeq", roomSeq);
        param.put("memberSeq", memberSeq);
        return mybatis.selectOne("Chatting.isRoomOwner", param);
    }

    public int cancelRoomInvitations(Long roomSeq) {
        return mybatis.update("Chatting.cancelRoomInvitations", roomSeq);
    }

    public int closeRoomParticipants(Long roomSeq) {
        return mybatis.update("Chatting.closeRoomParticipants", roomSeq);
    }

    public int closeRoomLists(Long roomSeq) {
        return mybatis.update("Chatting.closeRoomLists", roomSeq);
    }

    public int deleteChatRoom(Long roomSeq) {
        return mybatis.update("Chatting.deleteChatRoom", roomSeq);
    }
    
    public int countJoinedParticipants(Long roomSeq) {
        return mybatis.selectOne("Chatting.countJoinedParticipants", roomSeq);
    }
}