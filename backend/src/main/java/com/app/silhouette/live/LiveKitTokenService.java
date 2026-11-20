package com.app.silhouette.live;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.livekit.server.AccessToken;
import io.livekit.server.CanPublish;
import io.livekit.server.CanPublishData;
import io.livekit.server.CanSubscribe;
import io.livekit.server.RoomJoin;
import io.livekit.server.RoomName;

@Service
public class LiveKitTokenService {

    @Value("${livekit.api-key}")
    private String apiKey;

    @Value("${livekit.api-secret}")
    private String apiSecret;

    // identity는 반드시 서버에서 확인한 회원 번호를 넣는다 (클라이언트 값 사용 금지)
    public String createToken(String roomName, long memberSeq, String displayName, boolean canPublish) {
        AccessToken token = new AccessToken(apiKey, apiSecret);
        token.setIdentity(String.valueOf(memberSeq));
        token.setName(displayName);
        token.addGrants(
            new RoomJoin(true),
            new RoomName(roomName),
            new CanPublish(canPublish),
            new CanPublishData(false),   // 채팅은 STOMP로만
            new CanSubscribe(true)
        );
        return token.toJwt();
    }
}
