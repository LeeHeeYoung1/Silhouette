package com.app.silhouette.chatting;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ChattingService {

    private final ChattingDAO chattingDAO;

    public ChattingService(ChattingDAO chattingDAO) {
        this.chattingDAO = chattingDAO;
    }

    // 채팅방 생성: 생성자 참여 후 선택한 회원들에게 초대 발송
    public ChattingRoomDTO createRoom(ChattingRoomDTO room, Long memberSeq, List<Long> inviteeSeqs) {
        room.setCreated_by(memberSeq);
        room.setRoom_status("Y");
        chattingDAO.createChatRoom(room);

        ChattingParticipantDTO participant = new ChattingParticipantDTO();
        participant.setChat_room_seq(room.getChat_room_seq());
        participant.setMember_seq(memberSeq);
        participant.setParticipant_role("OWNER");
        participant.setParticipant_status("JOINED");
        chattingDAO.createParticipant(participant);

        ChattingRoomListDTO roomList = new ChattingRoomListDTO();
        roomList.setChat_room_seq(room.getChat_room_seq());
        roomList.setMember_seq(memberSeq);
        roomList.setStatus("ACTIVE");
        roomList.setLast_read_message_seq(0L);
        roomList.setDeleted_message_seq(0L);
        chattingDAO.createChatRoomList(roomList);

        if (inviteeSeqs != null) {
            for (Long inviteeSeq : inviteeSeqs) {
                inviteMember(room.getChat_room_seq(), memberSeq, inviteeSeq);
            }
        }

        return room;
    }

    public List<ChattingRoomListDTO> getRoomList(Long memberSeq) {
        return chattingDAO.selectRoomList(memberSeq);
    }

    public List<ChattingMessageDTO> getMessageList(Long roomSeq, Long memberSeq) {
        if (chattingDAO.isRoomMember(roomSeq, memberSeq) == 0) {
            throw new IllegalArgumentException("이 채팅방에 참여하고 있지 않습니다.");
        }
        return chattingDAO.selectMessageListForMember(roomSeq, memberSeq);
    }

    public List<ChattingMemberDTO> searchMembers(String keyword, Long mySeq) {
        return chattingDAO.searchMembers(keyword, mySeq);
    }

    public void inviteMember(Long roomSeq, Long inviterSeq, Long inviteeSeq) {
        if (inviterSeq.equals(inviteeSeq)) {
            throw new IllegalArgumentException("자기 자신은 초대할 수 없습니다.");
        }
        if (chattingDAO.isRoomMember(roomSeq, inviterSeq) == 0) {
            throw new IllegalArgumentException("채팅방 참여자만 초대할 수 있습니다.");
        }
        if (chattingDAO.isRoomMember(roomSeq, inviteeSeq) > 0) {
            throw new IllegalArgumentException("이미 채팅방에 참여 중인 회원입니다.");
        }
        if (chattingDAO.countPendingInvitation(roomSeq, inviteeSeq) > 0) {
            throw new IllegalArgumentException("이미 초대 대기 중인 회원입니다.");
        }

        ChattingInvitationDTO invitation = new ChattingInvitationDTO();
        invitation.setChat_room_seq(roomSeq);
        invitation.setInviter_seq(inviterSeq);
        invitation.setInvitee_seq(inviteeSeq);
        invitation.setInvitation_status("PENDING");
        chattingDAO.createInvitation(invitation);
    }

    public List<ChattingInvitationDTO> getInvitations(Long memberSeq) {
        return chattingDAO.selectInvitations(memberSeq);
    }

    public void respondInvitation(Long invitationSeq, Long memberSeq, boolean accept) {
    	ChattingInvitationDTO invitation = chattingDAO.selectInvitation(invitationSeq);

        if (invitation == null || !memberSeq.equals(invitation.getInvitee_seq())) {
            throw new IllegalArgumentException("초대 정보를 찾을 수 없습니다.");
        }
        if (!"PENDING".equals(invitation.getInvitation_status())) {
            throw new IllegalArgumentException("이미 처리된 초대입니다.");
        }

        String status = accept ? "ACCEPTED" : "REJECTED";
        chattingDAO.updateInvitationStatus(invitationSeq, status);

        if (accept) {
            Long roomSeq = invitation.getChat_room_seq();

            if (chattingDAO.countParticipant(roomSeq, memberSeq) > 0) {
                chattingDAO.reactivateParticipant(roomSeq, memberSeq);
            } else {
                ChattingParticipantDTO participant = new ChattingParticipantDTO();
                participant.setChat_room_seq(roomSeq);
                participant.setMember_seq(memberSeq);
                participant.setParticipant_role("MEMBER");
                participant.setParticipant_status("JOINED");
                chattingDAO.createParticipant(participant);
            }

            if (chattingDAO.countRoomList(roomSeq, memberSeq) > 0) {
                chattingDAO.reactivateRoomList(roomSeq, memberSeq);
            } else {
                ChattingRoomListDTO roomList = new ChattingRoomListDTO();
                roomList.setChat_room_seq(roomSeq);
                roomList.setMember_seq(memberSeq);
                roomList.setStatus("ACTIVE");
                roomList.setLast_read_message_seq(0L);
                roomList.setDeleted_message_seq(0L);
                chattingDAO.createChatRoomList(roomList);
            }
        }
    }

    public void leaveRoom(Long roomSeq, Long memberSeq) {
        if (chattingDAO.isRoomMember(roomSeq, memberSeq) == 0) {
            throw new IllegalArgumentException("참여 중인 채팅방이 아닙니다.");
        }

        // 현재 회원만 채팅방에서 나가기
        chattingDAO.leaveParticipant(roomSeq, memberSeq);
        chattingDAO.leaveRoomList(roomSeq, memberSeq);

        // 남아 있는 참여자가 없는지 확인
        if (chattingDAO.countJoinedParticipants(roomSeq) == 0) {
            chattingDAO.cancelRoomInvitations(roomSeq);
            chattingDAO.deleteChatRoom(roomSeq);
        }
    }

    public boolean isRoomMember(Long roomSeq, Long memberSeq) {
        return chattingDAO.isRoomMember(roomSeq, memberSeq) > 0;
    }
    
    public boolean isRoomOwner(Long roomSeq, Long memberSeq) {
        return chattingDAO.isRoomOwner(roomSeq, memberSeq) > 0;
    }

    public void deleteRoom(Long roomSeq, Long memberSeq) {

        if (!isRoomOwner(roomSeq, memberSeq)) {
            throw new IllegalArgumentException("채팅방 방장만 삭제할 수 있습니다.");
        }

        chattingDAO.cancelRoomInvitations(roomSeq);
        chattingDAO.closeRoomParticipants(roomSeq);
        chattingDAO.closeRoomLists(roomSeq);
        chattingDAO.deleteChatRoom(roomSeq);
    }
}