package com.app.silhouette.chatting;

import java.io.IOException;
import java.util.List;
import java.util.Date;
import java.util.Map;
import java.util.HashMap;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import com.google.cloud.storage.Blob;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import com.app.silhouette.friend.MemberFriendService;
import com.app.silhouette.notification.NotificationService;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// 채팅방 생성/참여/초대와 메시지 첨부파일 처리를 담당하는 Service입니다.
@Service
@Transactional
public class ChattingService {

    private final ChattingDAO chattingDAO;
    private final Storage storage;
    private final MemberFriendService memberFriendService;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    @Value("${gcp.bucket}")
    private String bucketName;

    public ChattingService(ChattingDAO chattingDAO, Storage storage,
            MemberFriendService memberFriendService, NotificationService notificationService,
            SimpMessagingTemplate messagingTemplate) {
        this.chattingDAO = chattingDAO;
        this.storage = storage;
        this.memberFriendService = memberFriendService;
        this.notificationService = notificationService;
        this.messagingTemplate = messagingTemplate;
    }

    // 채팅방 생성: 생성자 참여 후 선택한 회원들에게 초대 발송
    // 채팅방을 생성하고 생성자를 참여자로 등록한 뒤 선택한 친구에게 초대합니다.
    public ChattingRoomDTO createRoom(ChattingRoomDTO room, Long memberSeq, List<Long> inviteeSeqs) {
        // 채팅방을 만들기 전에 초대 대상이 모두 내 수락된 친구인지 먼저 확인
        if (inviteeSeqs != null) {
            for (Long inviteeSeq : inviteeSeqs) {
                if (inviteeSeq == null || inviteeSeq.equals(memberSeq)) {
                    throw new IllegalArgumentException("초대할 회원을 다시 확인해 주세요.");
                }

                if (!memberFriendService.isAcceptedFriend(memberSeq, inviteeSeq)) {
                    throw new IllegalArgumentException("친구로 등록된 회원만 채팅방에 초대할 수 있습니다.");
                }
            }
        }

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
        publishSystemMessage(room.getChat_room_seq(), memberSeq, "JOIN");

        if (inviteeSeqs != null) {
            for (Long inviteeSeq : inviteeSeqs) {
                inviteMember(room.getChat_room_seq(), memberSeq, inviteeSeq);
            }
        }

        return room;
    }


    // 현재 회원이 참여 중인 채팅방의 참여자 목록만 조회할 수 있습니다.
    public List<ChattingMemberDTO> getRoomMembers(Long roomSeq, Long memberSeq) {
        if (!isRoomMember(roomSeq, memberSeq)) {
            throw new IllegalArgumentException("이 채팅방에 참여하고 있지 않습니다.");
        }
        return chattingDAO.selectRoomMembers(roomSeq);
    }

    // 현재 회원에게 표시할 채팅방 목록을 조회합니다.
    public List<ChattingRoomListDTO> getRoomList(Long memberSeq) {
        return chattingDAO.selectRoomList(memberSeq);
    }

    public List<ChattingMessageDTO> getMessageList(Long roomSeq, Long memberSeq) {
        if (chattingDAO.isRoomMember(roomSeq, memberSeq) == 0) {
            throw new IllegalArgumentException("이 채팅방에 참여하고 있지 않습니다.");
        }
        return chattingDAO.selectMessageListForMember(roomSeq, memberSeq);
    }

    public List<ChatAttachmentDTO> getAttachmentList(Long roomSeq, Long memberSeq) {
        if (chattingDAO.isRoomMember(roomSeq, memberSeq) == 0) {
            throw new IllegalArgumentException("이 채팅방에 참여하고 있지 않습니다.");
        }

        List<ChatAttachmentDTO> attachments = chattingDAO.selectAttachmentList(roomSeq);
        for (ChatAttachmentDTO attachment : attachments) {
            if (("AUDIO".equals(attachment.getFile_type())
                    || "FILE".equals(attachment.getFile_type())
                    || "IMAGE".equals(attachment.getFile_type()))
                    && attachment.getStored_name() != null) {
                attachment.setFile_url(createSignedUrl(attachment.getStored_name()));
            }
        }
        return attachments;
    }

