package com.app.silhouette.friend;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class MemberFriendDAO {

    private final SqlSessionTemplate mybatis;

    public MemberFriendDAO(SqlSessionTemplate mybatis) {
        this.mybatis = mybatis;
    }

    public List<MemberFriendDTO> selectFriendList(Long memberSeq) {
        return mybatis.selectList("MemberFriend.selectFriendList", memberSeq);
    }

    public List<MemberFriendDTO> searchAcceptedFriends(String keyword, Long memberSeq) {
        Map<String, Object> param = new HashMap<>();
        param.put("keyword", keyword);
        param.put("memberSeq", memberSeq);

        return mybatis.selectList("MemberFriend.searchAcceptedFriends", param);
    }

    public int isAcceptedFriend(Long memberSeq, Long friendSeq) {
        Map<String, Object> param = new HashMap<>();
        param.put("memberSeq", memberSeq);
        param.put("friendSeq", friendSeq);

        return mybatis.selectOne("MemberFriend.isAcceptedFriend", param);
    }
}