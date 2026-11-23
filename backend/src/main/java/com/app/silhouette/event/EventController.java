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
	
	private final FoodTestResultService foodTestResultService;
	private final LoveValueTestResultService loveValueTestResultService;
	private final MBTITestResultService mBTITestResultService;
	private final EventSpecialService eventSpecialService;
	
	public EventController(FoodTestResultService foodTestResultService, LoveValueTestResultService loveValueTestResultService 
			,MBTITestResultService mBTITestResultService, EventSpecialService eventSpecialService) {
		this.foodTestResultService = foodTestResultService;
		this.loveValueTestResultService = loveValueTestResultService;
		this.mBTITestResultService = mBTITestResultService;
		this.eventSpecialService = eventSpecialService;
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
	  
	  
	  @PostMapping("/love-value-test")
	  public ResponseEntity<?> saveLoveValueTestResult(@RequestBody LoveValueTestResultDTO loveValueTestResultDto) {
		  try {
			  loveValueTestResultService.saveLoveValueTestResult(loveValueTestResultDto);
			  return ResponseEntity.ok(Map.of("success", true, "message", "얀애 가치관 진단 결과가 저장되었습니다."));
		  } catch (Exception e){
			  return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
		  }
	  }
	  
	  @GetMapping("/love-value-test/latest")
	  public ResponseEntity<?> getLatestLoveValueTestResult(@RequestParam("memberSeq") Long memberSeq) {
		  LoveValueTestResultDTO result = loveValueTestResultService.getLatestResult(memberSeq);
		  return ResponseEntity.ok(result);
	  }
	  
	  @PostMapping("/mbti-test")
	  public ResponseEntity<?> asveMBTITestResult(@RequestBody MBTITestResultDTO mBTITestResultDto) {
		  try {
			  mBTITestResultService.saveMBTITestResult(mBTITestResultDto);
			  return ResponseEntity.ok(Map.of("success", true, "message", "MBTI 연애 스타일 결과가 저장되었습니다."));
		  } catch (Exception e){
			  return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
		  }
	  }
	  
	  @GetMapping("/mbti-test/latest")
	  public ResponseEntity<?> getLatestMBTITestResult(@RequestParam("memberSeq") Long memberSeq) {
		  MBTITestResultDTO result = mBTITestResultService.getLatestResult(memberSeq);
		  return ResponseEntity.ok(result);
	  }
	  
	  @PostMapping("/roulette")
	    public ResponseEntity<?> spinDailyRoulette(@RequestBody Map<String, Long> body) {
	        try {
	            return ResponseEntity.ok(eventSpecialService.spinDailyRoulette(body.get("memberSeq")));
	        } catch (IllegalStateException | IllegalArgumentException e) {
	            return ResponseEntity.badRequest().body(Map.of(
	                "success", false,
	                "message", e.getMessage()
	            ));
	        }
	    }

	    @PostMapping("/all-tests-reward")
	    public ResponseEntity<?> claimAllTestsReward(@RequestBody Map<String, Long> body) {
	        try {
	            return ResponseEntity.ok(eventSpecialService.claimAllTestsReward(body.get("memberSeq")));
	        } catch (IllegalStateException | IllegalArgumentException e) {
	            return ResponseEntity.badRequest().body(Map.of(
	                "success", false,
	                "message", e.getMessage()
	            ));
	        }
	    }
	  
	    @GetMapping("/quest-status")
	    public ResponseEntity<?> getQuestStatus(@RequestParam("memberSeq") Long memberSeq) {
	        return ResponseEntity.ok(eventSpecialService.getQuestStatus(memberSeq));
	    }
	    
	 // 10. 첫 블라인드 채팅 완주 보너스 지급: POST /api/event/first-chat-reward
	    @PostMapping("/first-chat-reward")
	    public ResponseEntity<?> claimFirstBlindChatReward(@RequestBody Map<String, Long> body) {
	        try {
	            return ResponseEntity.ok(eventSpecialService.claimFirstBlindChatReward(body.get("memberSeq")));
	        } catch (IllegalStateException | IllegalArgumentException e) {
	            return ResponseEntity.badRequest().body(Map.of(
	                "success", false,
	                "message", e.getMessage()
	            ));
	        }
	    }
	    
}
