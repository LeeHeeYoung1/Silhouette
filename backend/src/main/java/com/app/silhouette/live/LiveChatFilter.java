package com.app.silhouette.live;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

// FILTER_WORD 금칙어를 메모리에 캐싱해서 채팅 내용을 *** 로 치환
// 서버 시작 시 1번 읽고, 관리자가 추가한 단어를 반영하도록 5분마다 다시 읽음
@Component
public class LiveChatFilter {

    private static final String MASK = "***";

    private final LiveDAO dao;
    private volatile Pattern pattern;   // 금칙어가 없으면 null

    public LiveChatFilter(LiveDAO dao) {
        this.dao = dao;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void init() {
        reload();
    }

    @Scheduled(fixedDelay = 300_000, initialDelay = 300_000)
    public void reload() {
        try {
            List<String> words = new ArrayList<>();
            for (String w : dao.selectFilterWords()) {
                if (w != null && !w.isBlank()) {
                    words.add(w.trim());
                }
            }
            // 긴 단어부터 매칭 (짧은 단어가 먼저 걸려서 일부만 가려지는 것 방지)
            words.sort(Comparator.comparingInt(String::length).reversed());
            pattern = words.isEmpty() ? null
                    : Pattern.compile(
                        words.stream().map(Pattern::quote).collect(Collectors.joining("|")),
                        Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
        } catch (Exception e) {
            // DB 조회 실패 시 기존 목록 유지
        }
    }

    public String apply(String text) {
        Pattern p = pattern;
        return p == null ? text : p.matcher(text).replaceAll(MASK);
    }
}
