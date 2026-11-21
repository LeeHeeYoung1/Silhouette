package com.app.silhouette.event;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class FoodTestResultDAO {
	
	private final SqlSessionTemplate mybatis;
	
	public FoodTestResultDAO(SqlSessionTemplate mybatis) {
		this.mybatis = mybatis;
	}
	
	public int insertResult(FoodTestResultDTO foodTestResultDto) {
		return mybatis.insert("FoodTest.insertFoodTestResult", foodTestResultDto);
	}
	
	public FoodTestResultDTO selectLatestResult(Long memberSeq) {
		return mybatis.selectOne("FoodTest.selectLatestResultByMemberSeq", memberSeq);
	}
	
	
}
