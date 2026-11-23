package com.app.silhouette.post;

import java.time.LocalDateTime;

public class QnaAnswerDTO {

    private Long qna_answer_seq;
    private Long qna_seq;
    private Long admin_seq;
    private Long updated_by;
    private String content;
    private LocalDateTime created_at;
    private LocalDateTime updated_at;

    private String admin_name;   // 화면용

    public Long getQnaAnswerSeq() { return qna_answer_seq; }
    public void setQnaAnswerSeq(Long qna_answer_seq) { this.qna_answer_seq = qna_answer_seq; }

    public Long getQnaSeq() { return qna_seq; }
    public void setQnaSeq(Long qna_seq) { this.qna_seq = qna_seq; }

    public Long getAdminSeq() { return admin_seq; }
    public void setAdminSeq(Long admin_seq) { this.admin_seq = admin_seq; }

    public Long getUpdatedBy() { return updated_by; }
    public void setUpdatedBy(Long updated_by) { this.updated_by = updated_by; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public LocalDateTime getCreatedAt() { return created_at; }
    public void setCreatedAt(LocalDateTime created_at) { this.created_at = created_at; }

    public LocalDateTime getUpdatedAt() { return updated_at; }
    public void setUpdatedAt(LocalDateTime updated_at) { this.updated_at = updated_at; }

    public String getAdminName() { return admin_name; }
    public void setAdminName(String admin_name) { this.admin_name = admin_name; }
}