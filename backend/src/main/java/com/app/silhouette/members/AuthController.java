package com.app.silhouette.members;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.app.silhouette.commons.JwtUtil;
import com.app.silhouette.utils.SHA512;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final JwtUtil jwt;
    private final MembersServices mServ;

    public AuthController(JwtUtil jwt, MembersServices mServ) {
        this.jwt = jwt;
        this.mServ = mServ;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody Map<String, String> user) throws Exception {

        String id = user.get("id");
        String pw = user.get("pw");
        String password = SHA512.encrypt(pw);

        int result1 = mServ.login(id, password);

        if (result1 == 1) {

            Map<String, String> result = new HashMap<>();
            String token = this.jwt.createToken(id);

            result.put("token", token);
            result.put("id", id);

            return ResponseEntity.ok(result);
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
    }
}