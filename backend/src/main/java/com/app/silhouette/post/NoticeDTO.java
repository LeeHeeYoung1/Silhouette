package com.app.silhouette.post;

import java.time.LocalDateTime;

public class NoticeDTO {

	// ===================== NOTICE 테이블 컬럼 =====================
	private Long notice_seq;               // NOTICE_SEQ (값은 SEQ_NOTICE.NEXTVAL)
	private Long admin_seq;                // ADMIN_SEQ (작성 관리자 MEMBER_SEQ)
	private Long updated_by;               // UPDATED_BY (마지막 수정 관리자 MEMBER_SEQ)
	private String title;                  // TITLE
	private String content;                // CONTENT (CLOB)
	private String is_pinned;              // IS_PINNED (Y: 상단 고정 / N)
	private Integer view_count;            // VIEW_COUNT
	private String is_deleted;             // IS_DELETED (Y/N)
	private LocalDateTime created_at;      // CREATED_AT
	private LocalDateTime updated_at;      // UPDATED_AT
	private LocalDateTime deleted_at;      // DELETED_AT

	// ===================== 화면용 (NOTICE 컬럼 아님) =====================
	private String writer_name;            // 작성 관리자 닉네임

	public NoticeDTO() {}

	public Long getNoticeSeq() { return notice_seq; }
	public void setNoticeSeq(Long noticeSeq) { this.notice_seq = noticeSeq; }

	public Long getAdminSeq() { return admin_seq; }
	public void setAdminSeq(Long adminSeq) { this.admin_seq = adminSeq; }

	public Long getUpdatedBy() { return updated_by; }
	public void setUpdatedBy(Long updatedBy) { this.updated_by = updatedBy; }

	public String getTitle() { return title; }
	public void setTitle(String title) { this.title = title; }

	public String getContent() { return content; }
	public void setContent(String content) { this.content = content; }

	public String getIsPinned() { return is_pinned; }
	public void setIsPinned(String isPinned) { this.is_pinned = isPinned; }

	public Integer getViewCount() { return view_count; }
	public void setViewCount(Integer viewCount) { this.view_count = viewCount; }

	public String getIsDeleted() { return is_deleted; }
	public void setIsDeleted(String isDeleted) { this.is_deleted = isDeleted; }

	public LocalDateTime getCreatedAt() { return created_at; }
	public void setCreatedAt(LocalDateTime createdAt) { this.created_at = createdAt; }

	public LocalDateTime getUpdatedAt() { return updated_at; }
	public void setUpdatedAt(LocalDateTime updatedAt) { this.updated_at = updatedAt; }

	public LocalDateTime getDeletedAt() { return deleted_at; }
	public void setDeletedAt(LocalDateTime deletedAt) { this.deleted_at = deletedAt; }

	public String getWriterName() { return writer_name; }
	public void setWriterName(String writerName) { this.writer_name = writerName; }
}