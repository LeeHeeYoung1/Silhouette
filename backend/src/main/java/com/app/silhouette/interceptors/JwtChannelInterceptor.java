package com.app.silhouette.interceptors;

import java.util.Map;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import com.app.silhouette.chatting.ChattingDAO;
import com.app.silhouette.commons.JwtUtil;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;

@Component
public class JwtChannelInterceptor implements ChannelInterceptor {

    private final JwtUtil jwt;
    private final ChattingDAO chattingDAO;

    public JwtChannelInterceptor(JwtUtil jwt, ChattingDAO chattingDAO) {
        this.jwt = jwt;
        this.chattingDAO = chattingDAO;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null || accessor.getCommand() == null) {
            return message;
        }

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

        // 채팅방에 참여 중인 회원만 구독 가능
        if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            Map<String, Object> attributes = accessor.getSessionAttributes();
            String userId = attributes == null ? null : (String) attributes.get("userId");
            String destination = accessor.getDestination();

            if (userId == null || destination == null
                    || !destination.startsWith("/sub/chat/")) {
                return null;
            }

            try {
                Long roomSeq = Long.valueOf(destination.substring("/sub/chat/".length()));
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
}
