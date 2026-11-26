package com.app.silhouette.admin;

import java.net.URI;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriComponentsBuilder;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;


@Service
public class SightEngineService {
	
	@Value("${sightengine.api.url:}")
	private String apiUrl;
	
	@Value("${sightengine.api.user:}")
	private String apiUser;
	
	@Value("${sightengine.api.secret:}")
	private String apiSecret;
	
	private final RestTemplate restTemplate;
	private final ObjectMapper objectMapper = new ObjectMapper();

	public SightEngineService() {
		org.springframework.http.client.SimpleClientHttpRequestFactory factory = 
				new org.springframework.http.client.SimpleClientHttpRequestFactory();
		factory.setConnectTimeout(3000);
		factory.setReadTimeout(5000);
		this.restTemplate = new RestTemplate(factory);
	}
	
	public double detectAiGeneratedScore(byte[] imageBytes, String filename) {
		if (apiUrl == null || apiUrl.isBlank() || apiUser == null || apiUser.isBlank() || apiSecret == null || apiSecret.isBlank()) {
			return 0.0;
		}
		if (imageBytes == null || imageBytes.length == 0) {
			return 0.0;
		}
		try {
			HttpHeaders headers = new HttpHeaders();
			headers.setContentType(MediaType.MULTIPART_FORM_DATA);
			
			MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
			body.add("models", "genai");
			body.add("api_user", apiUser);
			body.add("api_secret", apiSecret);
			body.add("media", new ByteArrayResource(imageBytes) {
				@Override
				public String getFilename() {
					return (filename != null && !filename.isBlank()) ? filename : "upload.jpg";
				}
			});
				
			HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
			ResponseEntity<String> response = restTemplate.postForEntity(apiUrl, requestEntity, String.class);
			
			JsonNode root = objectMapper.readTree(response.getBody());
			if("success".equals(root.path("status").asText())) {
				double rawScore = root.path("type").path("ai_generated").asDouble(0.0);
				return Math.round(rawScore * 10000.0) / 100.0;
			}
			throw new IllegalStateException("Sightengine 응답 오류: " + root.path("error").path("message").asText());
			
		} catch (Exception e) {
			throw new RuntimeException("AI 이미지 판별 API 호출 실패/타임아웃: " + e.getMessage(), e);
		}
	}

	public double detectAiGeneratedScore(MultipartFile file) {
		try {
			if (file == null || file.isEmpty()) {
				return 0.0;
			}
			return detectAiGeneratedScore(file.getBytes(), file.getOriginalFilename());
		} catch (Exception e) {
			throw new RuntimeException("AI 이미지 파일 읽기 실패: " + e.getMessage(), e);
		}
	}
	
	public double detectAiGeneratedScoreByUrl(String imageUrl) {
		if (apiUrl == null || apiUrl.isBlank() || apiUser == null || apiUser.isBlank() || apiSecret == null || apiSecret.isBlank() || imageUrl == null || imageUrl.isBlank()) {
			return 0.0;
		}
		try {
			URI requestUri = UriComponentsBuilder.fromUriString(apiUrl)
					.queryParam("models", "genai")
					.queryParam("api_user", apiUser)
					.queryParam("api_secret", apiSecret)
					.queryParam("url", imageUrl)
					.build()
					.toUri();
			
			ResponseEntity<String> response = restTemplate.getForEntity(requestUri, String.class);
			JsonNode root = objectMapper.readTree(response.getBody());
			
			if("success".equals(root.path("status").asText())) {
				double rawScore = root.path("type").path("ai_generated").asDouble(0.0);
				return Math.round(rawScore * 10000.0) / 100.0;
			}
			throw new IllegalStateException("Sightengine 응답 오류: " + root.path("error").path("message").asText());
		} catch (Exception e) {
			throw new RuntimeException("AI 이미지 판별 URL 판별 실패/타임아웃: " + e.getMessage(), e);
		}
	}
	
	
}
