package com.app.silhouette.notification;

import java.util.List;
import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;

@Repository
// NotificationService와 MyBatis Mapper 사이에서 DB 작업을 담당합니다.
public class NotificationDAO {

    private final SqlSessionTemplate mybatis;

    public NotificationDAO(SqlSessionTemplate mybatis) {
        this.mybatis = mybatis;
    }

    // 새 알림을 MEMBER_NOTIFICATION 테이블에 저장합니다.
    public int insertNotification(NotificationDTO notification) {
        return mybatis.insert("Notification.insertNotification", notification);
    }

    // 특정 회원이 받은 알림 목록을 최신 알림부터 조회합니다.
    public List<NotificationDTO> selectNotifications(Long memberSeq) {
        return mybatis.selectList("Notification.selectNotifications", memberSeq);
    }

    // 해당 회원이 아직 읽지 않은 알림 개수를 조회합니다.
    public int countUnreadNotifications(Long memberSeq) {
        return mybatis.selectOne("Notification.countUnreadNotifications", memberSeq);
    }

    // 알림 번호와 로그인 회원 번호가 모두 일치할 때만 읽음 처리합니다.
    public int markNotificationRead(Long notificationSeq, Long memberSeq) {
        java.util.Map<String, Object> param = new java.util.HashMap<>();
        param.put("notificationSeq", notificationSeq);
        param.put("memberSeq", memberSeq);
        return mybatis.update("Notification.markNotificationRead", param);
    }
}