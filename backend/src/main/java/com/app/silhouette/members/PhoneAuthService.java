package com.app.silhouette.members;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClient;

@Service
public class PhoneAuthService {

    private static final String SOLAPI_SEND_URL = "https://api.solapi.com/messages/v4/send";
    private static final long EXPIRE_SECONDS = 180L; // 3분 유효

    @Value("${solapi.api-key:}")
    private String apiKey;

    @Value("${solapi.api-secret:}")
    private String apiSecret;

    @Value("${solapi.sender:}")
    private String sender;

    private final SecureRandom secureRandom = new SecureRandom();
    private final RestClient restClient;

    // 휴대폰 번호(숫자만) -> 인증 정보 저장소
    private final Map<String, VerificationEntry> store = new ConcurrentHashMap<>();

    private static class VerificationEntry {
        final String code;
        final Instant expiresAt;
        boolean verified;

        VerificationEntry(String code, Instant expiresAt) {
            this.code = code;
            this.expiresAt = expiresAt;
            this.verified = false;
        }
    }

    public PhoneAuthService() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(10));
        this.restClient = RestClient.builder().requestFactory(factory).build();
    }

    // 1. 인증번호 생성 및 Solapi SMS 발송
    public void sendVerificationSms(String rawPhone) {
        String to = digitsOnly(rawPhone);
        if (!to.matches("^010\\d{8}$")) {
            throw new IllegalArgumentException("휴대폰 번호를 010-XXXX-XXXX 형식으로 정확히 입력해 주세요.");
        }

        String from = digitsOnly(sender);
        if (apiKey == null || apiKey.isBlank() || apiSecret == null || apiSecret.isBlank() || from.isBlank()) {
            throw new IllegalStateException("서버의 Solapi SMS 설정(solapi.api-key / api-secret / sender)이 비어 있습니다.");
        }

        // 6자리 난수 생성 (100000 ~ 999999)
        String code = String.format("%06d", 100000 + secureRandom.nextInt(900000));
        Instant expiresAt = Instant.now().plusSeconds(EXPIRE_SECONDS);
        store.put(to, new VerificationEntry(code, expiresAt));

        String text = "[Silhouette] 본인확인 인증번호는 [" + code + "] 입니다. 3분 내에 입력해 주세요.";
        String authHeader = buildHmacAuthHeader(apiKey.trim(), apiSecret.trim());

        Map<String, Object> payload = Map.of(
            "message", Map.of(
                "to", to,
                "from", from,
                "text", text
            )
        );

        try {
            restClient.post()
                .uri(SOLAPI_SEND_URL)
                .header("Authorization", authHeader)
                .contentType(MediaType.APPLICATION_JSON)
                .body(payload)
                .retrieve()
                .toBodilessEntity();
        } catch (HttpStatusCodeException e) {
            store.remove(to);
            throw new IllegalStateException("문자 발송에 실패했습니다. 발신번호 등록 여부 또는 API 키를 확인해 주세요. (" + e.getStatusCode() + ")");
        } catch (Exception e) {
            store.remove(to);
            throw new IllegalStateException("문자 발송 서버 연결에 실패했습니다: " + e.getMessage());
        }
    }

    // 2. 인증번호 검증
    public boolean verifyCode(String rawPhone, String inputCode) {
        String to = digitsOnly(rawPhone);
        String code = inputCode == null ? "" : inputCode.trim();

        VerificationEntry entry = store.get(to);
        if (entry == null) {
            throw new IllegalArgumentException("먼저 인증번호 발송을 요청해 주세요.");
        }
        if (Instant.now().isAfter(entry.expiresAt)) {
            store.remove(to);
            throw new IllegalArgumentException("인증번호 유효시간(3분)이 만료되었습니다. 다시 발송해 주세요.");
        }
        if (!entry.code.equals(code)) {
            throw new IllegalArgumentException("인증번호가 일치하지 않습니다.");
        }

        entry.verified = true;
        return true;
    }

    public boolean isVerified(String rawPhone) {
        VerificationEntry entry = store.get(digitsOnly(rawPhone));
        return entry != null && entry.verified;
    }

    private String digitsOnly(String str) {
        return str == null ? "" : str.replaceAll("\\D", "");
    }

    // Solapi REST API v4 HMAC-SHA256 Authorization 헤더 생성
    private String buildHmacAuthHeader(String key, String secret) {
        try {
            String date = Instant.now().truncatedTo(ChronoUnit.MILLIS).toString();
            String salt = UUID.randomUUID().toString().replace("-", "");
            String data = date + salt;

            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            String signature = HexFormat.of().formatHex(rawHmac);

            return String.format("HMAC-SHA256 apiKey=%s, date=%s, salt=%s, signature=%s", key, date, salt, signature);
        } catch (Exception e) {
            throw new IllegalStateException("Solapi HMAC 서명 생성 실패", e);
        }
    }
}
