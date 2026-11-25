package com.app.silhouette.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.app.silhouette.interceptors.LoginValidator;

@Configuration
public class InterceptorConfig implements WebMvcConfigurer{
	
	private final LoginValidator lv;
	InterceptorConfig(LoginValidator validator) {
		this.lv = validator;
	}
	
	@Override
	public void addInterceptors(InterceptorRegistry registry) {
		registry.addInterceptor(lv)
		.addPathPatterns("/**")
		.excludePathPatterns("/members/signup",
                "/auth/login",
                "/members/idCheck",
                "/chat",
                "/chat/**",
                "/live",                   // 라이브 채팅 STOMP 엔드포인트
                "/api/livekit/webhook",   // LiveKit 서명으로 따로 검증
                "/api/profile/image/**",  // 프로필 사진 이미지 바이너리 (img 태그 등)
                "/api/posts/files/**");   // 게시글 첨부파일 다운로드
	}

}