package com.app.silhouette.nearby;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/matching/nearby")
public class NearbyController {

    private final NearbyService service;

    public NearbyController(NearbyService service) {
        this.service = service;
    }

    // 내 주변 추천 (호출할 때마다 순서가 랜덤으로 바뀜 → "새로운 이웃 추천" 버튼도 이 API 재호출)
    @GetMapping
    public ResponseEntity<NearbyResultDTO> nearby(@RequestAttribute("id") String loginId) {
        return ResponseEntity.ok(service.findNearby(loginId));
    }
}
