package com.app.silhouette.post;

import java.time.LocalDateTime;

public class FaqDTO {

    private Long faq_seq;
    private Long admin_seq;
    private String category;
    private String question;
    private String answer;
    private Integer sort_order;
    private String is_active;          // 'Y' 보이기, 'N' 숨기기
    private LocalDateTime created_at;
    private LocalDateTime updated_at;

    public Long getFaqSeq() { return faq_seq; }
    public void setFaqSeq(Long faq_seq) { this.faq_seq = faq_seq; }

    public Long getAdminSeq() { return admin_seq; }
    public void setAdminSeq(Long admin_seq) { this.admin_seq = admin_seq; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }

    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }

    public Integer getSortOrder() { return sort_order; }
    public void setSortOrder(Integer sort_order) { this.sort_order = sort_order; }

    public String getIsActive() { return is_active; }
    public void setIsActive(String is_active) { this.is_active = is_active; }

    public LocalDateTime getCreatedAt() { return created_at; }
    public void setCreatedAt(LocalDateTime created_at) { this.created_at = created_at; }

    public LocalDateTime getUpdatedAt() { return updated_at; }
    public void setUpdatedAt(LocalDateTime updated_at) { this.updated_at = updated_at; }
}