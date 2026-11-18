package com.app.silhouette.blind;

import java.util.HashMap;
import java.util.Map;
import java.util.Queue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class BlindService {
	
	private static final Logger log = LoggerFactory.getLogger(BlindService.class);
	
	private final SimpMessagingTemplate messagingTemplate;
	private final Queue<String> matchingQueue = new ConcurrentLinkedQueue<>();
	private final Map<String, String> sessionUserMap = new ConcurrentHashMap<>();
	
	private BlindDAO blindDao;
	
	public BlindService(BlindDAO blindDao, SimpMessagingTemplate messagingTemplate) {
		this.blindDao = blindDao;
		this.messagingTemplate = messagingTemplate;
	}
	
	public void joinQueue(String id, String sessionId) {
		
		System.out.println("서비스까지 옴");
		log.info("매칭 큐 처리 시작 - 유저: {}, 세션: {}", id, sessionId);
		
		synchronized (matchingQueue) {
			if (!matchingQueue.contains(id)) {
				matchingQueue.offer(id);
				sessionUserMap.put(sessionId, id);
				log.info("매칭 큐 입장 완료 - 유저: {}, 대기열 크기: {}", id, matchingQueue.size());
			} else {
				log.info("이미 매칭 큐에 대기 중인 유저: {}", id);
			}
			
			// 2명 이상 대기 중이면 즉시 매칭 진행
			if (matchingQueue.size() >= 2) {
				String user1 = matchingQueue.poll();
				String user2 = matchingQueue.poll();
				
				Long chatRoomSeq = blindDao.createBlindChatRoom(user1, user2);
				
				log.info("🎉 블라인드 매칭 성공! user1: {}, user2: {}, chatRoomSeq: {}", user1, user2, chatRoomSeq);
				
				Map<String, Object> resultFor1 = new HashMap<>();
				resultFor1.put("status", "MATCHED");
				resultFor1.put("chatRoomSeq", chatRoomSeq);
				resultFor1.put("partnerId", user2);
				messagingTemplate.convertAndSend("/sub/user/" + user1 + "/match", (Object) resultFor1);
				
				Map<String, Object> resultFor2 = new HashMap<>();
				resultFor2.put("status", "MATCHED");
				resultFor2.put("chatRoomSeq", chatRoomSeq);
				resultFor2.put("partnerId", user1);
				messagingTemplate.convertAndSend("/sub/user/" + user2 + "/match", (Object) resultFor2);
			}
		}
	}
	
	public void joinQueue(Long id, String sessionId) {
		if (id != null) {
			joinQueue(String.valueOf(id), sessionId);
		}
	}
	
	public void cancelQueue(String id, String sessionId) {
		synchronized (matchingQueue) {
			matchingQueue.remove(id);
			if (sessionId != null) {
				sessionUserMap.remove(sessionId);
			}
			log.info("매칭 큐 퇴장(취소) 완료 - 유저: {}, 남은 대기열 크기: {}", id, matchingQueue.size());
		}
	}
	
	public void cancelQueueBySession(String sessionId) {
		String id = sessionUserMap.remove(sessionId);
		if (id != null) {
			cancelQueue(id, sessionId);
		}
	}
}
