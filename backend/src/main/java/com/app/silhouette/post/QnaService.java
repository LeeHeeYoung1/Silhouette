package com.app.silhouette.post;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;   // ✅ 추가
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.app.silhouette.commons.AuthMemberDTO;
import com.app.silhouette.commons.AuthMemberService;

@Service
public class QnaService {

    private static final int MAX_TITLE = 50;
    private static final int MAX_TITLE_BYTES = 150;
    private static final int MAX_CONTENT = 5000;
    private static final int MAX_ANSWER = 5000;
    private static final int PW_MIN = 6;      // 최소 6자, 숫자·영문·특수문자 모두 허용
    private static final int PW_MAX = 30;
    private static final int MAX_SIZE = 50;

    private static final String WAITING = "WAITING";
    private static final String DONE = "DONE";
    private static final String SECRET_TITLE = "비밀글입니다.";

    @Autowired
    private QnaDAO qnaDAO;

    @Autowired
    private AuthMemberService authMemberService;

    // ✅ BCrypt 암호화 도구 (프로젝트에 공용 Bean이 없어서 직접 생성)
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    /* ===== 목록 ===== */
    public Map<String, Object> selectQnaPage(int page, int size, boolean mine, String authorization) {
        AuthMemberDTO me = authMemberService.loginMemberOrNull(authorization);
        if (mine && me == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        boolean admin = isAdmin(me);

        int safeSize = Math.min(Math.max(size, 1), MAX_SIZE);
        int safePage = Math.max(page, 1);

        Map<String, Object> param = new HashMap<>();
        param.put("memberSeq", mine ? mySeq(me) : null);

        int totalCount = qnaDAO.countQnaList(param);
        int totalPages = Math.max(1, (int) Math.ceil((double) totalCount / safeSize));

        param.put("startRow", (safePage - 1) * safeSize);
        param.put("endRow", safePage * safeSize);
        List<QnaDTO> list = qnaDAO.selectQnaList(param);

        for (QnaDTO q : list) {
            boolean isMine = isOwner(q, me);
            q.setMine(isMine);
            if (isSecret(q) && !isMine && !admin) q.setTitle(SECRET_TITLE);   // 남의 비밀글 제목 가리기
            q.setMemberSeq(null);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("list", list);
        result.put("totalCount", totalCount);
        result.put("totalPages", totalPages);
        result.put("page", safePage);
        return result;
    }

    /* ===== 상세 ===== */
    public QnaDTO selectQna(long qnaSeq, String authorization) {
        QnaDTO q = findQna(qnaSeq);
        AuthMemberDTO me = authMemberService.loginMemberOrNull(authorization);
        boolean mine = isOwner(q, me);

        if (isSecret(q) && !mine && !isAdmin(me)) {
            QnaDTO locked = new QnaDTO();
            locked.setQnaSeq(q.getQnaSeq());
            locked.setTitle(SECRET_TITLE);
            locked.setIsSecret("Y");
            locked.setAnswerStatus(q.getAnswerStatus());
            locked.setWriterName(q.getWriterName());
            locked.setCreatedAt(q.getCreatedAt());
            locked.setMine(false);
            locked.setLocked(true);
            locked.setEditable(false);
            return locked;
        }
        return toDetail(q, mine);
    }

    // 비밀번호로 비밀글 열기
    public QnaDTO verifyPassword(long qnaSeq, String password, String authorization) {
        QnaDTO q = findQna(qnaSeq);
        AuthMemberDTO me = authMemberService.loginMemberOrNull(authorization);
        boolean mine = isOwner(q, me);

        if (isSecret(q) && !mine && !isAdmin(me)) {
            boolean ok = password != null
                    && q.getSecretPassword() != null
                    && passwordEncoder.matches(password, q.getSecretPassword());
            if (!ok) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "비밀번호가 일치하지 않습니다.");
        }
        return toDetail(q, mine);
    }

    /* ===== 작성 · 수정 · 삭제 ===== */
    @Transactional
    public long insertQna(QnaDTO dto, String authorization) {
        AuthMemberDTO me = authMemberService.loginMember(authorization);
        checkInput(dto);

        if (isSecret(dto)) {
            String pw = dto.getSecretPassword();
            if (pw == null || pw.isEmpty()) throw bad("비밀글은 비밀번호를 입력해 주세요.");
            checkPassword(pw);
            dto.setSecretPassword(passwordEncoder.encode(pw));   // BCrypt 암호화
        } else {
            dto.setSecretPassword(null);
        }

        dto.setMemberSeq(mySeq(me));
        qnaDAO.insertQna(dto);
        return dto.getQnaSeq();
    }

    // 수정 화면용 (내 글 + 답변 전만)
    public QnaDTO selectQnaForEdit(long qnaSeq, String authorization) {
        AuthMemberDTO me = authMemberService.loginMember(authorization);
        QnaDTO q = findQna(qnaSeq);
        checkEditable(q, me);
        q.setSecretPassword(null);
        q.setMemberSeq(null);
        q.setMine(true);
        q.setEditable(true);
        return q;
    }

    @Transactional
    public void updateQna(long qnaSeq, QnaDTO dto, String authorization) {
        AuthMemberDTO me = authMemberService.loginMember(authorization);
        QnaDTO old = findQna(qnaSeq);
        checkEditable(old, me);
        checkInput(dto);

        if (isSecret(dto)) {
            String pw = dto.getSecretPassword();
            if (pw == null || pw.isEmpty()) {
                if (!isSecret(old) || old.getSecretPassword() == null) {
                    throw bad("비밀글은 비밀번호를 입력해 주세요.");
                }
                dto.setSecretPassword(old.getSecretPassword());   // 기존 비밀번호 유지
            } else {
                checkPassword(pw);
                dto.setSecretPassword(passwordEncoder.encode(pw));
            }
        } else {
            dto.setSecretPassword(null);
        }

        dto.setQnaSeq(qnaSeq);
        if (qnaDAO.updateQna(dto) == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "답변이 달린 문의는 수정할 수 없어요.");
        }
    }

