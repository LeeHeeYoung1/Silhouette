package com.app.silhouette.nearby;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class NearbyDAO {

    private static final String NS = "Nearby.";

    private final SqlSessionTemplate mybatis;

    NearbyDAO(SqlSessionTemplate mybatis) {
        this.mybatis = mybatis;
    }

    // 내 지역 ("서울 강남구"). 회원이 없거나 주소가 비어 있으면 null
    public String selectMyRegion(String loginId) {
        return mybatis.selectOne(NS + "selectMyRegion", loginId);
    }

    // 같은 시·군·구 → 같은 시·도 순으로, 각 그룹 안에서는 랜덤으로 최대 limit명
    public List<NearbyMemberDTO> selectNearbyMembers(String loginId, int limit) {
        Map<String, Object> param = new HashMap<>();
        param.put("loginId", loginId);
        param.put("limit", limit);
        return mybatis.selectList(NS + "selectNearbyMembers", param);
    }
}
