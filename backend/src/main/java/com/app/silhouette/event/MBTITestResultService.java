package com.app.silhouette.event;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MBTITestResultService {
	
	private MBTITestResultDAO mBTITestResultDao;
	
	public MBTITestResultService(MBTITestResultDAO mBTITestResultDao) {
		this.mBTITestResultDao = mBTITestResultDao;		 
	}
	
	@Transactional
	public void saveMBTITestResult(MBTITestResultDTO mBTITestResultDto) {
		if(mBTITestResultDto.getMemberSeq() == null) {
			throw new IllegalArgumentException("회원 번호가 누락되었습니다.");
		}
		mBTITestResultDao.insertMBTITestResult(mBTITestResultDto);
	}
	
	@Transactional(readOnly = true)
	public MBTITestResultDTO getLatestResult(Long memberSeq) {
		return mBTITestResultDao.selectLatestResultByMember(memberSeq);
	}
	
}
