package com.app.silhouette.chatting;

import java.util.Date;
import java.util.List;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/chat")
public class ChattingController {

    private final ChattingService chattingService;
    private final ChattingDAO chattingDAO;
    private final SimpMessagingTemplate messagingTemplate;

    public ChattingController(ChattingService chattingService,
            ChattingDAO chattingDAO, SimpMessagingTemplate messagingTemplate) {
        this.chattingService = chattingService;
        this.chattingDAO = chattingDAO;
        this.messagingTemplate = messagingTemplate;
    }

    // 채팅방 생성
    @PostMapping("/room")
    public ResponseEntity<?> createRoom(@RequestBody Map<String, Object> data,
            HttpServletRequest request) {

        Long memberSeq = getLoginMemberSeq(request);

        if (memberSeq == null) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }

        ChattingRoomDTO room = new ChattingRoomDTO();

        room.setRoom_name(data.get("room_name") == null ? "새 채팅방" : data.get("room_name").toString());
        room.setRoom_type(data.get("room_type") == null ? "1:1" : data.get("room_type").toString());

        if (data.get("matching_seq") != null) {
            room.setMatching_seq(Long.valueOf(data.get("matching_seq").toString()));
        }

        List<Long> inviteeSeqs = new java.util.ArrayList<>();

        if (data.get("invitee_seqs") instanceof List<?>) {
            for (Object value : (List<?>) data.get("invitee_seqs")) {
                inviteeSeqs.add(Long.valueOf(value.toString()));
            }
        }

        room.setRoom_type(inviteeSeqs.size() > 1 ? "GROUP" : "1:1");

        try {
            return ResponseEntity.ok(
                    chattingService.createRoom(room, memberSeq, inviteeSeqs));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 내 채팅방 목록
    @GetMapping("/rooms")
    public ResponseEntity<?> getRoomList(HttpServletRequest request) {

        Long memberSeq = getLoginMemberSeq(request);

        if (memberSeq == null) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }

        return ResponseEntity.ok(chattingService.getRoomList(memberSeq));
    }


