package com.app.silhouette.post;

import java.time.LocalDateTime;

public class QnaDTO {

    private Long qna_seq;
    private Long member_seq;
    private String title;
    private String content;
    private String is_secret;          // 'Y' 비밀글, 'N' 공개
    private String secret_password;    // BCrypt 암호화 값 (화면에 절대 안 보냄)
    private String answer_status;      // 'WAITING' 답변대기, 'DONE' 답변완료
    private String is_deleted;
    private LocalDateTime created_at;
    private LocalDateTime updated_at;

    // 화면용 (DB 컬럼 아님)
    private String writer_name;
    private Boolean mine;
    private Boolean locked;
    private Boolean editable;
    private QnaAnswerDTO answer;

    public Long getQnaSeq() { return qna_seq; }
    public void setQnaSeq(Long qna_seq) { this.qna_seq = qna_seq; }

    public Long getMemberSeq() { return member_seq; }
    public void setMemberSeq(Long member_seq) { this.member_seq = member_seq; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getIsSecret() { return is_secret; }
    public void setIsSecret(String is_secret) { this.is_secret = is_secret; }

    public String getSecretPassword() { return secret_password; }
    public void setSecretPassword(String secret_password) { this.secret_password = secret_password; }

    public String getAnswerStatus() { return answer_status; }
    public void setAnswerStatus(String answer_status) { this.answer_status = answer_status; }

    public String getIsDeleted() { return is_deleted; }
    public void setIsDeleted(String is_deleted) { this.is_deleted = is_deleted; }

    public LocalDateTime getCreatedAt() { return created_at; }
    public void setCreatedAt(LocalDateTime created_at) { this.created_at = created_at; }

    public LocalDateTime getUpdatedAt() { return updated_at; }
    public void setUpdatedAt(LocalDateTime updated_at) { this.updated_at = updated_at; }

    public String getWriterName() { return writer_name; }
    public void setWriterName(String writer_name) { this.writer_name = writer_name; }

    public Boolean getMine() { return mine; }
    public void setMine(Boolean mine) { this.mine = mine; }

    public Boolean getLocked() { return locked; }
    public void setLocked(Boolean locked) { this.locked = locked; }

    public Boolean getEditable() { return editable; }
    public void setEditable(Boolean editable) { this.editable = editable; }

    public QnaAnswerDTO getAnswer() { return answer; }
    public void setAnswer(QnaAnswerDTO answer) { this.answer = answer; }
}