    // 음성 메시지 파일을 GCS에 저장하고 메시지 및 첨부파일 정보를 DB에 저장
    // 음성 파일을 GCS에 업로드하고 메시지/첨부파일 DB 정보를 저장합니다.
    public Map<String, Object> uploadVoiceMessage(Long roomSeq, Long memberSeq,
            MultipartFile file, Long duration) throws IOException {

        if (!isRoomMember(roomSeq, memberSeq)) {
            throw new IllegalArgumentException("이 채팅방에 참여하고 있지 않습니다.");
        }

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("음성 파일이 없습니다.");
        }

        if (file.getSize() > 20 * 1024 * 1024) {
            throw new IllegalArgumentException("음성 파일은 20MB 이하만 업로드할 수 있습니다.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.toLowerCase().startsWith("audio/")) {
            throw new IllegalArgumentException("음성 파일만 업로드할 수 있습니다.");
        }

        String originalName = file.getOriginalFilename();
        String extension = ".webm";
        if (originalName != null && originalName.lastIndexOf('.') >= 0) {
            String fileExtension = originalName.substring(originalName.lastIndexOf('.'));
            if (fileExtension.matches("\\.[a-zA-Z0-9]{1,10}")) {
                extension = fileExtension;
            }
        }

        String storedName = UUID.randomUUID().toString() + extension;
        BlobId blobId = BlobId.of(bucketName, storedName);

        try {
            BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                    .setContentType(contentType)
                    .build();
            storage.create(blobInfo, file.getBytes());

            ChattingMessageDTO message = new ChattingMessageDTO();
            message.setChat_room_seq(roomSeq);
            message.setSender_seq(memberSeq);
            message.setMessage_type("AUDIO");
            message.setSystem_event_type(null);
            message.setMessage_content("음성 메시지");
            message.setCreated_at(new java.util.Date());
            message.setDeleted_yn("N");
            chattingDAO.insertMessage(message);

            ChatAttachmentDTO attachment = new ChatAttachmentDTO();
            attachment.setChat_message_seq(message.getChat_message_seq());
            attachment.setOriginal_name(originalName == null ? "voice-message.webm" : originalName);
            attachment.setStored_name(storedName);
            // DB에는 GCS 객체 위치를 저장하고, 응답 시점에 만료 시간이 있는 서명 URL을 발급
            attachment.setFile_url("gs://" + bucketName + "/" + storedName);
            attachment.setFile_type("AUDIO");
            attachment.setFile_size(file.getSize());
            attachment.setDuration(duration == null ? 0L : duration);
            chattingDAO.insertAttachment(attachment);

            attachment.setFile_url(createSignedUrl(storedName));
            Map<String, Object> result = new HashMap<>();
            result.put("message", message);
            result.put("attachment", attachment);
            return result;
        } catch (Exception e) {
            storage.delete(blobId);
            if (e instanceof IOException) {
                throw (IOException) e;
            }
            if (e instanceof RuntimeException) {
                throw (RuntimeException) e;
            }
            throw new IllegalStateException("음성 메시지 저장 중 오류가 발생했습니다.", e);
        }
    }

    // 일반 파일 업로드
    public Map<String, Object> uploadChatFile(Long roomSeq, Long memberSeq,
            MultipartFile file) throws IOException {
        return uploadChatAttachment(roomSeq, memberSeq, file, "FILE", false);
    }

    // 사진 업로드
    public Map<String, Object> uploadChatImage(Long roomSeq, Long memberSeq,
            MultipartFile file) throws IOException {
        return uploadChatAttachment(roomSeq, memberSeq, file, "IMAGE", true);
    }

