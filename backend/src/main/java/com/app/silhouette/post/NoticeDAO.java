package com.app.silhouette.post;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class NoticeDAO {

	private final SqlSessionTemplate mybatis;

	public NoticeDAO(SqlSessionTemplate mybatis) {
		this.mybatis = mybatis;
	}

	// 조건에 맞는 공지 수
	public int countNoticeList(Map<String, Object> params) {
		return mybatis.selectOne("Notice.countNoticeList", params);
	}

	// 해당 페이지 공지 목록
	public List<NoticeDTO> selectNoticeList(Map<String, Object> params) {
		return mybatis.selectList("Notice.selectNoticeList", params);
	}

	// 조회수 +1
	public int updateNoticeViewCount(Long noticeSeq) {
		return mybatis.update("Notice.updateNoticeViewCount", noticeSeq);
	}

	// 공지 상세 (없으면 null)
	public NoticeDTO selectNotice(Long noticeSeq) {
		return mybatis.selectOne("Notice.selectNotice", noticeSeq);
	}

	// 공지 작성 (selectKey로 dto.noticeSeq에 새 번호)
	public int insertNotice(NoticeDTO dto) {
		return mybatis.insert("Notice.insertNotice", dto);
	}

	// 공지 수정 (0이면 없거나 삭제된 공지)
	public int updateNotice(NoticeDTO dto) {
		return mybatis.update("Notice.updateNotice", dto);
	}

	// 공지 삭제 (0이면 없거나 이미 삭제)
	public int deleteNotice(Long noticeSeq, Long adminSeq) {
		Map<String, Object> params = new HashMap<>();
		params.put("noticeSeq", noticeSeq);
		params.put("adminSeq", adminSeq);
		return mybatis.update("Notice.deleteNotice", params);
	}
}