package com.app.silhouette.event;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class LoveValueTestResultDAO {
	
	private final SqlSessionTemplate mybatis;
	private final String NAMESPACE = "LoveValueTestResult";
	
	public LoveValueTestResultDAO(SqlSessionTemplate mybatis) {
		this.mybatis = mybatis;
	}
	
	public int insertLoveValueTestResult(LoveValueTestResultDTO loveValueTestResultDto) {
		return mybatis.insert(NAMESPACE + ".insertLoveValueTestResult", loveValueTestResultDto);
	}
	
	public LoveValueTestResultDTO selectLatestResultByMember(Long memberSeq) {
		return mybatis.selectOne(NAMESPACE + ".selectLatestResultByMember", memberSeq);
	}
	
	
	
}
