package com.app.silhouette.event;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LoveValueTestResultService {
	
	private LoveValueTestResultDAO loveValueTestResultDao;
	
	public LoveValueTestResultService(LoveValueTestResultDAO loveValueTestResultDao) {
		this.loveValueTestResultDao = loveValueTestResultDao;
	}
	
	@Transactional 
	public void saveLoveValueTestResult(LoveValueTestResultDTO loveValueTestResultDto) {
		if(loveValueTestResultDto.getMemberSeq() == null) {
			throw new IllegalArgumentException("회원 번호가 누락되었습니다.");
		}
		loveValueTestResultDao.insertLoveValueTestResult(loveValueTestResultDto);
	}
	
	@Transactional(readOnly = true)
	public LoveValueTestResultDTO getLatestResult(Long memberSeq) {
		return loveValueTestResultDao.selectLatestResultByMember(memberSeq);
	}
	
}
