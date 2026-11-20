package com.app.silhouette.live;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.Storage;

import livekit.LivekitWebhook.WebhookEvent;

@Service
public class LiveService {

	// TITLE은 VARCHAR2(100) 바이트 → 한글 3바이트 기준 30자
	private static final int TITLE_MAX = 30;
	// DESCRIPTION은 VARCHAR2(1000) 바이트 → 한글 기준 300자
	private static final int DESCRIPTION_MAX = 300;
	private static final int HASHTAG_MAX_COUNT = 5;
	private static final int HASHTAG_MAX_LENGTH = 10;
	private static final int PAGE_SIZE = 20;
	private static final Set<String> CATEGORIES =
			Set.of("TALK", "MUKBANG", "MUSIC", "TRAVEL", "STUDY", "ETC");

	// 방송자가 끊긴 뒤 이 시간이 지나면 TIMEOUT 종료
	static final int DISCONNECT_TIMEOUT_SECONDS = 30;
	// 방송 시작 직후 LiveKit 접속 전까지 기다려주는 시간
	private static final long CONNECT_GRACE_MILLIS = 15_000;

	// 썸네일은 GCS의 이 폴더 아래에만 저장
	private static final String THUMBNAIL_DIR = "live/";

	private final LiveDAO dao;
	private final LiveKitTokenService tokenService;
	private final LiveKitRoomService roomService;
	private final SimpMessagingTemplate messagingTemplate;
	private final TransactionTemplate tx;
	private final Storage storage;

	@Value("${livekit.url}")
	private String livekitUrl;

	@Value("${gcp.bucket}")
	private String bucket;

	@Value("${live.max-viewers:50}")
	private int maxViewers;

	LiveService(LiveDAO dao, LiveKitTokenService tokenService, LiveKitRoomService roomService,
			SimpMessagingTemplate messagingTemplate, PlatformTransactionManager txManager,
			Storage storage) {
		this.dao = dao;
		this.tokenService = tokenService;
		this.roomService = roomService;
		this.messagingTemplate = messagingTemplate;
		this.tx = new TransactionTemplate(txManager);
		this.storage = storage;
	}

	// ========================= 방송 시작 =========================

	// → { live_room_seq, token, url }
	public Map<String, Object> start(String loginId, LiveRoomDTO req) {
		long me = getMemberSeq(loginId);

		LiveRoomDTO room = new LiveRoomDTO();
		room.setHost_seq(me);
		room.setTitle(validateTitle(req.getTitle()));
		room.setDescription(validateDescription(req.getDescription()));
		room.setCategory(validateCategory(req.getCategory()));
		room.setThumbnail_url(validateThumbnail(req.getThumbnail_url()));
		List<String> tags = normalizeHashtags(req.getHashtags());

		// 이전 방송이 제대로 안 끝났으면(창 닫기 등) 정리
		LiveRoomDTO prev = dao.selectMyOnAir(me);
		if (prev != null) {
			endIfAbandoned(prev, me);
		}

		try {
			tx.executeWithoutResult(status -> {
				dao.insertLiveRoom(room);
				for (String tag : tags) {
					dao.insertHashtag(room.getLive_room_seq(), tag);
				}
			});
		} catch (DuplicateKeyException e) {
			// UX_LIVE_ROOM_ONAIR: 한 회원당 LIVE 방송 1개
			throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 방송 중입니다.");
		}

		long seq = room.getLive_room_seq();
		String token = tokenService.createToken(
				LiveKitRoomService.roomName(seq), me, displayName(me, loginId), true);

		Map<String, Object> result = new HashMap<>();
		result.put("live_room_seq", seq);
		result.put("token", token);
		result.put("url", livekitUrl);
		return result;
	}

	// 방송자가 LiveKit에 없고 시작한 지 좀 지났으면 버려진 방송으로 보고 종료
	private void endIfAbandoned(LiveRoomDTO prev, long me) {
		long seq = prev.getLive_room_seq();
		boolean justStarted = prev.getStarted_at() != null
				&& System.currentTimeMillis() - prev.getStarted_at().getTime() < CONNECT_GRACE_MILLIS;
		Boolean connected = roomService.isConnected(LiveKitRoomService.roomName(seq), String.valueOf(me));

		if (Boolean.FALSE.equals(connected) && !justStarted) {
			endLive(seq, "TIMEOUT", null);
			return;
		}
		throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 방송 중입니다.");
	}

	// ========================= 시청 입장 =========================

