package com.app.silhouette.blind;

import java.sql.Timestamp;

public class BlindMatchingDTO {
	
	private Long Blind_matching_seq;
	private Long Member_seq1;
	private Long Member_seq2;
	private String Status;
	private Timestamp Matched_at;
	
	public BlindMatchingDTO () {}
	
	public BlindMatchingDTO(Long blind_matching_seq, Long member_seq1, Long member_seq2, String status,
			Timestamp matched_at) {
		Blind_matching_seq = blind_matching_seq;
		Member_seq1 = member_seq1;
		Member_seq2 = member_seq2;
		Status = status;
		Matched_at = matched_at;
	}
	public Long getBlind_matching_seq() {
		return Blind_matching_seq;
	}
	public void setBlind_matching_seq(Long blind_matching_seq) {
		Blind_matching_seq = blind_matching_seq;
	}
	public Long getMember_seq1() {
		return Member_seq1;
	}
	public void setMember_seq1(Long member_seq1) {
		Member_seq1 = member_seq1;
	}
	public Long getMember_seq2() {
		return Member_seq2;
	}
	public void setMember_seq2(Long member_seq2) {
		Member_seq2 = member_seq2;
	}
	public String getStatus() {
		return Status;
	}
	public void setStatus(String status) {
		Status = status;
	}
	public Timestamp getMatched_at() {
		return Matched_at;
	}
	public void setMatched_at(Timestamp matched_at) {
		Matched_at = matched_at;
	}
	
}
