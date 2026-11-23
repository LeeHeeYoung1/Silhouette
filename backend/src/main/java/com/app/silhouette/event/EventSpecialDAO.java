package com.app.silhouette.event;

import java.util.HashMap;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class EventSpecialDAO {
	
	private final SqlSessionTemplate mybatis;
    private static final String NAMESPACE = "EventSpecialMapper.";

    public EventSpecialDAO(SqlSessionTemplate mybatis) {
        this.mybatis = mybatis;
    }

    public boolean hasPlayedTodayRoulette(Long memberSeq) {
        Integer count = mybatis.selectOne(NAMESPACE + "countTodayRoulette", memberSeq);
        return count != null && count > 0;
    }

    public boolean hasClaimedTicketEvent(Long memberSeq, String sourceType) {
        Map<String, Object> params = new HashMap<>();
        params.put("memberSeq", memberSeq);
        params.put("sourceType", sourceType);
        Integer count = mybatis.selectOne(NAMESPACE + "countTicketEventReward", params);
        return count != null && count > 0;
    }

    public boolean hasCompletedAllThreeTests(Long memberSeq) {
        Integer food = mybatis.selectOne(NAMESPACE + "countFoodTest", memberSeq);
        Integer love = mybatis.selectOne(NAMESPACE + "countLoveValueTest", memberSeq);
        Integer mbti = mybatis.selectOne(NAMESPACE + "countMbtiTest", memberSeq);
        return (food != null && food > 0)
            && (love != null && love > 0)
            && (mbti != null && mbti > 0);
    }

    public int selectLatestMileageBalance(Long memberSeq) {
        Integer balance = mybatis.selectOne(NAMESPACE + "selectLatestMileageBalance", memberSeq);
        return balance != null ? balance : 0;
    }

    public int insertMileageLedger(Long memberSeq, String sourceType, int changeAmount, int balanceAfter, String description) {
        Map<String, Object> params = new HashMap<>();
        params.put("memberSeq", memberSeq);
        params.put("sourceType", sourceType);
        params.put("changeAmount", changeAmount);
        params.put("balanceAfter", balanceAfter);
        params.put("description", description);
        return mybatis.insert(NAMESPACE + "insertMileageLedger", params);
    }

    public int selectLatestTicketBalance(Long memberSeq) {
        Integer balance = mybatis.selectOne(NAMESPACE + "selectLatestTicketBalance", memberSeq);
        return balance != null ? balance : 0;
    }

    public int insertTicketLedger(Long memberSeq, String sourceType, int changeAmount, int balanceAfter, String description) {
        Map<String, Object> params = new HashMap<>();
        params.put("memberSeq", memberSeq);
        params.put("sourceType", sourceType);
        params.put("changeAmount", changeAmount);
        params.put("balanceAfter", balanceAfter);
        params.put("description", description);
        return mybatis.insert(NAMESPACE + "insertTicketLedger", params);
    }
    
    public Map<String, Boolean> selectQuestStatus(Long memberSeq) {
        Integer food = mybatis.selectOne(NAMESPACE + "countFoodTest", memberSeq);
        Integer love = mybatis.selectOne(NAMESPACE + "countLoveValueTest", memberSeq);
        Integer mbti = mybatis.selectOne(NAMESPACE + "countMbtiTest", memberSeq);

        Map<String, Boolean> map = new HashMap<>();
        map.put("foodDone", food != null && food > 0);
        map.put("loveValueDone", love != null && love > 0);
        map.put("mbtiDone", mbti != null && mbti > 0);
        map.put("rewardClaimed", hasClaimedTicketEvent(memberSeq, "EVENT_ALL_TESTS"));
        return map;
    }
    
    public boolean hasClaimedMileageEvent(Long memberSeq, String sourceType) {
        Map<String, Object> params = new HashMap<>();
        params.put("memberSeq", memberSeq);
        params.put("sourceType", sourceType);
        Integer count = mybatis.selectOne(NAMESPACE + "countMileageEventReward", params);
        return count != null && count > 0;
    }

    public boolean hasCompletedBlindChat(Long memberSeq) {
        Integer count = mybatis.selectOne(NAMESPACE + "countCompletedBlindChat", memberSeq);
        return count != null && count > 0;
    }
	
}
