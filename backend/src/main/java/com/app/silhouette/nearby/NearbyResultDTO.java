package com.app.silhouette.nearby;

import java.util.List;

// GET /matching/nearby 응답
public class NearbyResultDTO {

    private String myRegion;                 // 내 지역 (주소가 없으면 null)
    private List<NearbyMemberDTO> members;   // 최대 10명

    public NearbyResultDTO() {
    }

    public NearbyResultDTO(String myRegion, List<NearbyMemberDTO> members) {
        this.myRegion = myRegion;
        this.members = members;
    }

    public String getMyRegion() { return myRegion; }
    public void setMyRegion(String myRegion) { this.myRegion = myRegion; }

    public List<NearbyMemberDTO> getMembers() { return members; }
    public void setMembers(List<NearbyMemberDTO> members) { this.members = members; }
}
