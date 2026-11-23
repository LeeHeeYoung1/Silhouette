package com.app.silhouette.event;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EventSpecialService {
	
	private final EventSpecialDAO eventSpecialDao;

    private static final int[] ROULETTE_REWARDS = {10, 20, 30, 50, 100};
    private static final String[] LOVE_FORTUNES = {
        "오늘은 먼저 건넨 가벼운 인사가 뜻밖의 깊은 대화로 이어지는 날이에요.",
        "솔직한 감정 표현이 상대방의 마음을 무장해제시키는 행운의 하루입니다.",
        "예상치 못한 공통점을 발견하며 급속도로 가까워질 인연이 기다리고 있어요.",
        "망설이던 블라인드 매칭 버튼을 눌러보세요. 대화 코드가 찰떡인 상대를 만날 운세입니다.",
        "작은 배려와 다정한 리액션이 오늘 당신의 매력을 200% 끌어올려 줍니다."
    };

    public EventSpecialService(EventSpecialDAO eventSpecialDao) {
        this.eventSpecialDao = eventSpecialDao;
    }

    @Transactional
    public Map<String, Object> spinDailyRoulette(Long memberSeq) {
        if (memberSeq == null) {
            throw new IllegalArgumentException("회원 번호가 누락되었습니다.");
        }
        if (eventSpecialDao.hasPlayedTodayRoulette(memberSeq)) {
            throw new IllegalStateException("오늘의 행운 룰렛은 이미 참여했습니다. 내일 다시 도전해 주세요!");
        }

        // 가중치 추첨 (10M: 35%, 20M: 30%, 30M: 20%, 50M: 10%, 100M: 5%)
        int roll = ThreadLocalRandom.current().nextInt(100);
        int rewardMileage;
        if (roll < 35) rewardMileage = ROULETTE_REWARDS[0];
        else if (roll < 65) rewardMileage = ROULETTE_REWARDS[1];
        else if (roll < 85) rewardMileage = ROULETTE_REWARDS[2];
        else if (roll < 95) rewardMileage = ROULETTE_REWARDS[3];
        else rewardMileage = ROULETTE_REWARDS[4];

        String fortune = LOVE_FORTUNES[ThreadLocalRandom.current().nextInt(LOVE_FORTUNES.length)];

        int currentMileage = eventSpecialDao.selectLatestMileageBalance(memberSeq);
        int nextMileage = currentMileage + rewardMileage;

        eventSpecialDao.insertMileageLedger(
            memberSeq,
            "EVENT_ROULETTE",
            rewardMileage,
            nextMileage,
            "오늘의 연애운 럭키 룰렛 당첨 (+" + rewardMileage + "M)"
        );

        Map<String, Object> result = new HashMap<>();
        result.put("rewardMileage", rewardMileage);
        result.put("currentMileage", nextMileage);
        result.put("fortune", fortune);
        return result;
    }
    
    @Transactional(readOnly = true)
    public Map<String, Boolean> getQuestStatus(Long memberSeq) {
        return eventSpecialDao.selectQuestStatus(memberSeq);
    }

    @Transactional
    public Map<String, Object> claimAllTestsReward(Long memberSeq) {
        if (memberSeq == null) {
            throw new IllegalArgumentException("회원 번호가 누락되었습니다.");
        }
        String sourceType = "EVENT_ALL_TESTS";

        if (eventSpecialDao.hasClaimedTicketEvent(memberSeq, sourceType)) {
            throw new IllegalStateException("이미 3종 성향 테스트 올클리어 보상을 수령했습니다.");
        }
        if (!eventSpecialDao.hasCompletedAllThreeTests(memberSeq)) {
            throw new IllegalStateException("음식 취향·연애 가치관·MBTI 테스트 3가지를 모두 완료해야 보상을 받을 수 있습니다.");
        }

        int currentTicket = eventSpecialDao.selectLatestTicketBalance(memberSeq);
        int nextTicket = currentTicket + 1;

        eventSpecialDao.insertTicketLedger(
            memberSeq,
            sourceType,
            1,
            nextTicket,
            "연애 성향 테스트 3종 올클리어 달성 보상 (이용권 1장)"
        );

        Map<String, Object> result = new HashMap<>();
        result.put("currentTicket", nextTicket);
        result.put("message", "성향 테스트 3종 올클리어 달성! 무료 매칭 이용권 1장이 지급되었습니다. 🎉");
        return result;
    }
    
    @Transactional
    public Map<String, Object> claimFirstBlindChatReward(Long memberSeq) {
        if (memberSeq == null) {
            throw new IllegalArgumentException("회원 번호가 누락되었습니다.");
        }
        String sourceType = "EVENT_FIRST_CHAT";

        if (eventSpecialDao.hasClaimedMileageEvent(memberSeq, sourceType)) {
            throw new IllegalStateException("이미 첫 블라인드 채팅 보상을 수령했습니다.");
        }
        if (!eventSpecialDao.hasCompletedBlindChat(memberSeq)) {
            throw new IllegalStateException("NO_CHAT_HISTORY");
        }

        int rewardMileage = 50;
        int currentMileage = eventSpecialDao.selectLatestMileageBalance(memberSeq);
        int nextMileage = currentMileage + rewardMileage;

        eventSpecialDao.insertMileageLedger(
            memberSeq,
            sourceType,
            rewardMileage,
            nextMileage,
            "첫 블라인드 채팅 완주 보너스 (+50M)"
        );

        Map<String, Object> result = new HashMap<>();
        result.put("currentMileage", nextMileage);
        result.put("message", "첫 블라인드 채팅 완주 보너스 50M이 지급되었습니다! 🎉");
        return result;
    }
    
    
}
