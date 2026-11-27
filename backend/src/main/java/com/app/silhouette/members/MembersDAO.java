package com.app.silhouette.members;

import java.util.HashMap;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class MembersDAO {

    private final SqlSessionTemplate mybatis;

    MembersDAO(SqlSessionTemplate mybatis) {
        this.mybatis = mybatis;
    }

    // 회원가입
    public int insert(MembersDTO dto) {
        return this.mybatis.insert("Members.insert", dto);
    }

    // 아이디 중복 확인
    public int idCheck(String login_Id) {
        return this.mybatis.selectOne("Members.idCheck", login_Id);
    }

    // 닉네임 중복 확인
    public int nicknameCheck(String nickname) {
        return this.mybatis.selectOne("Members.nicknameCheck", nickname);
    }
    
 // 로그인
    public int login(String id, String password) {
        Map<String, String> user = new HashMap<>();
        user.put("id", id);
        user.put("password", password);

        return this.mybatis.selectOne("Members.login", user);
    }

    // 회원 권한 조회
    public String selectRole(String loginId) {
        return this.mybatis.selectOne("Members.selectRole", loginId);
    }

    // 아이디 찾기 (이름 + 휴대폰 번호)
    public String findLoginIdByInfo(String name, String phone) {
        Map<String, String> params = new HashMap<>();
        params.put("name", name);
        params.put("phone", phone);
        return this.mybatis.selectOne("Members.findLoginIdByInfo", params);
    }

    // 비밀번호 찾기 회원 일치 확인 (아이디 + 이름 + 휴대폰 번호)
    public int countMemberForPasswordReset(String loginId, String name, String phone) {
        Map<String, String> params = new HashMap<>();
        params.put("loginId", loginId);
        params.put("name", name);
        params.put("phone", phone);
        return this.mybatis.selectOne("Members.countMemberForPasswordReset", params);
    }

    // 비밀번호 재설정
    public int updatePasswordByInfo(String loginId, String name, String phone, String encryptedPassword) {
        Map<String, String> params = new HashMap<>();
        params.put("loginId", loginId);
        params.put("name", name);
        params.put("phone", phone);
        params.put("password", encryptedPassword);
        return this.mybatis.update("Members.updatePasswordByInfo", params);
    }
}