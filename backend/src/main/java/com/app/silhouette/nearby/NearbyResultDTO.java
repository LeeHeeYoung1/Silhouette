package com.app.silhouette.nearby;

import java.util.List;

// GET /matching/nearby 응답
public class NearbyResultDTO {

    private String my_region;                 // 내 지역 (주소가 없으면 null)
    private List<NearbyMemberDTO> members;   // 최대 10명

    public NearbyResultDTO() {
    }

    public NearbyResultDTO(String my_region, List<NearbyMemberDTO> members) {
        this.my_region = my_region;
        this.members = members;
    }

    public String getMyRegion() { return my_region; }
    public void setMyRegion(String my_region) { this.my_region = my_region; }

    public List<NearbyMemberDTO> getMembers() { return members; }
    public void setMembers(List<NearbyMemberDTO> members) { this.members = members; }
}
