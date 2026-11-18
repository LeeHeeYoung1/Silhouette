package com.app.silhouette.live;

import java.util.Date;

public class LiveDTO {

    private Integer live_Seq;
    private Integer member_Seq;
    private String title;
    private String room_Name;
    private Date started_At;
    private Date ended_At;

    // 목록 조회용 (MEMBER 조인)
    private String login_Id;
    private String nickname;

    public LiveDTO() {
    }

    public Integer getLive_Seq() {
        return live_Seq;
    }

    public void setLive_Seq(Integer live_Seq) {
        this.live_Seq = live_Seq;
    }

    public Integer getMember_Seq() {
        return member_Seq;
    }

    public void setMember_Seq(Integer member_Seq) {
        this.member_Seq = member_Seq;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getRoom_Name() {
        return room_Name;
    }

    public void setRoom_Name(String room_Name) {
        this.room_Name = room_Name;
    }

    public Date getStarted_At() {
        return started_At;
    }

    public void setStarted_At(Date started_At) {
        this.started_At = started_At;
    }

    public Date getEnded_At() {
        return ended_At;
    }

    public void setEnded_At(Date ended_At) {
        this.ended_At = ended_At;
    }

    public String getLogin_Id() {
        return login_Id;
    }

    public void setLogin_Id(String login_Id) {
        this.login_Id = login_Id;
    }

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }
}