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

    // 아이디 찾기 (이름 + 휴대폰 번호)
    public String findLoginIdByInfo(String name, String phone) {
        return dao.findLoginIdByInfo(trim(name), trim(phone));
    }

    // 비밀번호 찾기 회원 일치 확인 (아이디 + 이름 + 휴대폰 번호)
    public boolean existsForPasswordReset(String loginId, String name, String phone) {
        return dao.countMemberForPasswordReset(trim(loginId), trim(name), trim(phone)) > 0;
    }

    // 비밀번호 재설정
    public int resetPasswordByInfo(String loginId, String name, String phone, String rawNewPassword) throws Exception {
        String encryptedPw = SHA512.encrypt(rawNewPassword);
        return dao.updatePasswordByInfo(trim(loginId), trim(name), trim(phone), encryptedPw);
    }

    private String trim(String str) {
        return str == null ? "" : str.trim();
    }
}