	// → { token, url, room }
	public Map<String, Object> join(String loginId, long liveRoomSeq) {
		long me = getMemberSeq(loginId);
		LiveRoomDTO room = getOnAirRoom(liveRoomSeq);

		if (room.getHost_seq() == me) {
			// 같은 identity로 들어가면 LiveKit이 방송자 연결을 끊어버림
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "내 방송은 시청할 수 없어요.");
		}
		if (dao.isKicked(liveRoomSeq, me)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "강퇴되어 이 방송에 입장할 수 없어요.");
		}
		if (dao.isBanned(room.getHost_seq(), me)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "방송자에 의해 입장이 제한되었어요.");
		}
		if (dao.countActiveViewers(liveRoomSeq) >= maxViewers) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "시청 인원이 가득 찼어요.");
		}

		room.setHashtags(dao.selectHashtags(liveRoomSeq));
		String token = tokenService.createToken(
				LiveKitRoomService.roomName(liveRoomSeq), me, displayName(me, loginId), false);

		Map<String, Object> result = new HashMap<>();
		result.put("token", token);
		result.put("url", livekitUrl);
		result.put("room", room);
		return result;
	}

	// ========================= 조회 =========================

	public List<LiveRoomDTO> list(String keyword, String category, int page) {
		Map<String, Object> params = new HashMap<>();
		params.put("keyword", keyword == null || keyword.isBlank() ? null : keyword.trim());
		params.put("category", category == null || category.isBlank() ? null : validateCategory(category));
		int p = Math.max(page, 1);
		params.put("startRow", (p - 1) * PAGE_SIZE);
		params.put("endRow", p * PAGE_SIZE);

		List<LiveRoomDTO> list = dao.selectLiveList(params);
		for (LiveRoomDTO room : list) {
			String text = room.getHashtag_text();
			room.setHashtags(text == null ? List.of() : Arrays.asList(text.split(",")));
			room.setHashtag_text(null);
		}
		return list;
	}

	public LiveRoomDTO detail(long liveRoomSeq) {
		LiveRoomDTO room = dao.selectLiveRoom(liveRoomSeq);
		if (room == null) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "없는 방송이에요.");
		}
		room.setHashtags(dao.selectHashtags(liveRoomSeq));
		return room;
	}

	// ========================= 종료 =========================

	// 방송자 종료
	public void endByHost(String loginId, long liveRoomSeq) {
		long me = getMemberSeq(loginId);
		LiveRoomDTO room = dao.selectLiveRoom(liveRoomSeq);
		if (room == null) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "없는 방송이에요.");
		}
		checkHost(room, me);
		endLive(liveRoomSeq, "HOST", null);   // 이미 종료된 방송이면 그냥 통과
	}

	// 방송 종료 공통 처리 (HOST / TIMEOUT / ADMIN)
	// 실제로 종료했으면 true, 이미 종료돼 있었으면 false
	public boolean endLive(long liveRoomSeq, String endedBy, String endReason) {
		LiveRoomDTO room = dao.selectLiveRoom(liveRoomSeq);
		if (room == null) {
			return false;
		}

		// ① ~ ③ DB 처리는 한 트랜잭션
		Boolean ended = tx.execute(status -> {
			if (dao.endLiveRoom(liveRoomSeq, endedBy, endReason) == 0) {
				return false;   // 다른 곳에서 먼저 종료함
			}
			dao.closeAllViewers(liveRoomSeq);
			dao.deleteChatsExceptReported(liveRoomSeq);
			return true;
		});
		if (!Boolean.TRUE.equals(ended)) {
			return false;
		}

		// ④ ~ ⑥ 외부 처리는 커밋 후 (실패해도 방송 종료 자체는 유지)
		deleteThumbnail(room.getThumbnail_url());
		messagingTemplate.convertAndSend("/sub/live/" + liveRoomSeq,
				LiveMessageDTO.of("END", liveRoomSeq, endedBy));
		roomService.deleteRoom(LiveKitRoomService.roomName(liveRoomSeq));
		return true;
	}

	// 끊긴 지 30초 넘은 방송 정리 (LiveScheduler에서 호출)
	public void endTimedOutLives() {
		for (Long seq : dao.selectTimedOutRooms(DISCONNECT_TIMEOUT_SECONDS)) {
			endLive(seq, "TIMEOUT", null);
		}
	}

	// ========================= LiveKit webhook =========================

	public void handleWebhook(WebhookEvent event) {
		String type = event.getEvent();
		if (!"participant_joined".equals(type) && !"participant_left".equals(type)) {
			return;
		}

		String roomName = event.getRoom().getName();
		Long liveRoomSeq = LiveKitRoomService.parseRoomName(roomName);
		Long memberSeq = parseIdentity(event.getParticipant().getIdentity());
		if (liveRoomSeq == null || memberSeq == null) {
			return;
		}

		LiveRoomDTO room = dao.selectLiveRoom(liveRoomSeq);
		if (room == null || !"LIVE".equals(room.getStatus())) {
			return;
		}
		boolean isHost = room.getHost_seq().longValue() == memberSeq;

		if ("participant_joined".equals(type)) {
			if (isHost) {
				dao.clearHostDisconnected(liveRoomSeq);     // 재접속 → 방송 이어감
				return;
			}
			// 토큰 발급 후 강퇴·차단된 경우 (토큰은 유효기간이 남아 있음)
			if (dao.isKicked(liveRoomSeq, memberSeq) || dao.isBanned(room.getHost_seq(), memberSeq)) {
				roomService.removeParticipant(roomName, String.valueOf(memberSeq));
				return;
			}
			// 같은 계정 재접속이면 이전 기록을 먼저 닫음
			tx.executeWithoutResult(status -> {
				dao.closeViewer(liveRoomSeq, memberSeq);
				dao.insertViewer(liveRoomSeq, memberSeq);
			});
			return;
		}

		// participant_left
		if (isHost) {
			dao.markHostDisconnected(liveRoomSeq);
			return;
		}
		// 다른 탭으로 재접속하면서 이전 연결이 끊긴 경우 → 새 연결이 살아 있으니 닫지 않음
		if (Boolean.TRUE.equals(roomService.isConnected(roomName, String.valueOf(memberSeq)))) {
			return;
		}
		dao.closeViewer(liveRoomSeq, memberSeq);
	}

	// ========================= 공통 =========================

	private LiveRoomDTO getOnAirRoom(long liveRoomSeq) {
		LiveRoomDTO room = dao.selectLiveRoom(liveRoomSeq);
		if (room == null || !"LIVE".equals(room.getStatus())) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "종료되었거나 없는 방송이에요.");
		}
		return room;
	}

	// 방송자 전용 기능은 항상 서버에서 HOST_SEQ 확인
	private void checkHost(LiveRoomDTO room, long me) {
		if (room.getHost_seq().longValue() != me) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "방송자만 할 수 있어요.");
		}
	}

	private long getMemberSeq(String loginId) {
		Long seq = loginId == null ? null : dao.selectMemberSeqByLoginId(loginId);
		if (seq == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "회원 정보를 찾을 수 없어요.");
		}
		return seq;
	}

	private String displayName(long memberSeq, String loginId) {
		String nickname = dao.selectNickname(memberSeq);
		return nickname == null || nickname.isBlank() ? loginId : nickname;
	}

	private static Long parseIdentity(String identity) {
		try {
			return Long.valueOf(identity);
		} catch (NumberFormatException e) {
			return null;
		}
	}

	// ----- 입력값 검증 -----

	private static String validateTitle(String title) {
		if (title == null || title.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "방송 제목을 입력해주세요.");
		}
		title = title.trim();
		if (title.length() > TITLE_MAX) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "방송 제목은 30자까지 가능해요.");
		}
		return title;
	}

	private static String validateDescription(String description) {
		if (description == null || description.isBlank()) {
			return null;
		}
		description = description.trim();
		if (description.length() > DESCRIPTION_MAX) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "방송 설명은 300자까지 가능해요.");
		}
		return description;
	}

	private static String validateCategory(String category) {
		if (category == null || category.isBlank()) {
			return "ETC";
		}
		String c = category.trim().toUpperCase();
		if (!CATEGORIES.contains(c)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "올바르지 않은 카테고리예요.");
		}
		return c;
	}

	// '#' 제거, 공백 제거, 중복 제거 후 5개·10자 제한
	private static List<String> normalizeHashtags(List<String> raw) {
		if (raw == null) {
			return List.of();
		}
		Set<String> tags = new LinkedHashSet<>();
		for (String t : raw) {
			if (t == null) continue;
			String tag = t.replace("#", "").replaceAll("\\s+", "");
			if (tag.isEmpty()) continue;
			if (tag.length() > HASHTAG_MAX_LENGTH) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "해시태그는 10자까지 가능해요.");
			}
			if (tag.contains(",")) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "해시태그에 쉼표는 쓸 수 없어요.");
			}
			tags.add(tag);
		}
		if (tags.size() > HASHTAG_MAX_COUNT) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "해시태그는 5개까지 가능해요.");
		}
		return new ArrayList<>(tags);
	}

	// 우리 버킷의 썸네일 폴더 주소만 허용
	private String validateThumbnail(String url) {
		if (url == null || url.isBlank()) {
			return null;
		}
		if (!url.startsWith(thumbnailPrefix())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "올바르지 않은 썸네일 주소예요.");
		}
		return url;
	}

	private String thumbnailPrefix() {
		return "https://storage.googleapis.com/" + bucket + "/" + THUMBNAIL_DIR;
	}

	private void deleteThumbnail(String url) {
		if (url == null || !url.startsWith(thumbnailPrefix())) {
			return;
		}
		String objectName = url.substring(("https://storage.googleapis.com/" + bucket + "/").length());
		try {
			storage.delete(BlobId.of(bucket, objectName));
		} catch (Exception e) {
			// 썸네일 삭제 실패는 방송 종료에 영향 주지 않음
		}
	}
}