    // 채팅방 참여 회원 목록
    @GetMapping("/room/{chat_room_seq}/members")
    public ResponseEntity<?> getRoomMembers(
            @PathVariable("chat_room_seq") Long roomSeq,
            HttpServletRequest request) {
        Long memberSeq = getLoginMemberSeq(request);
        if (memberSeq == null) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }
        try {
            return ResponseEntity.ok(chattingService.getRoomMembers(roomSeq, memberSeq));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        }
    }

    // 내 회원 번호
    @GetMapping("/member-seq")
    public ResponseEntity<?> getMemberSeq(HttpServletRequest request) {

        Long memberSeq = getLoginMemberSeq(request);

        if (memberSeq == null) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }

        return ResponseEntity.ok(memberSeq);
    }

    // 채팅방 메시지 목록
    @GetMapping("/messages/{chat_room_seq}")
    public ResponseEntity<?> getMessageList(
            @PathVariable("chat_room_seq") Long roomSeq,
            HttpServletRequest request) {

        Long memberSeq = getLoginMemberSeq(request);

        if (memberSeq == null) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }

        try {
            return ResponseEntity.ok(chattingService.getMessageList(roomSeq, memberSeq));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        }
    }

    // 채팅방 첨부파일 목록
    @GetMapping("/messages/{chat_room_seq}/attachments")
    public ResponseEntity<?> getAttachmentList(
            @PathVariable("chat_room_seq") Long roomSeq,
            HttpServletRequest request) {

        Long memberSeq = getLoginMemberSeq(request);

        if (memberSeq == null) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }

        try {
            return ResponseEntity.ok(chattingService.getAttachmentList(roomSeq, memberSeq));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        }
    }

    // 음성 메시지 업로드 및 실시간 전송
    @PostMapping(value = "/room/{chat_room_seq}/voice", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadVoiceMessage(
            @PathVariable("chat_room_seq") Long roomSeq,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "duration", required = false) Long duration,
            HttpServletRequest request) {

        Long memberSeq = getLoginMemberSeq(request);

        if (memberSeq == null) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }

        try {
            Map<String, Object> result = chattingService.uploadVoiceMessage(
                    roomSeq, memberSeq, file, duration);

            messagingTemplate.convertAndSend(
                    "/sub/chat/" + roomSeq,
                    (Object) result
            );

            return ResponseEntity.ok(result);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("음성 메시지 업로드에 실패했습니다.");
        }
    }

    // 일반 파일 업로드 및 실시간 전송
    @PostMapping(value = "/room/{chat_room_seq}/file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadChatFile(
            @PathVariable("chat_room_seq") Long roomSeq,
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request) {

        Long memberSeq = getLoginMemberSeq(request);

        if (memberSeq == null) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }

        try {
            Map<String, Object> result = chattingService.uploadChatFile(roomSeq, memberSeq, file);

            messagingTemplate.convertAndSend(
                    "/sub/chat/" + roomSeq,
                    (Object) result
            );

            return ResponseEntity.ok(result);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("파일 업로드에 실패했습니다.");
        }
    }

    // 사진 업로드 및 실시간 전송
    @PostMapping(value = "/room/{chat_room_seq}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadChatImage(
            @PathVariable("chat_room_seq") Long roomSeq,
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request) {

        Long memberSeq = getLoginMemberSeq(request);

        if (memberSeq == null) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }

        try {
            Map<String, Object> result = chattingService.uploadChatImage(roomSeq, memberSeq, file);

            messagingTemplate.convertAndSend(
                    "/sub/chat/" + roomSeq,
                    (Object) result
            );

            return ResponseEntity.ok(result);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("사진 업로드에 실패했습니다.");
        }
    }


    // 채팅방에 회원 초대
    @PostMapping("/invite")
    public ResponseEntity<?> inviteMember(@RequestBody Map<String, Object> data,
            HttpServletRequest request) {

        Long inviterSeq = getLoginMemberSeq(request);

        if (inviterSeq == null) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }

        try {
            Long roomSeq = Long.valueOf(data.get("chat_room_seq").toString());
            Long inviteeSeq = Long.valueOf(data.get("invitee_seq").toString());

            chattingService.inviteMember(roomSeq, inviterSeq, inviteeSeq);

            return ResponseEntity.ok("초대를 보냈습니다.");

        } catch (IllegalArgumentException | NullPointerException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 내가 받은 초대 목록
    @GetMapping("/invitations")
    public ResponseEntity<?> getInvitations(HttpServletRequest request) {

        Long memberSeq = getLoginMemberSeq(request);

        if (memberSeq == null) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }

        return ResponseEntity.ok(chattingService.getInvitations(memberSeq));
    }

    // 초대 수락
    @PostMapping("/invite/{invitation_seq}/accept")
    public ResponseEntity<?> acceptInvitation(
            @PathVariable("invitation_seq") Long invitationSeq,
            HttpServletRequest request) {

        return respondInvitation(invitationSeq, request, true);
    }

    // 초대 거절
    @PostMapping("/invite/{invitation_seq}/reject")
    public ResponseEntity<?> rejectInvitation(
            @PathVariable("invitation_seq") Long invitationSeq,
            HttpServletRequest request) {

        return respondInvitation(invitationSeq, request, false);
    }

    private ResponseEntity<?> respondInvitation(Long invitationSeq,
            HttpServletRequest request, boolean accept) {

        Long memberSeq = getLoginMemberSeq(request);

        if (memberSeq == null) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }

        try {
            chattingService.respondInvitation(invitationSeq, memberSeq, accept);

            return ResponseEntity.ok(accept ? "초대를 수락했습니다." : "초대를 거절했습니다.");

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 채팅방 나가기
    @PostMapping("/room/{chat_room_seq}/leave")
    public ResponseEntity<?> leaveRoom(
            @PathVariable("chat_room_seq") Long roomSeq,
            HttpServletRequest request) {

        Long memberSeq = getLoginMemberSeq(request);

        if (memberSeq == null) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }

        try {
            chattingService.leaveRoom(roomSeq, memberSeq);

            return ResponseEntity.ok("채팅방에서 나왔습니다.");

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // STOMP 메시지 전송
    @MessageMapping("/chat/send")
    public void sendMessage(ChattingMessageDTO message,
            SimpMessageHeaderAccessor headerAccessor) {

        Map<String, Object> session = headerAccessor.getSessionAttributes();

        if (session == null || session.get("userId") == null
                || message.getChat_room_seq() == null
                || message.getMessage_content() == null
                || message.getMessage_content().trim().isEmpty()) {
            return;
        }

        String id = session.get("userId").toString();
        Integer seq = chattingDAO.getMemberSeq(id);

        if (seq == null) {
            return;
        }

        Long memberSeq = seq.longValue();

        if (!chattingService.isRoomMember(message.getChat_room_seq(), memberSeq)) {
            return;
        }

        message.setSender_seq(memberSeq);
        message.setMessage_type("TEXT");
        message.setSystem_event_type(null);
        message.setCreated_at(new Date());
        message.setDeleted_yn("N");

        chattingDAO.insertMessage(message);

        System.out.println("메시지 DB 저장 완료");
        System.out.println("메시지 브로드캐스트 주소: /sub/chat/" + message.getChat_room_seq());

        messagingTemplate.convertAndSend(
                "/sub/chat/" + message.getChat_room_seq(),
                (Object) message
        );
    }

    private Long getLoginMemberSeq(HttpServletRequest request) {

        String id = (String) request.getAttribute("id");

        if (id == null) {
            return null;
        }

        Integer memberSeq = chattingDAO.getMemberSeq(id);

        if (memberSeq == null) {
            return null;
        }

        return memberSeq.longValue();
    }

    // 현재 사용자가 채팅방 방장인지 확인
    @GetMapping("/room/{chat_room_seq}/owner")
    public ResponseEntity<?> checkRoomOwner(
            @PathVariable("chat_room_seq") Long roomSeq,
            HttpServletRequest request) {

        Long memberSeq = getLoginMemberSeq(request);

        if (memberSeq == null) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }

        return ResponseEntity.ok(chattingService.isRoomOwner(roomSeq, memberSeq));
    }

    // 방장이 채팅방 삭제
    @PostMapping("/room/{chat_room_seq}/delete")
    public ResponseEntity<?> deleteRoom(
            @PathVariable("chat_room_seq") Long roomSeq,
            HttpServletRequest request) {

        Long memberSeq = getLoginMemberSeq(request);

        if (memberSeq == null) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }

        try {
            chattingService.deleteRoom(roomSeq, memberSeq);

            return ResponseEntity.ok("채팅방이 삭제되었습니다.");

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}