package com.app.silhouette.live;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.google.auth.oauth2.AccessToken;

import io.livekit.server.CanPublish;
import io.livekit.server.CanSubscribe;
import io.livekit.server.RoomJoin;
import io.livekit.server.RoomName;

@Service
public class LiveKitTokenService {

    @Value("${livekit.api-key}")
    private String apiKey;

    @Value("${livekit.api-secret}")
    private String apiSecret;

    public String createToken(String roomName, String identity, boolean canPublish) {
        AccessToken token = new AccessToken(apiKey, apiSecret);
        token.setIdentity(identity);
        token.setName(identity);
        token.addGrants(
            new RoomJoin(true),
            new RoomName(roomName),
            new CanPublish(canPublish),
            new CanSubscribe(true)
        );
        return token.toJwt();
    }
}