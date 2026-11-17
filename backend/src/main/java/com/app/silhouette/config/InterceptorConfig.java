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
                "/members/idCheck");
	}

}