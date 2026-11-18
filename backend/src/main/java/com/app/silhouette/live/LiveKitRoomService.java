package com.app.silhouette.live;

import java.io.IOException;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.livekit.server.RoomServiceClient;
import livekit.LivekitModels;
import retrofit2.Response;

@Service
public class LiveKitRoomService {

    private final RoomServiceClient client;

    public LiveKitRoomService(@Value("${livekit.url}") String url,
            @Value("${livekit.api-key}") String apiKey,
            @Value("${livekit.api-secret}") String apiSecret) {
        // 방 조회 API는 wss가 아니라 https 주소를 씀
        String httpUrl = url.replaceFirst("^wss://", "https://").replaceFirst("^ws://", "http://");
        this.client = RoomServiceClient.create(httpUrl, apiKey, apiSecret);
    }

    // 방송자가 방에 접속해 있는지
    // true: 접속 중 / false: 나감(방 없음 포함) / null: 확인 실패
    public Boolean isHostConnected(String roomName, String hostId) {
        try {
            Response<List<LivekitModels.ParticipantInfo>> res =
                    client.listParticipants(roomName).execute();

            if (res.code() == 404) {
                return false;              // 방 자체가 없음 → 다 나감
            }
            if (!res.isSuccessful() || res.body() == null) {
                return null;
            }

            for (LivekitModels.ParticipantInfo p : res.body()) {
                if (hostId.equals(p.getIdentity())) {
                    return true;
                }
            }
            return false;                  // 방은 있는데 방송자는 없음 (시청자만 남음)

        } catch (IOException e) {
            return null;
        }
    }
}