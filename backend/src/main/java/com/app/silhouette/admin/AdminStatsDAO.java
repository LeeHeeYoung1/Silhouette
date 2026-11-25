package com.app.silhouette.admin;

import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

@Repository
public class AdminStatsDAO {

    private static final String NS = "AdminStats.";

    @Autowired
    private SqlSessionTemplate sqlSession;

    public WeeklySummaryDTO selectWeeklySummary(Map<String, Object> param) {
        return sqlSession.selectOne(NS + "selectWeeklySummary", param);
    }

    public List<StatItemDTO> selectGenderRatio(Map<String, Object> param) {
        return sqlSession.selectList(NS + "selectGenderRatio", param);
    }

    public List<StatItemDTO> selectAgeRatio(Map<String, Object> param) {
        return sqlSession.selectList(NS + "selectAgeRatio", param);
    }

    public List<StatItemDTO> selectRegionRatio(Map<String, Object> param) {
        return sqlSession.selectList(NS + "selectRegionRatio", param);
    }

    public List<WeeklyTrendDTO> selectWeeklyTrend(Map<String, Object> param) {
        return sqlSession.selectList(NS + "selectWeeklyTrend", param);
    }
}