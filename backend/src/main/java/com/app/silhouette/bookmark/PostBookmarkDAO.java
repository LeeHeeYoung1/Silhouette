package com.app.silhouette.bookmark;

import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class PostBookmarkDAO {

	private final SqlSessionTemplate mybatis;

	public PostBookmarkDAO(SqlSessionTemplate mybatis) {
		this.mybatis = mybatis;
	}

	public int countActivePost(Long postSeq) {
		return mybatis.selectOne("PostBookmark.countActivePost", postSeq);
	}

	public int countBookmark(Long memberSeq, Long postSeq) {
		return mybatis.selectOne("PostBookmark.countBookmark", Map.of("memberSeq", memberSeq, "postSeq", postSeq));
	}

	public int insertBookmark(Long memberSeq, Long postSeq) {
		return mybatis.insert("PostBookmark.insertBookmark", Map.of("memberSeq", memberSeq, "postSeq", postSeq));
	}

	public int deleteBookmark(Long memberSeq, Long postSeq) {
		return mybatis.delete("PostBookmark.deleteBookmark", Map.of("memberSeq", memberSeq, "postSeq", postSeq));
	}

	public int countMyBookmarks(Long memberSeq) {
		return mybatis.selectOne("PostBookmark.countMyBookmarks", Map.of("memberSeq", memberSeq));
	}

	public List<PostBookmarkDTO> selectMyBookmarks(Long memberSeq, int startRow, int endRow) {
		return mybatis.selectList("PostBookmark.selectMyBookmarks",
				Map.of("memberSeq", memberSeq, "startRow", startRow, "endRow", endRow));
	}
}