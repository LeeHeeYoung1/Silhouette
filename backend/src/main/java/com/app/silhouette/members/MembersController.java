
package com.app.silhouette.members;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/members")
public class MembersController {

    private final MembersServices service;
    private final PhoneAuthService phoneAuthService;

    public MembersController(MembersServices service, PhoneAuthService phoneAuthService) {
        this.service = service;
        this.phoneAuthService = phoneAuthService;
    }

    @PostMapping("/signup")
    public ResponseEntity<String> signup(@RequestBody MembersDTO dto) throws Exception {

        int result = service.signup(dto);

        if (result > 0) {
            return ResponseEntity.ok("회원가입 성공");
        }

        return ResponseEntity.badRequest().body("회원가입 실패");
    }

    @GetMapping("/idCheck")
    public ResponseEntity<Boolean> idCheck(@RequestParam String loginId) {

        boolean result = service.idCheck(loginId);

        return ResponseEntity.ok(result);
    }

    @PostMapping("/phone/send")
    public ResponseEntity<Map<String, Object>> sendPhoneCode(@RequestBody Map<String, String> body) {
        try {
            phoneAuthService.sendVerificationSms(body.get("phone"));
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "인증번호가 발송되었습니다. (3분 이내 입력)"
            ));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/phone/verify")
    public ResponseEntity<Map<String, Object>> verifyPhoneCode(@RequestBody Map<String, String> body) {
        try {
            phoneAuthService.verifyCode(body.get("phone"), body.get("code"));
            return ResponseEntity.ok(Map.of(
                    "verified", true,
                    "message", "휴대폰 본인인증이 완료되었습니다."
            ));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "verified", false,
                    "message", e.getMessage()
            ));
        }
    }

}
