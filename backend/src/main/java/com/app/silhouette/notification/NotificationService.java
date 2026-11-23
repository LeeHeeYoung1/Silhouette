package com.app.silhouette.notification;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
// 알림 생성, 목록 조회, 읽지 않은 개수 조회 등 알림 업무 규칙을 처리합니다.
public class NotificationService {

    private final NotificationDAO notificationDAO;

    public NotificationService(NotificationDAO notificationDAO) {
        this.notificationDAO = notificationDAO;
    }

    // 알림을 만들 때 기본 읽음 상태를 N으로 지정하고 DB에 저장합니다.
    public void createNotification(Long receiverSeq, Long senderSeq,
            String type, Long referenceSeq, String content) {
        NotificationDTO notification = new NotificationDTO();
        notification.setReceiver_seq(receiverSeq);
        notification.setSender_seq(senderSeq);
        notification.setNotification_type(type);
        notification.setReference_seq(referenceSeq);
        notification.setNotification_content(content);
        notification.setRead_yn("N");
        notificationDAO.insertNotification(notification);
    }

    // 로그인한 회원에게 도착한 알림 목록을 반환합니다.
    public List<NotificationDTO> getNotifications(Long memberSeq) {
        return notificationDAO.selectNotifications(memberSeq);
    }

    // 종 아이콘 옆에 표시할 읽지 않은 알림 개수를 반환합니다.
    public int getUnreadCount(Long memberSeq) {
        return notificationDAO.countUnreadNotifications(memberSeq);
    }

    // 사용자가 확인한 알림을 읽음 상태로 변경합니다.
    public void markRead(Long notificationSeq, Long memberSeq) {
        notificationDAO.markNotificationRead(notificationSeq, memberSeq);
    }
}