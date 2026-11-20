package com.app.silhouette.live;

import java.io.IOException;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.livekit.server.RoomServiceClient;
import livekit.LivekitModels;
import retrofit2.Response;

// LiveKit 서버 API (방 조회, 강제 퇴장, 방 삭제)
@Service
public class LiveKitRoomService {

    private final RoomServiceClient client;

    public LiveKitRoomService(@Value("${livekit.url}") String url,
            @Value("${livekit.api-key}") String apiKey,
            @Value("${livekit.api-secret}") String apiSecret) {
        // 서버 API는 wss가 아니라 https 주소를 씀
        String httpUrl = url.replaceFirst("^wss://", "https://").replaceFirst("^ws://", "http://");
        this.client = RoomServiceClient.create(httpUrl, apiKey, apiSecret);
    }

    // LIVE_ROOM 번호 → LiveKit 방 이름
    public static String roomName(long liveRoomSeq) {
        return "live-" + liveRoomSeq;
    }

    // LiveKit 방 이름 → LIVE_ROOM 번호 (형식이 다르면 null)
    public static Long parseRoomName(String roomName) {
        if (roomName == null || !roomName.startsWith("live-")) {
            return null;
        }
        try {
            return Long.valueOf(roomName.substring("live-".length()));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    // 해당 identity가 방에 접속해 있는지
    // true: 접속 중 / false: 없음(방 없음 포함) / null: 확인 실패
    public Boolean isConnected(String roomName, String identity) {
        try {
            Response<List<LivekitModels.ParticipantInfo>> res =
                    client.listParticipants(roomName).execute();

            if (res.code() == 404) {
                return false;
            }
            if (!res.isSuccessful() || res.body() == null) {
                return null;
            }
            for (LivekitModels.ParticipantInfo p : res.body()) {
                if (identity.equals(p.getIdentity())) {
                    return true;
                }
            }
            return false;
        } catch (IOException e) {
            return null;
        }
    }

    // 참가자 강제 퇴장 (이미 나갔으면 무시)
    public void removeParticipant(String roomName, String identity) {
        try {
            client.removeParticipant(roomName, identity).execute();
        } catch (IOException e) {
            // 연결 실패해도 DB 상태(KICKED_YN)로 재입장은 막힘
        }
    }

    // 방 삭제 → 남은 접속자 전부 연결 해제 (방이 없으면 무시)
    public void deleteRoom(String roomName) {
        try {
            client.deleteRoom(roomName).execute();
        } catch (IOException e) {
            // 실패해도 빈 방은 LiveKit이 알아서 정리함
        }
    }
}
