
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

        if (!phoneAuthService.isVerified(dto.getPhone())) {
            return ResponseEntity.badRequest().body("휴대폰 본인인증을 먼저 완료해 주세요.");
        }

        int result = service.signup(dto);

        if (result > 0) {
            phoneAuthService.consumeVerification(dto.getPhone());
            return ResponseEntity.ok("회원가입 성공");
        }

        return ResponseEntity.badRequest().body("회원가입 실패");
    }

    @GetMapping("/idCheck")
    public ResponseEntity<Boolean> idCheck(@RequestParam String loginId) {

        boolean result = service.idCheck(loginId);

        return ResponseEntity.ok(result);
    }

    // 1. 공통 휴대폰 인증번호 발송 (회원가입 / 회원탈퇴 등)
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

    // 2. 공통 휴대폰 인증번호 검증 (회원가입 / 회원탈퇴 등)
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

    // 3. 아이디 찾기 - 회원 정보(이름 + 휴대폰 번호) 확인 후 인증번호 SMS 발송
    @PostMapping("/find-id/send")
    public ResponseEntity<Map<String, Object>> sendFindIdCode(@RequestBody Map<String, String> body) {
        try {
            String name = body.get("name");
            String phone = body.get("phone");

            String foundId = service.findLoginIdByInfo(name, phone);
            if (foundId == null || foundId.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "입력하신 이름 및 휴대폰 번호와 일치하는 회원이 없습니다."
                ));
            }

            phoneAuthService.sendVerificationSms(phone);
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

    // 4. 아이디 찾기 - 인증번호 검증 및 아이디 반환
    @PostMapping("/find-id/verify")
    public ResponseEntity<Map<String, Object>> verifyFindIdCode(@RequestBody Map<String, String> body) {
        try {
            String name = body.get("name");
            String phone = body.get("phone");
            String code = body.get("code");

            phoneAuthService.verifyCode(phone, code);
            String foundId = service.findLoginIdByInfo(name, phone);
            if (foundId == null || foundId.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "일치하는 회원 정보를 찾을 수 없습니다."
                ));
            }

            phoneAuthService.consumeVerification(phone);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "loginId", foundId,
                    "message", "본인인증이 완료되었습니다."
            ));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    // 5. 비밀번호 찾기 - 회원 정보(아이디 + 이름 + 휴대폰 번호) 확인 후 인증번호 SMS 발송
    @PostMapping("/find-pw/send")
    public ResponseEntity<Map<String, Object>> sendFindPwCode(@RequestBody Map<String, String> body) {
        try {
            String loginId = body.get("loginId");
            String name = body.get("name");
            String phone = body.get("phone");

            if (!service.existsForPasswordReset(loginId, name, phone)) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "입력하신 아이디, 이름 및 휴대폰 번호와 일치하는 회원이 없습니다."
                ));
            }

            phoneAuthService.sendVerificationSms(phone);
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

    // 6. 비밀번호 찾기 - 인증번호 검증
    @PostMapping("/find-pw/verify")
    public ResponseEntity<Map<String, Object>> verifyFindPwCode(@RequestBody Map<String, String> body) {
        try {
            String loginId = body.get("loginId");
            String name = body.get("name");
            String phone = body.get("phone");
            String code = body.get("code");

            if (!service.existsForPasswordReset(loginId, name, phone)) {
                return ResponseEntity.badRequest().body(Map.of(
                        "verified", false,
                        "message", "입력하신 정보와 일치하는 회원이 없습니다."
                ));
            }

            phoneAuthService.verifyCode(phone, code);
            return ResponseEntity.ok(Map.of(
                    "verified", true,
                    "message", "본인인증이 완료되었습니다. 새 비밀번호를 설정해 주세요."
            ));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "verified", false,
                    "message", e.getMessage()
            ));
        }
    }

    // 7. 비밀번호 찾기 - 본인인증 완료 후 새 비밀번호 재설정
    @PostMapping("/find-pw/reset")
    public ResponseEntity<Map<String, Object>> resetPassword(@RequestBody Map<String, String> body) {
        try {
            String loginId = body.get("loginId");
            String name = body.get("name");
            String phone = body.get("phone");
            String newPassword = body.get("newPassword");

            if (!phoneAuthService.isVerified(phone)) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "휴대폰 본인인증을 먼저 완료해 주세요."
                ));
            }

            if (newPassword == null || newPassword.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "새 비밀번호를 입력해 주세요."
                ));
            }

            int updated = service.resetPasswordByInfo(loginId, name, phone, newPassword);
            if (updated <= 0) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "비밀번호 변경 대상 회원 정보를 찾을 수 없습니다."
                ));
            }

            phoneAuthService.consumeVerification(phone);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인해 주세요."
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "비밀번호 재설정 중 오류가 발생했습니다: " + e.getMessage()
            ));
        }
    }

}
