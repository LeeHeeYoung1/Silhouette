package com.app.silhouette.nearby;

import java.util.List;

import org.springframework.stereotype.Service;

@Service
public class NearbyService {

    // 한 번에 보여줄 최대 인원
    private static final int MAX_COUNT = 10;

    private final NearbyDAO dao;

    NearbyService(NearbyDAO dao) {
        this.dao = dao;
    }

    public NearbyResultDTO findNearby(String loginId) {
        String myRegion = dao.selectMyRegion(loginId);

        // 주소가 없으면 비교 기준이 없으므로 빈 목록
        if (myRegion == null || myRegion.isBlank()) {
            return new NearbyResultDTO(null, List.of());
        }

        return new NearbyResultDTO(myRegion, dao.selectNearbyMembers(loginId, MAX_COUNT));
    }
}
