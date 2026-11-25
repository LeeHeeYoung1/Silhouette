package com.app.silhouette.members;

import org.springframework.stereotype.Service;

import com.app.silhouette.utils.SHA512;

@Service
public class MembersServices {

    private final MembersDAO dao;

    MembersServices(MembersDAO dao) {
        this.dao = dao;
    }

    // 아이디 중복 확인
    public boolean idCheck(String login_Id) {
        return dao.idCheck(login_Id) == 0;
    }

    // 회원가입
    public int signup(MembersDTO dto) throws Exception {

        String encryptPw = SHA512.encrypt(dto.getPassword());

        dto.setPassword(encryptPw);

        return dao.insert(dto);
    }
    
 // 로그인
    public int login(String id, String password) {
        return dao.login(id, password);
    }

    // 회원 권한 조회
    public String selectRole(String loginId) {
        return dao.selectRole(loginId);
    }
}