    // 일반 파일과 사진의 공통 업로드 처리
    // 사진과 일반 파일의 공통 업로드 로직입니다. 파일 종류에 따라 검증합니다.
    private Map<String, Object> uploadChatAttachment(Long roomSeq, Long memberSeq,
            MultipartFile file, String type, boolean imageOnly) throws IOException {

        if (!isRoomMember(roomSeq, memberSeq)) {
            throw new IllegalArgumentException("이 채팅방에 참여하고 있지 않습니다.");
        }

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("업로드할 파일이 없습니다.");
        }

        if (file.getSize() > 20 * 1024 * 1024) {
            throw new IllegalArgumentException("파일은 20MB 이하만 업로드할 수 있습니다.");
        }

        String contentType = file.getContentType();
        if (contentType == null || contentType.trim().isEmpty()) {
            contentType = "application/octet-stream";
        }

        if (imageOnly && !contentType.toLowerCase().startsWith("image/")) {
            throw new IllegalArgumentException("이미지 파일만 업로드할 수 있습니다.");
        }

        String originalName = file.getOriginalFilename();
        if (originalName == null || originalName.trim().isEmpty()) {
            originalName = imageOnly ? "사진" : "첨부파일";
        }

        String extension = "";
        int dotIndex = originalName.lastIndexOf('.');
        if (dotIndex >= 0) {
            String fileExtension = originalName.substring(dotIndex);
            if (fileExtension.matches("\\.[a-zA-Z0-9]{1,10}")) {
                extension = fileExtension;
            }
        }

        String storedName = UUID.randomUUID().toString() + extension;
        BlobId blobId = BlobId.of(bucketName, storedName);

