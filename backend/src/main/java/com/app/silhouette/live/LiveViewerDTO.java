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

    public Long getMember_seq() { return member_seq; }
    public void setMember_seq(Long member_seq) { this.member_seq = member_seq; }

    public String getLogin_id() { return login_id; }
    public void setLogin_id(String login_id) { this.login_id = login_id; }

    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }

    public Date getJoined_at() { return joined_at; }
    public void setJoined_at(Date joined_at) { this.joined_at = joined_at; }

    public Date getBanned_at() { return banned_at; }
    public void setBanned_at(Date banned_at) { this.banned_at = banned_at; }
}
