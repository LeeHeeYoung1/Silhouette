package com.app.silhouette.post;

import java.time.LocalDateTime;

public class PostFileDTO {
	private Long post_file_seq;
	private Long post_seq;
	private String original_name;
	private String stored_name;
	private String file_path;
	private Long file_size;
	private String file_type;      // IMAGE / FILE
	private Integer sort_order;
	private LocalDateTime created_at;

	public PostFileDTO() {}

	public Long getPostFileSeq() { return post_file_seq; }
	public void setPostFileSeq(Long post_file_seq) { this.post_file_seq = post_file_seq; }

	public Long getPostSeq() { return post_seq; }
	public void setPostSeq(Long post_seq) { this.post_seq = post_seq; }

	public String getOriginalName() { return original_name; }
	public void setOriginalName(String original_name) { this.original_name = original_name; }

	public String getStoredName() { return stored_name; }
	public void setStoredName(String stored_name) { this.stored_name = stored_name; }

	public String getFilePath() { return file_path; }
	public void setFilePath(String file_path) { this.file_path = file_path; }

	public Long getFileSize() { return file_size; }
	public void setFileSize(Long file_size) { this.file_size = file_size; }

	public String getFileType() { return file_type; }
	public void setFileType(String file_type) { this.file_type = file_type; }

	public Integer getSortOrder() { return sort_order; }
	public void setSortOrder(Integer sort_order) { this.sort_order = sort_order; }

	public LocalDateTime getCreatedAt() { return created_at; }
	public void setCreatedAt(LocalDateTime created_at) { this.created_at = created_at; }
}