    @Transactional
    public void deleteQna(long qnaSeq, String authorization) {
        AuthMemberDTO me = authMemberService.loginMember(authorization);
        QnaDTO q = findQna(qnaSeq);
        if (!isOwner(q, me) && !isAdmin(me)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인 문의만 삭제할 수 있어요.");
        }
        qnaDAO.deleteQna(qnaSeq);
    }

    /* ===== 관리자 답변 ===== */
    @Transactional
    public void insertAnswer(long qnaSeq, String content, String authorization) {
        AuthMemberDTO admin = authMemberService.adminMember(authorization);
        findQna(qnaSeq);
        String text = checkAnswer(content);

        if (qnaDAO.selectAnswer(qnaSeq) != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 답변이 있어요. 수정해 주세요.");
        }

        QnaAnswerDTO answer = new QnaAnswerDTO();
        answer.setQnaSeq(qnaSeq);
        answer.setAdminSeq(admin.getMemberSeq());
        answer.setContent(text);
        qnaDAO.insertAnswer(answer);

        changeStatus(qnaSeq, DONE);
    }

    @Transactional
    public void updateAnswer(long qnaSeq, String content, String authorization) {
        AuthMemberDTO admin = authMemberService.adminMember(authorization);
        findQna(qnaSeq);
        String text = checkAnswer(content);

        if (qnaDAO.selectAnswer(qnaSeq) == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "답변이 없어요.");
        }

        QnaAnswerDTO answer = new QnaAnswerDTO();
        answer.setQnaSeq(qnaSeq);
        answer.setUpdatedBy(admin.getMemberSeq());
        answer.setContent(text);
        qnaDAO.updateAnswer(answer);
    }

    @Transactional
    public void deleteAnswer(long qnaSeq, String authorization) {
        authMemberService.adminMember(authorization);
        findQna(qnaSeq);
        qnaDAO.deleteAnswer(qnaSeq);
        changeStatus(qnaSeq, WAITING);   // 답변을 지우면 다시 답변대기
    }

    /* ===== 도우미 ===== */
    private QnaDTO findQna(long qnaSeq) {
        QnaDTO q = qnaDAO.selectQna(qnaSeq);
        if (q == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "문의를 찾을 수 없습니다.");
        return q;
    }

    // 상세 화면에 보낼 모양으로 정리 (비밀번호·회원번호 제거)
    private QnaDTO toDetail(QnaDTO q, boolean mine) {
        q.setAnswer(qnaDAO.selectAnswer(q.getQnaSeq()));
        q.setMine(mine);
        q.setLocked(false);
        q.setEditable(mine && WAITING.equals(q.getAnswerStatus()));
        q.setSecretPassword(null);
        q.setMemberSeq(null);
        return q;
    }

    private void checkEditable(QnaDTO q, AuthMemberDTO me) {
        if (!isOwner(q, me)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인 문의만 수정할 수 있어요.");
        }
        if (!WAITING.equals(q.getAnswerStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "답변이 달린 문의는 수정할 수 없어요.");
        }
    }

    private void checkInput(QnaDTO dto) {
        if (dto == null) throw bad("입력값이 없습니다.");
        String title = dto.getTitle() == null ? "" : dto.getTitle().trim();
        String content = dto.getContent() == null ? "" : dto.getContent().trim();

        if (title.isEmpty()) throw bad("제목을 입력해 주세요.");
        if (title.length() > MAX_TITLE || title.getBytes(StandardCharsets.UTF_8).length > MAX_TITLE_BYTES) {
            throw bad("제목은 " + MAX_TITLE + "자까지 입력할 수 있어요.");
        }
        if (content.isEmpty()) throw bad("내용을 입력해 주세요.");
        if (content.length() > MAX_CONTENT) throw bad("내용은 " + MAX_CONTENT + "자까지 입력할 수 있어요.");

        dto.setTitle(title);
        dto.setContent(content);
        dto.setIsSecret("Y".equals(dto.getIsSecret()) ? "Y" : "N");
    }

    // 비밀번호: 글자 수만 검사 (숫자·영문 대소문자·특수문자 모두 허용)
    private void checkPassword(String pw) {
        if (pw.length() < PW_MIN || pw.length() > PW_MAX) {
            throw bad("비밀번호는 " + PW_MIN + "~" + PW_MAX + "자로 입력해 주세요.");
        }
    }

    private String checkAnswer(String content) {
        String text = content == null ? "" : content.trim();
        if (text.isEmpty()) throw bad("답변 내용을 입력해 주세요.");
        if (text.length() > MAX_ANSWER) throw bad("답변은 " + MAX_ANSWER + "자까지 입력할 수 있어요.");
        return text;
    }

    private void changeStatus(long qnaSeq, String status) {
        Map<String, Object> param = new HashMap<>();
        param.put("qnaSeq", qnaSeq);
        param.put("answerStatus", status);
        qnaDAO.updateAnswerStatus(param);
    }

    private boolean isSecret(QnaDTO q) {
        return "Y".equals(q.getIsSecret());
    }

    private boolean isAdmin(AuthMemberDTO me) {
        return me != null && me.isAdmin();
    }

    private Long mySeq(AuthMemberDTO me) {
        return me == null ? null : me.getMemberSeq();
    }

    private boolean isOwner(QnaDTO q, AuthMemberDTO me) {
        Long seq = mySeq(me);
        return seq != null && Objects.equals(q.getMemberSeq(), seq);
    }

    private ResponseStatusException bad(String msg) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
    }
}