
package com.app.silhouette.interceptors;

import java.util.Map;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import com.app.silhouette.blind.BlindDAO;
import com.app.silhouette.chatting.ChattingDAO;
import com.app.silhouette.commons.JwtUtil;
import com.app.silhouette.live.LiveDAO;
import com.app.silhouette.live.LiveRoomDTO;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;

@Component
public class JwtChannelInterceptor implements ChannelInterceptor {

    private final JwtUtil jwt;
    private final ChattingDAO chattingDAO;
    private final LiveDAO liveDAO;
    private final BlindDAO blindDAO;

    public JwtChannelInterceptor(JwtUtil jwt, ChattingDAO chattingDAO, LiveDAO liveDAO, BlindDAO blindDAO) {
        this.jwt = jwt;
        this.chattingDAO = chattingDAO;
        this.liveDAO = liveDAO;
        this.blindDAO = blindDAO;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {

        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null || accessor.getCommand() == null) {
            return message;
        }

        // 웹소켓 연결 시 JWT 검증
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {

            String authHeader = accessor.getFirstNativeHeader("Authorization");

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return null;
            }

            try {
                String token = authHeader.substring(7);
                DecodedJWT decoded = jwt.verifyToken(token);
                String userId = decoded.getSubject();

                if (userId == null || userId.isEmpty()) {
                    return null;
                }

                Map<String, Object> attributes = accessor.getSessionAttributes();

                if (attributes == null) {
                    return null;
                }

                attributes.put("userId", userId);

            } catch (JWTVerificationException e) {
                return null;
            }
        }

        // 채팅방 구독 시 참여 회원인지 확인
        if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {

            String destination = accessor.getDestination();

            // 라이브 채팅 구독: 방송 중 + (방송자 또는 강퇴·차단 안 된 회원)
            if (destination != null && destination.startsWith("/sub/live/")) {
                return canSubscribeLive(accessor, destination) ? message : null;
            }

            // 블라인드 매칭 결과 구독: 본인 주소만 (/sub/user/{로그인아이디}/match)
            if (destination != null && destination.startsWith("/sub/user/")) {
                return isOwnUserDestination(accessor, destination) ? message : null;
            }

            // 블라인드 채팅방 구독: 그 방의 두 참여자만
            if (destination != null && destination.startsWith("/sub/blind/chat/")) {
                return canSubscribeBlind(accessor, destination) ? message : null;
            }

            // 채팅방 구독이 아닌 경우 기존 기능 유지
            if (destination == null || !destination.startsWith("/sub/chat/")) {
                return message;
            }

            Map<String, Object> attributes = accessor.getSessionAttributes();

            String userId = attributes == null
                    ? null
                    : (String) attributes.get("userId");

            if (userId == null) {
                return null;
            }

            try {
                Long roomSeq = Long.valueOf(
                        destination.substring("/sub/chat/".length())
                );

                Integer memberSeq = chattingDAO.getMemberSeq(userId);

                if (memberSeq == null
                        || chattingDAO.isRoomMember(roomSeq, memberSeq.longValue()) == 0) {
                    return null;
                }

            } catch (NumberFormatException e) {
                return null;
            }
        }

        return message;
    }

    private String sessionUserId(StompHeaderAccessor accessor) {
        Map<String, Object> attributes = accessor.getSessionAttributes();
        return attributes == null ? null : (String) attributes.get("userId");
    }

    // /sub/user/{userId}/... 의 userId가 연결한 본인인지
    private boolean isOwnUserDestination(StompHeaderAccessor accessor, String destination) {
        String userId = sessionUserId(accessor);
        if (userId == null) {
            return false;
        }
        String rest = destination.substring("/sub/user/".length());
        int slash = rest.indexOf('/');
        String target = slash < 0 ? rest : rest.substring(0, slash);
        return userId.equals(target);
    }

    private boolean canSubscribeBlind(StompHeaderAccessor accessor, String destination) {
        String userId = sessionUserId(accessor);
        if (userId == null) {
            return false;
        }
        try {
            long roomSeq = Long.parseLong(destination.substring("/sub/blind/chat/".length()));
            return blindDAO.isRoomMember(roomSeq, userId);
        } catch (NumberFormatException e) {
            return false;
        }
    }

    private boolean canSubscribeLive(StompHeaderAccessor accessor, String destination) {
        Map<String, Object> attributes = accessor.getSessionAttributes();
        String userId = attributes == null ? null : (String) attributes.get("userId");
        if (userId == null) {
            return false;
        }
        try {
            long liveRoomSeq = Long.parseLong(destination.substring("/sub/live/".length()));
            Long memberSeq = liveDAO.selectMemberSeqByLoginId(userId);
            LiveRoomDTO room = liveDAO.selectLiveRoom(liveRoomSeq);
            if (memberSeq == null || room == null || !"LIVE".equals(room.getStatus())) {
                return false;
            }
            if (room.getHostSeq().longValue() == memberSeq) {
                return true;
            }
            return !liveDAO.isKicked(liveRoomSeq, memberSeq)
                    && !liveDAO.isBanned(room.getHostSeq(), memberSeq);
        } catch (NumberFormatException e) {
            return false;
        }
    }
}
