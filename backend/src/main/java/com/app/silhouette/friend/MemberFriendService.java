package com.app.silhouette.friend;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.silhouette.notification.NotificationService;

// 친구 관계의 중복 요청 방지, 상태 변경, 알림 발송을 처리합니다.
@Service
@Transactional
public class MemberFriendService {

    private final MemberFriendDAO memberFriendDAO;
    private final NotificationService notificationService;

    public MemberFriendService(MemberFriendDAO memberFriendDAO,
            NotificationService notificationService) {
        this.memberFriendDAO = memberFriendDAO;
        this.notificationService = notificationService;
    }

    public List<MemberFriendDTO> getFriendList(Long memberSeq) {
        return memberFriendDAO.selectFriendList(memberSeq);
    }

    public List<MemberFriendDTO> searchAcceptedFriends(String keyword, Long memberSeq) {
        return memberFriendDAO.searchAcceptedFriends(keyword, memberSeq);
    }

    public boolean isAcceptedFriend(Long memberSeq, Long friendSeq) {
        return memberFriendDAO.isAcceptedFriend(memberSeq, friendSeq) > 0;
    }

    public List<MemberFriendDTO> getIncomingRequests(Long memberSeq) {
        return memberFriendDAO.selectIncomingRequests(memberSeq);
    }

    // 친구 요청을 저장한 뒤 요청을 받은 회원에게 FRIEND_REQUEST 알림을 생성합니다.
    public void sendFriendRequest(Long requesterSeq, Long requestedSeq) {
        if (requestedSeq == null || requesterSeq.equals(requestedSeq)) {
            throw new IllegalArgumentException("친구 요청 대상을 확인해 주세요.");
        }
        Long requestSeq = null;

        // 기존 관계가 거절 상태라면 다시 대기 상태로 바꾸고, 그 외 중복 요청은 차단합니다.
        if (memberFriendDAO.countRelationship(requesterSeq, requestedSeq) > 0) {
            int reactivated = memberFriendDAO.reactivateRejectedRequest(requesterSeq, requestedSeq);
            if (reactivated == 0) {
                throw new IllegalArgumentException("이미 친구 관계이거나 요청이 존재합니다.");
            }
            requestSeq = memberFriendDAO.selectRequestSeqByPair(requesterSeq, requestedSeq);
        } else {
            MemberFriendDTO request = new MemberFriendDTO();
            request.setMember_seq(requesterSeq);
            request.setFriend_member_seq(requestedSeq);
            request.setFriend_status("PENDING");
            request.setRequester_member_seq(requesterSeq);
            request.setRequested_member_seq(requestedSeq);
            memberFriendDAO.insertFriendRequest(request);
            requestSeq = request.getMember_friend_seq();
        }

        notificationService.createNotification(
                requestedSeq, requesterSeq, "FRIEND_REQUEST",
                requestSeq, "친구 요청이 도착했습니다.");
    }

    // 요청을 받은 회원만 수락/거절할 수 있도록 확인한 뒤 상태를 변경합니다.
    // 처리 결과는 요청을 보낸 회원에게 알림으로 전달합니다.
    public void respondFriendRequest(Long requestSeq, Long memberSeq, boolean accept) {
        MemberFriendDTO request = memberFriendDAO.selectFriendRequest(requestSeq);
        if (request == null || !memberSeq.equals(request.getFriend_member_seq())) {
            throw new IllegalArgumentException("친구 요청을 찾을 수 없습니다.");
        }
        if (!"PENDING".equals(request.getFriend_status())) {
            throw new IllegalArgumentException("이미 처리된 친구 요청입니다.");
        }

        String status = accept ? "ACCEPTED" : "REJECTED";
        if (memberFriendDAO.updateFriendRequestStatus(requestSeq, status) == 0) {
            throw new IllegalArgumentException("이미 처리된 친구 요청입니다.");
        }

        notificationService.createNotification(
                request.getMember_seq(), memberSeq,
                accept ? "FRIEND_ACCEPTED" : "FRIEND_REJECTED",
                requestSeq,
                accept ? "친구 요청을 수락했습니다." : "친구 요청을 거절했습니다.");
    }
}