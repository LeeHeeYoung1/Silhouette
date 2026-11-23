package com.app.silhouette.post;

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
public class FaqService {

    public static final List<String> CATEGORIES = List.of("계정", "매칭", "결제", "채팅", "신고", "기타");

    private static final int MAX_QUESTION = 90;          // 화면 글자 수 (한글 기준)
    private static final int MAX_QUESTION_BYTES = 300;   // DB VARCHAR2(300) 바이트
    private static final int MAX_ANSWER = 5000;
    private static final int MAX_SORT = 9999;

    @Autowired
    private FaqDAO faqDAO;

    @Autowired
    private AuthMemberService authMemberService;

    public List<String> getCategories() {
        return CATEGORIES;
    }

    // 목록: 관리자는 숨긴 FAQ도 보임
    public List<FaqDTO> selectFaqList(String category, String authorization) {
        if (category != null && !category.isBlank() && !CATEGORIES.contains(category)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "없는 카테고리입니다.");
        }
        AuthMemberDTO me = authMemberService.loginMemberOrNull(authorization);
        boolean admin = me != null && me.isAdmin();

        Map<String, Object> param = new HashMap<>();
        param.put("category", category == null || category.isBlank() ? null : category);
        param.put("includeInactive", admin);
        return faqDAO.selectFaqList(param);
    }

    // 수정 화면용 (관리자만)
    public FaqDTO selectFaqForEdit(long faqSeq, String authorization) {
        authMemberService.adminMember(authorization);
        return findFaq(faqSeq);
    }

    @Transactional
    public long insertFaq(FaqDTO dto, String authorization) {
        AuthMemberDTO admin = authMemberService.adminMember(authorization);
        checkInput(dto);
        dto.setAdminSeq(admin.getMemberSeq());
        faqDAO.insertFaq(dto);
        return dto.getFaqSeq();
    }

    @Transactional
    public void updateFaq(long faqSeq, FaqDTO dto, String authorization) {
        authMemberService.adminMember(authorization);
        FaqDTO old = findFaq(faqSeq);
        checkInput(dto);
        dto.setFaqSeq(faqSeq);
        if (dto.getSortOrder() == null) dto.setSortOrder(old.getSortOrder());   // 순서 비우면 기존 유지
        faqDAO.updateFaq(dto);
    }

    @Transactional
    public void deleteFaq(long faqSeq, String authorization) {
        authMemberService.adminMember(authorization);
        findFaq(faqSeq);
        faqDAO.deleteFaq(faqSeq);
    }

    // ===== 도우미 =====
    private FaqDTO findFaq(long faqSeq) {
        FaqDTO faq = faqDAO.selectFaq(faqSeq);
        if (faq == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "FAQ를 찾을 수 없습니다.");
        }
        return faq;
    }

    private void checkInput(FaqDTO dto) {
        if (dto == null) throw bad("입력값이 없습니다.");

        String category = dto.getCategory() == null ? "" : dto.getCategory().trim();
        String question = dto.getQuestion() == null ? "" : dto.getQuestion().trim();
        String answer = dto.getAnswer() == null ? "" : dto.getAnswer().trim();

        if (!CATEGORIES.contains(category)) throw bad("카테고리를 선택해 주세요.");
        if (question.isEmpty()) throw bad("질문을 입력해 주세요.");
        if (question.length() > MAX_QUESTION
                || question.getBytes(StandardCharsets.UTF_8).length > MAX_QUESTION_BYTES) {
            throw bad("질문은 " + MAX_QUESTION + "자까지 입력할 수 있어요.");
        }
        if (answer.isEmpty()) throw bad("답변을 입력해 주세요.");
        if (answer.length() > MAX_ANSWER) throw bad("답변은 " + MAX_ANSWER + "자까지 입력할 수 있어요.");

        Integer sort = dto.getSortOrder();
        if (sort != null && (sort < 1 || sort > MAX_SORT)) throw bad("순서는 1~" + MAX_SORT + " 사이로 입력해 주세요.");

        dto.setCategory(category);
        dto.setQuestion(question);
        dto.setAnswer(answer);
        dto.setIsActive("N".equals(dto.getIsActive()) ? "N" : "Y");   // 그 외 값은 전부 Y
    }

    private ResponseStatusException bad(String msg) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
    }
}