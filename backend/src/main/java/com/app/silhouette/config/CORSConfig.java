package com.app.silhouette.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CORSConfig implements WebMvcConfigurer {
   
   @Override
   public void addCorsMappings(CorsRegistry registry) {
      registry.addMapping("/**")
         // 1. allowedOrigins("*") 대신 allowedOriginPatterns를 사용하여 React 주소를 명시합니다.
         .allowedOriginPatterns("http://localhost:5173") 
         .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
         .allowedHeaders("*")
         // 2. 프론트엔드에서 JWT 헤더를 포함할 수 있도록 허용합니다. (필수)
         .allowCredentials(true); 
   }
}