        try {
            BlobInfo blobInfo = BlobInfo.newBuilder(blobId)
                    .setContentType(contentType)
                    .build();
            storage.create(blobInfo, file.getBytes());

            ChattingMessageDTO message = new ChattingMessageDTO();
            message.setChat_room_seq(roomSeq);
            message.setSender_seq(memberSeq);
            message.setMessage_type(type);
            message.setSystem_event_type(null);
            message.setMessage_content(imageOnly ? "사진" : originalName);
            message.setCreated_at(new java.util.Date());
            message.setDeleted_yn("N");
            chattingDAO.insertMessage(message);

            ChatAttachmentDTO attachment = new ChatAttachmentDTO();
            attachment.setChat_message_seq(message.getChat_message_seq());
            attachment.setOriginal_name(originalName);
            attachment.setStored_name(storedName);
            attachment.setFile_url("gs://" + bucketName + "/" + storedName);
            attachment.setFile_type(type);
            attachment.setFile_size(file.getSize());
            attachment.setDuration(0L);
            chattingDAO.insertAttachment(attachment);

            // 응답과 실시간 전송에는 브라우저에서 접근 가능한 서명 URL을 전달합니다.
            attachment.setFile_url(createSignedUrl(storedName));

            Map<String, Object> result = new HashMap<>();
            result.put("message", message);
            result.put("attachment", attachment);
            return result;

        } catch (Exception e) {
            storage.delete(blobId);
            if (e instanceof IOException) {
                throw (IOException) e;
            }
            if (e instanceof RuntimeException) {
                throw (RuntimeException) e;
            }
            throw new IllegalStateException("첨부파일 저장 중 오류가 발생했습니다.", e);
        }
    }

    private String createSignedUrl(String storedName) {
        Blob blob = storage.get(BlobId.of(bucketName, storedName));
        if (blob == null) {
            throw new IllegalStateException("GCS에서 첨부파일을 찾을 수 없습니다.");
        }
        return blob.signUrl(15, TimeUnit.MINUTES).toString();
    }


    public void inviteMember(Long roomSeq, Long inviterSeq, Long inviteeSeq) {
        if (inviterSeq.equals(inviteeSeq)) {
            throw new IllegalArgumentException("자기 자신은 초대할 수 없습니다.");
        }
        if (!memberFriendService.isAcceptedFriend(inviterSeq, inviteeSeq)) {
            throw new IllegalArgumentException("내 친구목록에 없는 회원입니다.");
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

        notificationService.createNotification(
                inviteeSeq,
                inviterSeq,
                "CHAT_INVITE",
                invitation.getChat_invitation_seq(),
                "채팅방 초대가 도착했습니다.");
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
            boolean wasAlreadyJoined = chattingDAO.isRoomMember(roomSeq, memberSeq) > 0;

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

            if (!wasAlreadyJoined) {
                publishSystemMessage(roomSeq, memberSeq, "JOIN");
            }
        }
    }

    // 현재 회원만 방에서 나가며, 마지막 참여자가 나간 경우 방을 정리합니다.
    public void leaveRoom(Long roomSeq, Long memberSeq) {
        if (chattingDAO.isRoomMember(roomSeq, memberSeq) == 0) {
            throw new IllegalArgumentException("참여 중인 채팅방이 아닙니다.");
        }

        // 실제 참여 중인 회원만 한 번 퇴장 메시지를 남깁니다.
        publishSystemMessage(roomSeq, memberSeq, "LEAVE");
        chattingDAO.leaveParticipant(roomSeq, memberSeq);
        chattingDAO.leaveRoomList(roomSeq, memberSeq);

        // 남아 있는 참여자가 없는지 확인
        if (chattingDAO.countJoinedParticipants(roomSeq) == 0) {
            chattingDAO.cancelRoomInvitations(roomSeq);
            chattingDAO.deleteChatRoom(roomSeq);
        }
    }

    private void publishSystemMessage(Long roomSeq, Long memberSeq, String eventType) {
        String nickname = chattingDAO.getMemberNickname(memberSeq);
        String content = "JOIN".equals(eventType)
                ? nickname + "님이 입장하였습니다."
                : nickname + "님이 퇴장하였습니다.";

        ChattingMessageDTO message = new ChattingMessageDTO();
        message.setChat_room_seq(roomSeq);
        message.setSender_seq(memberSeq);
        message.setMessage_type("SYSTEM");
        message.setSystem_event_type(eventType);
        message.setMessage_content(content);
        message.setCreated_at(new Date());
        message.setDeleted_yn("N");
        chattingDAO.insertMessage(message);

        messagingTemplate.convertAndSend("/sub/chat/" + roomSeq, (Object) message);
    }

    public ChattingMessageDTO updateMessage(Long roomSeq, Long messageSeq, Long memberSeq, String content) {
        if (!isRoomMember(roomSeq, memberSeq)) {
            throw new IllegalArgumentException("채팅방 참여자만 수정할 수 있습니다.");
        }
        if (content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("수정할 내용을 입력해 주세요.");
        }
        if (chattingDAO.updateMessageContent(roomSeq, messageSeq, memberSeq, content.trim()) == 0) {
            throw new IllegalArgumentException("본인이 작성한 일반 메시지만 수정할 수 있습니다.");
        }
        return chattingDAO.selectMessageBySeq(messageSeq);
    }

    public void deleteMessage(Long roomSeq, Long messageSeq, Long memberSeq) {
        if (!isRoomMember(roomSeq, memberSeq)) {
            throw new IllegalArgumentException("채팅방 참여자만 삭제할 수 있습니다.");
        }
        if (chattingDAO.deleteMessage(roomSeq, messageSeq, memberSeq) == 0) {
            throw new IllegalArgumentException("본인이 작성한 일반 메시지만 삭제할 수 있습니다.");
        }
    }

    public boolean isRoomMember(Long roomSeq, Long memberSeq) {
        return chattingDAO.isRoomMember(roomSeq, memberSeq) > 0;
    }
    
    public boolean isRoomOwner(Long roomSeq, Long memberSeq) {
        return chattingDAO.isRoomOwner(roomSeq, memberSeq) > 0;
    }

    // 방장만 채팅방 전체를 삭제할 수 있습니다.
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