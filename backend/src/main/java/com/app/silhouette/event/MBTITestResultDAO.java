package com.app.silhouette.event;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class MBTITestResultDAO {
	
	private final SqlSessionTemplate mybatis;
	private final String NAMESPACE = "MBTITestResult";
	
	public MBTITestResultDAO(SqlSessionTemplate mybatis) {
		this.mybatis = mybatis;
	}
	
	public int insertMBTITestResult(MBTITestResultDTO mBTITestResultDto) {
		return mybatis.insert(NAMESPACE + ".insertMbtiTestResult", mBTITestResultDto);
	}
	
	public MBTITestResultDTO selectLatestResultByMember(Long memberSeq) {
        return mybatis.selectOne(NAMESPACE + ".selectLatestResultByMember", memberSeq);
    }
}
