package com.app.silhouette.admin;

import java.time.LocalDateTime;

public class BannedWordDTO {
	private Long banned_word_seq;
    private String word;
    private String category;
    private String replacement;
    private String use_yn;
    private LocalDateTime created_at;

    public BannedWordDTO() {}

	public BannedWordDTO(Long banned_word_seq, String word, String category, String replacement, String use_yn,
			LocalDateTime created_at) {
		super();
		this.banned_word_seq = banned_word_seq;
		this.word = word;
		this.category = category;
		this.replacement = replacement;
		this.use_yn = use_yn;
		this.created_at = created_at;
	}

	public Long getBannedWordSeq() {
		return banned_word_seq;
	}

	public void setBannedWordSeq(Long banned_word_seq) {
		this.banned_word_seq = banned_word_seq;
	}

	public String getWord() {
		return word;
	}

	public void setWord(String word) {
		this.word = word;
	}

	public String getCategory() {
		return category;
	}

	public void setCategory(String category) {
		this.category = category;
	}

	public String getReplacement() {
		return replacement;
	}

	public void setReplacement(String replacement) {
		this.replacement = replacement;
	}

	public String getUseYn() {
		return use_yn;
	}

	public void setUseYn(String use_yn) {
		this.use_yn = use_yn;
	}

	public String getUse_yn() {
		return use_yn;
	}

	public void setUse_yn(String use_yn) {
		this.use_yn = use_yn;
	}

	public LocalDateTime getCreatedAt() {
		return created_at;
	}

	public void setCreatedAt(LocalDateTime created_at) {
		this.created_at = created_at;
	}
}
