package com.app.silhouette.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import com.app.silhouette.interceptors.JwtChannelInterceptor;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
   
   private JwtChannelInterceptor jci;
   
   WebSocketConfig(JwtChannelInterceptor jci) {
      this.jci = jci;
   }
   
   @Override
   public void configureMessageBroker(MessageBrokerRegistry registry) {   // 연결된 이후
      registry.setApplicationDestinationPrefixes("/pub");   // publish - 배포하다
      registry.enableSimpleBroker("/sub");            // subscribe - 구독하다
   }
   
   @Override
   public void registerStompEndpoints(StompEndpointRegistry registry) {   // 연결 이전
      registry.addEndpoint("/chat", "/blind").setAllowedOriginPatterns("*");
   }
   
   @Override
   public void configureClientInboundChannel(ChannelRegistration registration) {
      registration.interceptors(jci);
   }
   
}
