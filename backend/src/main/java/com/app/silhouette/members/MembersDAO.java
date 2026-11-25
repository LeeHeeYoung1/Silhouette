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
}