package com.app.silhouette.interceptors;

import org.jspecify.annotations.Nullable;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import com.auth0.jwt.interfaces.DecodedJWT;
import com.app.silhouette.commons.JwtUtil;

@Component
public class JwtChannelInterceptor implements ChannelInterceptor {
   
   private JwtUtil jwt;
   
   public JwtChannelInterceptor(JwtUtil jwt) {
      this.jwt = jwt;
   }
   
   @Override
   public @Nullable Message<?> preSend(Message<?> message, MessageChannel channel) {
      
      StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
      
      if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
         String authHeader = accessor.getFirstNativeHeader("Authorization");
         if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
               String token = authHeader.substring(7);
               DecodedJWT dToken = jwt.verifyToken(token);
               String userId = dToken.getSubject();
               
               System.out.println("WebSocket 인증 성공 - 사용자: " + userId);
               if (accessor.getSessionAttributes() != null) {
                  accessor.getSessionAttributes().put("userId", userId);
               }
            } catch (Exception e) {
               System.err.println("WebSocket JWT 검증 실패: " + e.getMessage());
            }
         }
      }
      
      return message;
   }
   
}
