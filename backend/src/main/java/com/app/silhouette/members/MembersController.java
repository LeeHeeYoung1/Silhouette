
package com.app.silhouette.members;

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

    public MembersController(MembersServices service) {
        this.service = service;
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
    
}
