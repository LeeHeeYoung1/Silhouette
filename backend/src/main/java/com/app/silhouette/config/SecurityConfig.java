package com.app.silhouette.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        System.out.println(">>> SecurityConfig 로딩됨");
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> {})
            .formLogin(form -> form.disable())   // 로그인 페이지 끄기
            .httpBasic(basic -> basic.disable()) // 브라우저 기본 로그인 팝업 차단
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)) // WWW-Authenticate 헤더 제거 (팝업 차단)
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/live-test/**").permitAll()
                .requestMatchers("/api/profile/image/**").permitAll() // 프로필 이미지 공개
                .requestMatchers("/error").permitAll()          // 진짜 에러 메시지 보이게
                .requestMatchers("/*.html", "/js/**", "/css/**").permitAll() // 정적 테스트 페이지를 쓴다면
                .anyRequest().permitAll()
            );
        return http.build();
    }
}