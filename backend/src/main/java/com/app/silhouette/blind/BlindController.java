package com.app.silhouette.blind;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/blind")
public class BlindController {
	
	private static final Logger log = LoggerFactory.getLogger(BlindController.class);
	private final BlindService blindService;
	
	public BlindController(BlindService blindService) {
		this.blindService = blindService;
	}
	
	@MessageMapping("/match/join")
	public void joinMatch(@Payload Map<String, Object> payload, @Header("simpSessionId") String sessionId) {
		System.out.println("컨트롤러까지 옴");
		log.info("블라인드 매칭 요청 수신 - payload: {}, sessionId: {}", payload, sessionId);
		if (payload != null && payload.containsKey("id")) {
			String userId = String.valueOf(payload.get("id"));
			blindService.joinQueue(userId, sessionId);
		}
	}
	
	@MessageMapping("/match/cancel")
	public void cancelMatch(@Payload Map<String, Object> payload, @Header("simpSessionId") String sessionId) {
		log.info("블라인드 매칭 취소 수신 - payload: {}, sessionId: {}", payload, sessionId);
		if (payload != null && payload.containsKey("id")) {
			String userId = String.valueOf(payload.get("id"));
			blindService.cancelQueue(userId, sessionId);
		} else {
			blindService.cancelQueueBySession(sessionId);
		}
	}
	
	@MessageMapping("/blind/chat/{roomSeq}")
	public void sendBlindMessage (@DestinationVariable("roomSeq") Long roomSeq,
									@Payload BlindChatMessageDTO messageDto) {
		messageDto.setBlindChatRoomSeq(roomSeq);
		blindService.sendChatMessage(roomSeq, messageDto);
		
	}
	
	
	
	
}
