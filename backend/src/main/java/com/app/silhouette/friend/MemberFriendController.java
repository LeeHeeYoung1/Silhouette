package com.app.silhouette.friend;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.app.silhouette.chatting.ChattingDAO;

import jakarta.servlet.http.HttpServletRequest;

// 친구 목록 조회와 친구 요청/수락/거절 API를 제공하는 Controller입니다.
@RestController
@RequestMapping("/api/chat")
public class MemberFriendController {

    private final MemberFriendService memberFriendService;
    private final ChattingDAO chattingDAO;

    public MemberFriendController(MemberFriendService memberFriendService, ChattingDAO chattingDAO) {
        this.memberFriendService = memberFriendService;
        this.chattingDAO = chattingDAO;
    }

    // 현재 로그인한 회원의 친구 목록을 조회합니다.
    @GetMapping("/friends")
    public ResponseEntity<?> getFriendList(HttpServletRequest request) {
        Long memberSeq = getLoginMemberSeq(request);
        if (memberSeq == null) return ResponseEntity.status(401).body("로그인이 필요합니다.");
        return ResponseEntity.ok(memberFriendService.getFriendList(memberSeq));
    }

    // 친구가 아닌 회원을 로그인 아이디로 검색합니다.
    @GetMapping("/friends/search")
    public ResponseEntity<?> searchNonFriends(@RequestParam("keyword") String keyword,
            HttpServletRequest request) {
        Long memberSeq = getLoginMemberSeq(request);
        if (memberSeq == null) return ResponseEntity.status(401).body("로그인이 필요합니다.");
        if (keyword == null || keyword.trim().isEmpty()) return ResponseEntity.ok(List.of());
        return ResponseEntity.ok(memberFriendService.searchNonFriendsByLoginId(keyword.trim(), memberSeq));
    }

    @DeleteMapping("/friends/{friend_member_seq}")
    public ResponseEntity<?> deleteFriend(
            @PathVariable("friend_member_seq") Long friendSeq,
            HttpServletRequest request) {
        Long memberSeq = getLoginMemberSeq(request);
        if (memberSeq == null) return ResponseEntity.status(401).body("로그인이 필요합니다.");
        try {
            memberFriendService.deleteFriend(memberSeq, friendSeq);
            return ResponseEntity.ok("친구를 삭제했습니다.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 채팅방 초대 등에 사용할 수락된 친구를 닉네임으로 검색합니다.
    @GetMapping("/members")
    public ResponseEntity<?> searchFriends(@RequestParam("keyword") String keyword,
            HttpServletRequest request) {
        Long memberSeq = getLoginMemberSeq(request);
        if (memberSeq == null) return ResponseEntity.status(401).body("로그인이 필요합니다.");
        if (keyword == null || keyword.trim().isEmpty()) return ResponseEntity.ok(List.of());
        return ResponseEntity.ok(memberFriendService.searchAcceptedFriends(keyword.trim(), memberSeq));
    }

    // 선택한 회원에게 친구 요청을 보냅니다.
    @PostMapping("/friends/request")
    public ResponseEntity<?> sendFriendRequest(@RequestBody Map<String, Object> data,
            HttpServletRequest request) {
        Long memberSeq = getLoginMemberSeq(request);
        if (memberSeq == null) return ResponseEntity.status(401).body("로그인이 필요합니다.");
        try {
            Object value = data.get("friend_member_seq");
            if (value == null) return ResponseEntity.badRequest().body("친구 회원 번호가 필요합니다.");
            memberFriendService.sendFriendRequest(memberSeq, Long.valueOf(value.toString()));
            return ResponseEntity.ok("친구 요청을 보냈습니다.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 현재 회원에게 도착한 대기 중 친구 요청을 조회합니다.
    @GetMapping("/friends/requests")
    public ResponseEntity<?> getIncomingRequests(HttpServletRequest request) {
        Long memberSeq = getLoginMemberSeq(request);
        if (memberSeq == null) return ResponseEntity.status(401).body("로그인이 필요합니다.");
        return ResponseEntity.ok(memberFriendService.getIncomingRequests(memberSeq));
    }

    // 친구 요청 수락 API입니다. 실제 처리는 공통 메서드에서 수행합니다.
    @PostMapping("/friends/requests/{request_seq}/accept")
    public ResponseEntity<?> acceptFriendRequest(@PathVariable("request_seq") Long requestSeq,
            HttpServletRequest request) {
        return respondFriendRequest(requestSeq, request, true);
    }

    @PostMapping("/friends/requests/{request_seq}/reject")
    public ResponseEntity<?> rejectFriendRequest(@PathVariable("request_seq") Long requestSeq,
            HttpServletRequest request) {
        return respondFriendRequest(requestSeq, request, false);
    }

    // 수락/거절 여부에 따라 Service에 요청 처리를 위임합니다.
    private ResponseEntity<?> respondFriendRequest(Long requestSeq,
            HttpServletRequest request, boolean accept) {
        Long memberSeq = getLoginMemberSeq(request);
        if (memberSeq == null) return ResponseEntity.status(401).body("로그인이 필요합니다.");
        try {
            memberFriendService.respondFriendRequest(requestSeq, memberSeq, accept);
            return ResponseEntity.ok(accept ? "친구 요청을 수락했습니다." : "친구 요청을 거절했습니다.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // JWT 검증 후 request에 저장된 로그인 아이디를 회원 번호로 변환합니다.
    private Long getLoginMemberSeq(HttpServletRequest request) {
        Object id = request.getAttribute("id");
        if (id == null) return null;
        Integer memberSeq = chattingDAO.getMemberSeq(id.toString());
        return memberSeq == null ? null : memberSeq.longValue();
    }
}