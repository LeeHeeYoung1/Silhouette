package com.app.silhouette.beautytest;

import java.time.LocalDateTime;
import java.util.List;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

@Repository
public class BeautyTestDAO {

	@Autowired
	private SqlSessionTemplate sqlSession;

	// 테스트 결과 저장
	public int insertBeautyTest(BeautyTestDTO dto) {
		return sqlSession.insert("BeautyTest.insertBeautyTest", dto);
	}

	// 내 테스트 기록 전체
	public List<BeautyTestDTO> selectMyTests(Long memberSeq) {
		return sqlSession.selectList("BeautyTest.selectMyTests", memberSeq);
	}

	// 내 최신 결과 1개
	public BeautyTestDTO selectLatest(Long memberSeq) {
		return sqlSession.selectOne("BeautyTest.selectLatest", memberSeq);
	}

	// 다음 테스트 가능 시각 (최근 7일 안에 안 했으면 null)
	public LocalDateTime selectNextAvailableAt(Long memberSeq) {
		return sqlSession.selectOne("BeautyTest.selectNextAvailableAt", memberSeq);
	}
}
