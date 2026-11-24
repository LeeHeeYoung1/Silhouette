package com.app.silhouette.beautytest;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.app.silhouette.commons.AuthMemberDTO;
import com.app.silhouette.commons.AuthMemberService;

@RestController
@RequestMapping("/api/beauty-test")
public class BeautyTestController {

	@Autowired
	private BeautyTestService beautyTestService;

	@Autowired
	private AuthMemberService authMemberService;

	// 테스트 실행: 사진 1~4장 업로드 → 동일 인물 확인 → 평균 결과 반환
	@PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<?> runTest(
			@RequestHeader(value = "Authorization", required = false) String auth,
			@RequestParam(value = "files", required = false) List<MultipartFile> files) {
		try {
			AuthMemberDTO me = authMemberService.loginMember(auth);   // 토큰 없으면 401
			BeautyTestDTO result = beautyTestService.runTest(me.getMemberSeq(), me.isAdmin(), files);
			return ResponseEntity.ok(result);
		} catch (ResponseStatusException e) {
			return errorResponse(e);
		}
	}

	// 테스트 가능 여부: { canTest, nextAvailableAt, nextAvailableText }
	@GetMapping("/me/status")
	public ResponseEntity<?> myStatus(@RequestHeader(value = "Authorization", required = false) String auth) {
		try {
			AuthMemberDTO me = authMemberService.loginMember(auth);
			return ResponseEntity.ok(beautyTestService.getStatus(me.getMemberSeq(), me.isAdmin()));
		} catch (ResponseStatusException e) {
			return errorResponse(e);
		}
	}

	// 내 테스트 기록 전체 (최신순)
	@GetMapping("/me")
	public ResponseEntity<?> myTests(@RequestHeader(value = "Authorization", required = false) String auth) {
		try {
			AuthMemberDTO me = authMemberService.loginMember(auth);
			List<BeautyTestDTO> list = beautyTestService.getMyTests(me.getMemberSeq());
			return ResponseEntity.ok(list);
		} catch (ResponseStatusException e) {
			return errorResponse(e);
		}
	}

	// 내 최신 결과 1개 (없으면 { "result": null })
	@GetMapping("/me/latest")
	public ResponseEntity<?> myLatest(@RequestHeader(value = "Authorization", required = false) String auth) {
		try {
			AuthMemberDTO me = authMemberService.loginMember(auth);
			Map<String, Object> body = new HashMap<>();
			body.put("result", beautyTestService.getLatest(me.getMemberSeq()));
			return ResponseEntity.ok(body);
		} catch (ResponseStatusException e) {
			return errorResponse(e);
		}
	}

	// 오류를 { "message": "..." } 형태로 React에 전달
	private ResponseEntity<Map<String, Object>> errorResponse(ResponseStatusException e) {
		Map<String, Object> body = new HashMap<>();
		body.put("message", e.getReason() != null ? e.getReason() : "요청을 처리할 수 없습니다.");
		return ResponseEntity.status(e.getStatusCode()).body(body);
	}
}
