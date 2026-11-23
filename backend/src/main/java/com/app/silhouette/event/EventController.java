package com.app.silhouette.event;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/event")
public class EventController {
	
	public final FoodTestResultService foodTestResultService;
	
	public EventController(FoodTestResultService foodTestResultService) {
		this.foodTestResultService = foodTestResultService;
	}
	
	 @PostMapping("/food-test")
	 public ResponseEntity<?> saveFoodTestResult(@RequestBody FoodTestResultDTO dto) {
	     try {
	         foodTestResultService.saveResult(dto);
	         return ResponseEntity.ok(Map.of(
	             "success", true,
	             "message", "음식 성향 테스트 결과가 저장되었습니다."
	         ));
	     } catch (Exception e) {
	         return ResponseEntity.badRequest().body(Map.of(
	             "success", false,
	             "message", e.getMessage()
	         ));
	     }
	 }
	 // 2. 음식 취향 테스트 최근 결과 조회: GET /api/event/food-test/latest?memberSeq=...
  @GetMapping("/food-test/latest")
  public ResponseEntity<?> getLatestFoodTestResult(@RequestParam("memberSeq") Long memberSeq) {
	     FoodTestResultDTO result = foodTestResultService.getLatestResult(memberSeq);
	     return ResponseEntity.ok(result);
  }
	    
}
