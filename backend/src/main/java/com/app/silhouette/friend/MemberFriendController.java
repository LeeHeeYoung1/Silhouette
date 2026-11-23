package com.app.silhouette.friend;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.app.silhouette.chatting.ChattingDAO;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/chat")
public class MemberFriendController {

    private final MemberFriendService memberFriendService;
    private final ChattingDAO chattingDAO;

    public MemberFriendController(
            MemberFriendService memberFriendService,
            ChattingDAO chattingDAO) {
        this.memberFriendService = memberFriendService;
        this.chattingDAO = chattingDAO;
    }

    // 내 친구 목록
    @GetMapping("/friends")
    public ResponseEntity<?> getFriendList(HttpServletRequest request) {
        Long memberSeq = getLoginMemberSeq(request);

        if (memberSeq == null) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }

        return ResponseEntity.ok(memberFriendService.getFriendList(memberSeq));
    }

    // 친구 중 닉네임 검색 (채팅 초대 검색)
    @GetMapping("/members")
    public ResponseEntity<?> searchFriends(
            @RequestParam("keyword") String keyword,
            HttpServletRequest request) {

        Long memberSeq = getLoginMemberSeq(request);

        if (memberSeq == null) {
            return ResponseEntity.status(401).body("로그인이 필요합니다.");
        }

        if (keyword == null || keyword.trim().isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        return ResponseEntity.ok(
                memberFriendService.searchAcceptedFriends(keyword.trim(), memberSeq));
    }

    // 기존 ChattingController와 같은 로그인 회원 번호 조회 방식 사용
    private Long getLoginMemberSeq(HttpServletRequest request) {
        Object id = request.getAttribute("id");

        if (id == null) {
            return null;
        }

        Integer memberSeq = chattingDAO.getMemberSeq(id.toString());

        if (memberSeq == null) {
            return null;
        }

        return memberSeq.longValue();
    }
}
