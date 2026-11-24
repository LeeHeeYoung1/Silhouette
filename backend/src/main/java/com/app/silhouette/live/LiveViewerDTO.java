package com.app.silhouette.live;

import java.util.Date;

// 시청자 목록 / 차단 목록 공용
public class LiveViewerDTO {

    private Long member_seq;
    private String login_id;
    private String nickname;
    private Date joined_at;      // 시청자 목록
    private Date banned_at;      // 차단 목록

    public LiveViewerDTO() {}

    public Long getMemberSeq() { return member_seq; }
    public void setMemberSeq(Long member_seq) { this.member_seq = member_seq; }

    public String getLoginId() { return login_id; }
    public void setLoginId(String login_id) { this.login_id = login_id; }

    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }

    public Date getJoinedAt() { return joined_at; }
    public void setJoinedAt(Date joined_at) { this.joined_at = joined_at; }

    public Date getBannedAt() { return banned_at; }
    public void setBannedAt(Date banned_at) { this.banned_at = banned_at; }
}
