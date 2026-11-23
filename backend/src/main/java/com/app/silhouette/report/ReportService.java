package com.app.silhouette.report;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.app.silhouette.commons.AuthMemberDTO;
import com.app.silhouette.commons.AuthMemberService;

@Service
public class ReportService {

    public static final List<String> TARGET_TYPES = List.of("POST", "COMMENT");
    public static final List<String> REASON_TYPES = List.of("SPAM", "ABUSE", "OBSCENE", "FRAUD", "PRIVACY", "ETC");

    private static final int MAX_DETAIL = 300;              // 상세 사유 글자 수
    private static final int MAX_DETAIL_BYTES = 1000;       // DB VARCHAR2(1000)
    private static final int MAX_CONTENT_BYTES = 1900;      // DB VARCHAR2(2000), 여유 두고 자름
    private static final int MAX_SIZE = 50;

    @Autowired
    private ReportDAO reportDAO;

    @Autowired
    private AuthMemberService authMemberService;

    /* ===================== 신고하기 ===================== */
    @Transactional
    public long insertReport(ReportDTO dto, String authorization) {
        AuthMemberDTO me = authMemberService.loginMember(authorization);   // 로그인 필수 (토큰)
        if (dto == null) throw bad("입력값이 없습니다.");

        String targetType = dto.getTargetType() == null ? "" : dto.getTargetType().trim().toUpperCase();
        Long targetSeq = dto.getTargetSeq();
        String reasonType = dto.getReasonType() == null ? "" : dto.getReasonType().trim().toUpperCase();
        String detail = dto.getReasonDetail() == null ? "" : dto.getReasonDetail().trim();

        if (!TARGET_TYPES.contains(targetType)) throw bad("신고 대상이 올바르지 않아요.");
        if (targetSeq == null || targetSeq < 1) throw bad("신고 대상이 올바르지 않아요.");
        if (!REASON_TYPES.contains(reasonType)) throw bad("신고 사유를 선택해 주세요.");
        if ("ETC".equals(reasonType) && detail.isEmpty()) throw bad("기타 사유는 내용을 적어 주세요.");
        if (detail.length() > MAX_DETAIL || detail.getBytes(StandardCharsets.UTF_8).length > MAX_DETAIL_BYTES) {
            throw bad("상세 사유는 " + MAX_DETAIL + "자까지 입력할 수 있어요.");
        }

        // 신고 대상 찾기 (작성자 + 내용)
        ReportTargetDTO target = findTarget(targetType, targetSeq);
        Long mySeq = me.getMemberSeq();

        if (Objects.equals(target.getMemberSeq(), mySeq)) {
            throw bad("본인이 쓴 글이나 댓글은 신고할 수 없어요.");
        }
        if (alreadyReported(mySeq, targetType, targetSeq)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 신고한 글이에요.");
        }

        dto.setReporterSeq(mySeq);
        dto.setReportedSeq(target.getMemberSeq());
        dto.setTargetType(targetType);
        dto.setReasonType(reasonType);
        dto.setReasonDetail(detail.isEmpty() ? null : detail);
        dto.setTargetContent(snapshot(targetType, target));

        try {
            reportDAO.insertReport(dto);
        } catch (DuplicateKeyException e) {
            // 거의 동시에 두 번 누른 경우 (DB UNIQUE에 걸림)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 신고한 글이에요.");
        }
        return dto.getReportSeq();
    }

    /* ===================== 신고했는지 확인 ===================== */
    public boolean isReported(String targetType, long targetSeq, String authorization) {
        AuthMemberDTO me = authMemberService.loginMemberOrNull(authorization);
        if (me == null) return false;
        String type = targetType == null ? "" : targetType.trim().toUpperCase();
        if (!TARGET_TYPES.contains(type)) throw bad("신고 대상이 올바르지 않아요.");
        return alreadyReported(me.getMemberSeq(), type, targetSeq);
    }

    /* ===================== 내 신고 내역 (M013) ===================== */
    public Map<String, Object> selectMyReports(int page, int size, String authorization) {
        AuthMemberDTO me = authMemberService.loginMember(authorization);

        int safeSize = Math.min(Math.max(size, 1), MAX_SIZE);
        int safePage = Math.max(page, 1);

        int totalCount = reportDAO.countMyReports(me.getMemberSeq());
        int totalPages = Math.max(1, (int) Math.ceil((double) totalCount / safeSize));

        Map<String, Object> param = new HashMap<>();
        param.put("reporterSeq", me.getMemberSeq());
        param.put("startRow", (safePage - 1) * safeSize);
        param.put("endRow", safePage * safeSize);

        Map<String, Object> result = new HashMap<>();
        result.put("list", reportDAO.selectMyReports(param));
        result.put("totalCount", totalCount);
        result.put("totalPages", totalPages);
        result.put("page", safePage);
        return result;
    }

    /* ===================== 도우미 ===================== */
    private ReportTargetDTO findTarget(String targetType, long targetSeq) {
        ReportTargetDTO target = "POST".equals(targetType)
                ? reportDAO.selectPostTarget(targetSeq)
                : reportDAO.selectCommentTarget(targetSeq);

        if (target == null || "Y".equals(target.getIsDeleted())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "삭제되었거나 없는 글이에요.");
        }
        return target;
    }

    private boolean alreadyReported(Long reporterSeq, String targetType, long targetSeq) {
        Map<String, Object> param = new HashMap<>();
        param.put("reporterSeq", reporterSeq);
        param.put("targetType", targetType);
        param.put("targetSeq", targetSeq);
        return reportDAO.countMyReport(param) > 0;
    }

    // 신고 당시 내용 사본 (게시글은 "[제목] 내용")
    private String snapshot(String targetType, ReportTargetDTO target) {
        String content = target.getContent() == null ? "" : target.getContent();
        String text = "POST".equals(targetType)
                ? "[" + (target.getTitle() == null ? "" : target.getTitle()) + "] " + content
                : content;
        return cutBytes(text, MAX_CONTENT_BYTES);
    }

    // 한글이 깨지지 않게 바이트 기준으로 자르기
    private String cutBytes(String text, int maxBytes) {
        if (text == null) return null;
        if (text.getBytes(StandardCharsets.UTF_8).length <= maxBytes) return text;

        StringBuilder sb = new StringBuilder();
        int bytes = 0;
        for (int i = 0; i < text.length(); ) {
            int cp = text.codePointAt(i);
            String ch = new String(Character.toChars(cp));
            int len = ch.getBytes(StandardCharsets.UTF_8).length;
            if (bytes + len > maxBytes - 3) break;    // "..." 자리 남기기
            sb.append(ch);
            bytes += len;
            i += Character.charCount(cp);
        }
        return sb.append("...").toString();
    }

    private ResponseStatusException bad(String msg) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
    }
}