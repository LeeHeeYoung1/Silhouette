package com.app.silhouette.live;

import com.app.silhouette.live.LiveKitTokenService;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/live-test")
@CrossOrigin(origins = "http://localhost:5173")
public class LiveTestController {

    private final LiveKitTokenService tokenService;

    @Value("${livekit.url}")
    private String livekitUrl;

    public LiveTestController(LiveKitTokenService tokenService) {
        this.tokenService = tokenService;
    }

    @GetMapping("/token")
    public Map<String, String> token(@RequestParam String room,
                                     @RequestParam String identity,
                                     @RequestParam(defaultValue = "false") boolean host) {
        return Map.of("token", tokenService.createToken(room, identity, host),
                      "url", livekitUrl);
    }
}