package com.app.silhouette.members;

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
}