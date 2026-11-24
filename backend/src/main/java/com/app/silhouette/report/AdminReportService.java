package com.app.silhouette.report;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.app.silhouette.commons.AuthMemberDTO;
import com.app.silhouette.commons.AuthMemberService;

@Service
public class AdminReportService {

    private static final List<String> STATUSES = List.of("WAITING", "DONE", "REJECTED");
    private static final List<Integer> BLACKLIST_DAYS = List.of(0, 7, 30);   // 0 = 영구
    private static final int MAX_MEMO = 300;
    private static final int MAX_MEMO_BYTES = 1000;
    private static final int MAX_SIZE = 50;

    @Autowired
    private ReportDAO reportDAO;

    @Autowired
    private AuthMemberService authMemberService;

    /* ===================== 신고 목록 ===================== */
    public Map<String, Object> selectReports(String status, int page, int size, String authorization) {
        authMemberService.adminMember(authorization);   // 관리자만

        String st = (status == null || status.isBlank()) ? "WAITING" : status.trim().toUpperCase();
        if (!STATUSES.contains(st)) throw bad("상태 값이 올바르지 않아요.");

        int safeSize = Math.min(Math.max(size, 1), MAX_SIZE);
        int safePage = Math.max(page, 1);

        Map<String, Object> param = new HashMap<>();
        param.put("status", st);

        int totalCount = reportDAO.countAdminReports(param);
        int totalPages = Math.max(1, (int) Math.ceil((double) totalCount / safeSize));

        param.put("startRow", (safePage - 1) * safeSize);
        param.put("endRow", safePage * safeSize);

        Map<String, Object> result = new HashMap<>();
        result.put("list", reportDAO.selectAdminReports(param));
        result.put("totalCount", totalCount);
        result.put("totalPages", totalPages);
        result.put("page", safePage);
        return result;
    }

    /* ===================== 신고 처리 (반려 / 처리 완료) ===================== */
    @Transactional
    public void processReport(long reportSeq, ReportProcessDTO req, String authorization) {
        AuthMemberDTO admin = authMemberService.adminMember(authorization);
        if (req == null) throw bad("입력값이 없습니다.");

        ReportDTO report = reportDAO.selectReport(reportSeq);
        if (report == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "신고를 찾을 수 없어요.");
        if (!"WAITING".equals(report.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 처리된 신고예요.");
        }

        String action = req.getAction() == null ? "" : req.getAction().trim().toUpperCase();
        String memo = checkMemo(req.getAdminMemo());

        Map<String, Object> param = new HashMap<>();
        param.put("reportSeq", reportSeq);
        param.put("adminSeq", admin.getMemberSeq());
        param.put("adminMemo", memo);

        // ----- 반려 -----
        if ("REJECT".equals(action)) {
            param.put("status", "REJECTED");
            if (reportDAO.updateReportProcess(param) == 0) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 처리된 신고예요.");
            }
            return;
        }

        if (!"DONE".equals(action)) throw bad("처리 방법을 선택해 주세요.");

        // ----- 처리 완료 -----
        // ① 블랙리스트 지정 (먼저 검사해서 문제가 있으면 아무것도 안 바뀌게)
        if (Boolean.TRUE.equals(req.getBlacklist())) {
            addBlacklist(report, req, admin.getMemberSeq());
        }

        // ② 신고된 글·댓글 삭제
        if (Boolean.TRUE.equals(req.getDeleteTarget())) {
            if ("POST".equals(report.getTargetType())) {
                reportDAO.deletePostByAdmin(report.getTargetSeq());
            } else {
                reportDAO.deleteCommentByAdmin(report.getTargetSeq());     // 🔄 댓글 + 대댓글 삭제
                reportDAO.recountPostComments(report.getTargetSeq());      // 🔄 게시글 댓글 수 다시 세기
            }
        }

        // ③ 이 신고 처리 + 같은 글·댓글의 다른 대기 신고도 함께 처리
        param.put("status", "DONE");
        if (reportDAO.updateReportProcess(param) == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 처리된 신고예요.");
        }
        param.put("targetType", report.getTargetType());
        param.put("targetSeq", report.getTargetSeq());
        reportDAO.updateSameTargetReports(param);
    }

    /* ===================== 블랙리스트 목록 · 해제 ===================== */
    public Map<String, Object> selectBlacklist(boolean activeOnly, int page, int size, String authorization) {
        authMemberService.adminMember(authorization);

        int safeSize = Math.min(Math.max(size, 1), MAX_SIZE);
        int safePage = Math.max(page, 1);

        int totalCount = reportDAO.countBlacklist(activeOnly);
        int totalPages = Math.max(1, (int) Math.ceil((double) totalCount / safeSize));

        Map<String, Object> param = new HashMap<>();
        param.put("activeOnly", activeOnly);
        param.put("startRow", (safePage - 1) * safeSize);
        param.put("endRow", safePage * safeSize);

        Map<String, Object> result = new HashMap<>();
        result.put("list", reportDAO.selectBlacklist(param));
        result.put("totalCount", totalCount);
        result.put("totalPages", totalPages);
        result.put("page", safePage);
        return result;
    }

    @Transactional
    public void releaseBlacklist(long blacklistSeq, String authorization) {
        AuthMemberDTO admin = authMemberService.adminMember(authorization);

        Map<String, Object> param = new HashMap<>();
        param.put("blacklistSeq", blacklistSeq);
        param.put("adminSeq", admin.getMemberSeq());

        if (reportDAO.releaseBlacklist(param) == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 해제됐거나 없는 블랙리스트예요.");
        }
    }

    /* ===================== 도우미 ===================== */
    private void addBlacklist(ReportDTO report, ReportProcessDTO req, Long adminSeq) {
        Long memberSeq = report.getReportedSeq();

        String role = reportDAO.selectMemberRole(memberSeq);
        if ("ROLE_ADMIN".equals(role)) throw bad("관리자는 블랙리스트로 지정할 수 없어요.");

        if (reportDAO.countActiveBlacklist(memberSeq) > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 블랙리스트인 회원이에요. 해제 후 다시 지정해 주세요.");
        }

        Integer days = req.getBlacklistDays() == null ? 0 : req.getBlacklistDays();
        if (!BLACKLIST_DAYS.contains(days)) throw bad("기간은 7일, 30일, 영구 중에서 선택해 주세요.");

        String reason = checkMemo(req.getBlacklistReason());
        if (reason == null) reason = "신고 처리 (" + report.getReasonType() + ")";

        BlacklistDTO black = new BlacklistDTO();
        black.setMemberSeq(memberSeq);
        black.setAdminSeq(adminSeq);
        black.setReportSeq(report.getReportSeq());
        black.setReason(reason);
        black.setDays(days);
        reportDAO.insertBlacklist(black);
    }

    private String checkMemo(String memo) {
        String text = memo == null ? "" : memo.trim();
        if (text.isEmpty()) return null;
        if (text.length() > MAX_MEMO || text.getBytes(StandardCharsets.UTF_8).length > MAX_MEMO_BYTES) {
            throw bad("메모·사유는 " + MAX_MEMO + "자까지 입력할 수 있어요.");
        }
        return text;
    }

    private ResponseStatusException bad(String msg) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
    }
}