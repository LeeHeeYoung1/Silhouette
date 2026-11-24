package com.app.silhouette.live;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

// 신고 + 관리자 기능 (신고 목록, 처리 완료, 방송 강제 종료)
@Service
public class LiveReportService {

    private static final Set<String> REASONS = Set.of("ADULT", "ABUSE", "SPAM", "ETC");
    // DETAIL, END_REASON은 VARCHAR2(500) 바이트 → 한글 기준 150자
    private static final int TEXT_MAX = 150;
    private static final int PAGE_SIZE = 20;

    private final LiveDAO dao;
    private final LiveService liveService;

    public LiveReportService(LiveDAO dao, LiveService liveService) {
        this.dao = dao;
        this.liveService = liveService;
    }

    // ========================= 신고 =========================

    // body: { liveChatSeq(채팅 신고일 때만), reason, detail }
    public void report(String loginId, long liveRoomSeq, LiveReportDTO req) {
        Long me = loginId == null ? null : dao.selectMemberSeqByLoginId(loginId);
        if (me == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "회원 정보를 찾을 수 없어요.");
        }

        LiveRoomDTO room = dao.selectLiveRoom(liveRoomSeq);
        if (room == null || !"LIVE".equals(room.getStatus())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "종료되었거나 없는 방송이에요.");
        }

        String reason = req.getReason() == null ? "" : req.getReason().trim().toUpperCase();
        if (!REASONS.contains(reason)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "신고 사유를 선택해주세요.");
        }
        String detail = trimToNull(req.getDetail());
        if ("ETC".equals(reason) && detail == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "기타 사유를 입력해주세요.");
        }
        if (detail != null && detail.length() > TEXT_MAX) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "신고 내용은 150자까지 가능해요.");
        }

        Long chatSeq = req.getLiveChatSeq();
        if (chatSeq == null) {
            if (room.getHostSeq().longValue() == me) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "내 방송은 신고할 수 없어요.");
            }
        } else {
            LiveMessageDTO chat = dao.selectChat(chatSeq);
            if (chat == null || chat.getLiveRoomSeq().longValue() != liveRoomSeq) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "없는 채팅이에요.");
            }
            if (chat.getMemberSeq().longValue() == me) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "내 채팅은 신고할 수 없어요.");
            }
        }

        if (dao.hasPendingReport(liveRoomSeq, chatSeq, me)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 신고했어요. 처리 결과를 기다려주세요.");
        }

        LiveReportDTO report = new LiveReportDTO();
        report.setLiveRoomSeq(liveRoomSeq);
        report.setLiveChatSeq(chatSeq);
        report.setReporterSeq(me);
        report.setReason(reason);
        report.setDetail(detail);
        dao.insertReport(report);
    }

    // ========================= 관리자 =========================

    // status: WAIT / DONE / null(전체)
    public List<LiveReportDTO> reports(String loginId, String status, int page) {
        checkAdmin(loginId);
        Map<String, Object> params = new HashMap<>();
        String s = status == null || status.isBlank() ? null : status.trim().toUpperCase();
        if (s != null && !s.equals("WAIT") && !s.equals("DONE")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "올바르지 않은 상태값이에요.");
        }
        int p = Math.max(page, 1);
        params.put("status", s);
        params.put("startRow", (p - 1) * PAGE_SIZE);
        params.put("endRow", p * PAGE_SIZE);
        return dao.selectReports(params);
    }

    public void done(String loginId, long liveReportSeq) {
        checkAdmin(loginId);
        if (dao.updateReportDone(liveReportSeq) == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "없거나 이미 처리된 신고예요.");
        }
    }

    // 관리자 강제 종료 → 해당 방송의 대기 중 신고도 처리 완료
    public void forceEnd(String loginId, long liveRoomSeq, String endReason) {
        checkAdmin(loginId);
        String reason = trimToNull(endReason);
        if (reason != null && reason.length() > TEXT_MAX) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "종료 사유는 150자까지 가능해요.");
        }
        if (dao.selectLiveRoom(liveRoomSeq) == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "없는 방송이에요.");
        }
        if (!liveService.endLive(liveRoomSeq, "ADMIN", reason)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 종료된 방송이에요.");
        }
        dao.updateReportsDoneByRoom(liveRoomSeq);
    }

    private void checkAdmin(String loginId) {
        if (loginId == null || !dao.isAdmin(loginId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "관리자만 사용할 수 있어요.");
        }
    }

    private static String trimToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
