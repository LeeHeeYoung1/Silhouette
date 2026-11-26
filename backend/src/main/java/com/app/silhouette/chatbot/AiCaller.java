package com.app.silhouette.chatbot;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.google.genai.GoogleGenAiChatOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Gemini 호출 전담 클래스.
 * - 모델 목록(ai.models)을 순서대로 사용하고, 실패하거나 느리면 다음 모델도 같이 호출
 * - 한도 초과가 난 모델은 일정 시간 건너뜀
 * - 실패 원인별로 화면에 보여 줄 쉬운 안내 문구를 만듦
 */
@Component
public class AiCaller {

    /** 화면에 그대로 보여 줘도 되는 안내 문구를 담은 예외 */
    public static class AiException extends RuntimeException {
        private final String userMessage;

        public AiException(String userMessage, Throwable cause) {
            super(userMessage, cause);
            this.userMessage = userMessage;
        }

        public String getUserMessage() {
            return userMessage;
        }
    }

    private final ChatClient chatClient;
    private final List<String> models;
    private final long hedgeMs;
    private final long timeoutMs;

    // 공용 스레드가 아닌 전용 스레드 풀 (느린 AI 호출이 다른 요청을 막지 않게)
    private final ExecutorService pool = Executors.newFixedThreadPool(8);
    private final ScheduledExecutorService timer = Executors.newSingleThreadScheduledExecutor();

    // 모델별로 "언제까지 건너뛸지" 기억
    private final Map<String, Long> skipUntil = new ConcurrentHashMap<>();

    public AiCaller(ChatClient.Builder builder,
                    @Value("${ai.models}") List<String> models,
                    @Value("${ai.hedge-ms:8000}") long hedgeMs,
                    @Value("${ai.timeout-ms:20000}") long timeoutMs) {
        this.chatClient = builder.build();
        this.models = models;
        this.hedgeMs = hedgeMs;
        this.timeoutMs = timeoutMs;
        System.out.println("[AI] 사용할 모델 목록: " + models);
    }

    public String call(String system, String user) {
        List<String> candidates = availableModels();
        int total = candidates.size();

        CompletableFuture<String> winner = new CompletableFuture<>();
        AtomicInteger next = new AtomicInteger(0);
        AtomicInteger failed = new AtomicInteger(0);
        Runnable[] launch = new Runnable[1];

        launch[0] = () -> {
            int i = next.getAndIncrement();
            if (i >= total) {
                return;
            }
            String model = candidates.get(i);

            CompletableFuture.supplyAsync(() -> ask(model, system, user), pool)
                    .whenComplete((text, err) -> {
                        if (err == null) {
                            winner.complete(text);
                            return;
                        }
                        markCooldown(model, err);
                        System.out.println("[AI] " + model + " 실패: " + shortReason(err));
                        if (failed.incrementAndGet() >= total) {
                            winner.completeExceptionally(err);
                        } else {
                            launch[0].run(); // 실패하면 바로 다음 모델로
                        }
                    });
        };

        launch[0].run();
        // 첫 모델이 hedgeMs 안에 답이 없으면 다음 모델도 같이 호출
        timer.schedule(() -> {
            if (!winner.isDone()) {
                launch[0].run();
            }
        }, hedgeMs, TimeUnit.MILLISECONDS);

        try {
            return winner.get(timeoutMs, TimeUnit.MILLISECONDS);
        } catch (TimeoutException e) {
            throw new AiException("답변이 너무 오래 걸려요. 잠시 후 다시 시도해 주세요.", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new AiException("요청이 중단됐어요. 다시 시도해 주세요.", e);
        } catch (ExecutionException e) {
            throw new AiException(friendlyMessage(e.getCause()), e.getCause());
        }
    }

    private String ask(String model, String system, String user) {
        ChatResponse response = chatClient.prompt()
                .options(GoogleGenAiChatOptions.builder().model(model))
                .system(system)
                .user(user)
                .call()
                .chatResponse();

        if (response == null) {
            throw new IllegalStateException("EMPTY");
        }

        // 답이 여러 조각으로 올 수 있어 모든 조각의 글을 이어 붙임
        String text = response.getResults().stream()
                .map(g -> g.getOutput().getText())
                .filter(Objects::nonNull)
                .collect(Collectors.joining());

        if (text.isBlank()) {
            throw new IllegalStateException("EMPTY");
        }

        System.out.println("[AI] 사용 모델: " + response.getMetadata().getModel());
        return text;
    }

    private List<String> availableModels() {
        long now = System.currentTimeMillis();
        List<String> ok = models.stream()
                .filter(m -> skipUntil.getOrDefault(m, 0L) <= now)
                .collect(Collectors.toList());
        return ok.isEmpty() ? models : ok; // 전부 쉬는 중이어도 일단 시도
    }

    private void markCooldown(String model, Throwable err) {
        String msg = allMessages(err);
        long minutes;
        if (msg.contains("PerDay")) {
            minutes = 30;
        } else if (msg.contains("429") || msg.contains("RESOURCE_EXHAUSTED")) {
            minutes = 1;
        } else if (msg.contains("503") || msg.contains("UNAVAILABLE") || msg.contains("overloaded")) {
            minutes = 2;
        } else {
            return;
        }
        skipUntil.put(model, System.currentTimeMillis() + minutes * 60_000);
    }

    private String friendlyMessage(Throwable err) {
        String msg = allMessages(err);
        if (msg.contains("PerDay")) {
            return "오늘 챗봇 사용량이 가득 찼어요. 내일 다시 이용해 주세요.";
        }
        if (msg.contains("429") || msg.contains("RESOURCE_EXHAUSTED")) {
            return "지금 질문이 몰려 있어요. 1분 뒤에 다시 시도해 주세요.";
        }
        if (msg.contains("API key") || msg.contains("401") || msg.contains("403")) {
            return "챗봇 설정에 문제가 있어요. 관리자에게 문의해 주세요.";
        }
        if (msg.contains("EMPTY")) {
            return "답변을 만들지 못했어요. 질문을 조금 바꿔서 다시 시도해 주세요.";
        }
        return "챗봇 응답을 만들지 못했어요. 잠시 후 다시 시도해 주세요.";
    }

    // 로그에는 원인 한 줄만, API 키는 가려서 출력
    private String shortReason(Throwable err) {
        String msg = allMessages(err).replaceAll("AIza[0-9A-Za-z_-]+", "***");
        return msg.length() > 120 ? msg.substring(0, 120) : msg;
    }

    // 예외 체인 전체의 메시지를 이어 붙여 검사하기 쉽게 만듦
    private String allMessages(Throwable t) {
        StringBuilder sb = new StringBuilder();
        Throwable cur = t;
        int depth = 0;
        while (cur != null && depth < 10) {
            if (cur.getMessage() != null) {
                sb.append(cur.getMessage()).append(' ');
            }
            if (cur.getCause() == cur) {
                break;
            }
            cur = cur.getCause();
            depth++;
        }
        return sb.toString();
    }
}
 