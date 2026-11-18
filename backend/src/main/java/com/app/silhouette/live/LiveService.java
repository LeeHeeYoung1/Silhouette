package com.app.silhouette.live;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class LiveService {

	// TITLE은 VARCHAR2(100) 바이트 → 한글 3바이트 기준 30자
	private static final int TITLE_MAX = 30;

	private final LiveDAO dao;
	private final LiveKitTokenService tokenService;
	private final LiveKitRoomService roomService;

	@Value("${livekit.url}")
	private String livekitUrl;

	LiveService(LiveDAO dao, LiveKitTokenService tokenService, LiveKitRoomService roomService) {
		this.dao = dao;
		this.tokenService = tokenService;
		this.roomService = roomService;
	}

	// 방송 시작
	@Transactional
	public Map<String, Object> start(String loginId, String title) {
		int me = getMemberSeq(loginId);

		if (title == null || title.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "방송 제목을 입력해주세요.");
		}
		title = title.trim();
		if (title.length() > TITLE_MAX) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "방송 제목은 30자까지 가능해요.");
		}

		// 이전 방송이 제대로 안 끝났으면(창 닫기 등) 먼저 종료 처리
		dao.endMyLive(me);

		LiveDTO live = new LiveDTO();
		live.setMember_Seq(me);
		live.setTitle(title);
		live.setRoom_Name("live-" + loginId);

		try {
			dao.insertLive(live);
		} catch (DuplicateKeyException e) {
			// 탭 두 개에서 동시에 누른 경우 (UQ_LIVE_ONAIR 인덱스)
			throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 방송 중이에요.");
		}

		String token = tokenService.createToken(live.getRoom_Name(), loginId, true);
		return Map.of("live_Seq", live.getLive_Seq(), "token", token, "url", livekitUrl);
	}

	// 방송 종료
	public void end(String loginId) {
		dao.endMyLive(getMemberSeq(loginId));
	}

	// 방송 중인 목록 (방송자가 나간 유령 방송은 종료 처리하고 제외)
	public List<LiveDTO> list() {
		List<LiveDTO> result = new ArrayList<>();

		for (LiveDTO live : dao.selectOnAirList()) {
			Boolean connected = roomService.isHostConnected(live.getRoom_Name(), live.getLogin_Id());

			// 접속 중이거나 확인 실패 → 일단 보여줌
			if (connected == null || connected) {
				result.add(live);
				continue;
			}

			// 나갔음 → 종료 처리. 0건이면 방금 시작해서 아직 연결 중인 방송이라 보여줌
			if (dao.endGhostLive(live.getLive_Seq()) == 0) {
				result.add(live);
			}
		}
		return result;
	}

	// 시청 입장 토큰
	public Map<String, Object> watch(String loginId, int liveSeq) {
		int me = getMemberSeq(loginId);

		LiveDTO live = dao.selectOnAir(liveSeq);
		if (live == null) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "종료되었거나 없는 방송이에요.");
		}
		// 같은 아이디로 들어가면 LiveKit이 방송자 연결을 끊어버림
		if (live.getMember_Seq() == me) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "내 방송은 시청할 수 없어요.");
		}

		String token = tokenService.createToken(live.getRoom_Name(), loginId, false);
		return Map.of("token", token, "url", livekitUrl);
	}

	private int getMemberSeq(String loginId) {
		Integer seq = dao.selectMemberSeqByLoginId(loginId);
		if (seq == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "회원 정보를 찾을 수 없어요.");
		}
		return seq;
	}
}