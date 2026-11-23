package com.app.silhouette.notification;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.app.silhouette.chatting.ChattingDAO;

import jakarta.servlet.http.HttpServletRequest;

// 프론트엔드의 알림 목록/개수/읽음 처리 요청을 받는 REST Controller입니다.
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final ChattingDAO chattingDAO;

    public NotificationController(NotificationService notificationService, ChattingDAO chattingDAO) {
        this.notificationService = notificationService;
        this.chattingDAO = chattingDAO;
    }

    // 현재 로그인한 회원의 알림 목록을 조회합니다.
    @GetMapping
    public ResponseEntity<?> getNotifications(HttpServletRequest request) {
        Long memberSeq = getLoginMemberSeq(request);
        if (memberSeq == null) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }
        return ResponseEntity.ok(notificationService.getNotifications(memberSeq));
    }

    // 종 아이콘에 표시할 읽지 않은 알림 개수를 조회합니다.
    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(HttpServletRequest request) {
        Long memberSeq = getLoginMemberSeq(request);
        if (memberSeq == null) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }
        return ResponseEntity.ok(notificationService.getUnreadCount(memberSeq));
    }

    // 알림을 읽음 처리합니다. 다른 회원의 알림은 수정할 수 없습니다.
    @PostMapping("/{notification_seq}/read")
    public ResponseEntity<?> markRead(@PathVariable("notification_seq") Long notificationSeq,
            HttpServletRequest request) {
        Long memberSeq = getLoginMemberSeq(request);
        if (memberSeq == null) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }
        notificationService.markRead(notificationSeq, memberSeq);
        return ResponseEntity.ok("알림을 읽음 처리했습니다.");
    }

    // LoginValidator가 request에 저장한 로그인 아이디를 회원 번호로 변환합니다.
    private Long getLoginMemberSeq(HttpServletRequest request) {
        Object id = request.getAttribute("id");
        if (id == null) return null;
        Integer memberSeq = chattingDAO.getMemberSeq(id.toString());
        return memberSeq == null ? null : memberSeq.longValue();
    }
}