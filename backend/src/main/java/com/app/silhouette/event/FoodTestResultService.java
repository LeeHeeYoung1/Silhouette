package com.app.silhouette.event;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FoodTestResultService {
	
	private final FoodTestResultDAO foodTestResultDao;
	
	public FoodTestResultService(FoodTestResultDAO foodTestResultDao) {
		this.foodTestResultDao = foodTestResultDao;
	}
	
	@Transactional
    public void saveResult(FoodTestResultDTO foodTestResultDto) {
        if (foodTestResultDto.getMemberSeq() == null) {
            throw new IllegalArgumentException("회원 번호는 필수입니다.");
        }
        foodTestResultDao.insertResult(foodTestResultDto);
    }
    public FoodTestResultDTO getLatestResult(Long memberSeq) {
        return foodTestResultDao.selectLatestResult(memberSeq);
    }
	
	
}
