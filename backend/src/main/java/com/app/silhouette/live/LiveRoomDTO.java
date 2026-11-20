package com.app.silhouette.live;

import java.util.Date;
import java.util.List;

// LIVE_ROOM + 조회용 부가 정보(방송자 정보, 시청자 수, 해시태그)
public class LiveRoomDTO {

    private Long live_room_seq;
    private Long host_seq;
    private String title;
    private String description;
    private String thumbnail_url;
    private String status;           // LIVE / ENDED
    private String category;         // TALK / MUKBANG / MUSIC / TRAVEL / STUDY / ETC
    private Date started_at;
    private Date ended_at;
    private Date created_at;
    private Date disconnected_at;
    private String ended_by;         // HOST / TIMEOUT / ADMIN
    private String end_reason;

    // 조회용 (MEMBER 조인, 집계)
    private String host_login_id;
    private String host_nickname;
    private Integer viewer_count;
    private String hashtag_text;     // 목록 조회 시 LISTAGG 결과 (콤마 구분)
    private List<String> hashtags;

    public LiveRoomDTO() {}

    public Long getLive_room_seq() { return live_room_seq; }
    public void setLive_room_seq(Long live_room_seq) { this.live_room_seq = live_room_seq; }

    public Long getHost_seq() { return host_seq; }
    public void setHost_seq(Long host_seq) { this.host_seq = host_seq; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getThumbnail_url() { return thumbnail_url; }
    public void setThumbnail_url(String thumbnail_url) { this.thumbnail_url = thumbnail_url; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Date getStarted_at() { return started_at; }
    public void setStarted_at(Date started_at) { this.started_at = started_at; }

    public Date getEnded_at() { return ended_at; }
    public void setEnded_at(Date ended_at) { this.ended_at = ended_at; }

    public Date getCreated_at() { return created_at; }
    public void setCreated_at(Date created_at) { this.created_at = created_at; }

    public Date getDisconnected_at() { return disconnected_at; }
    public void setDisconnected_at(Date disconnected_at) { this.disconnected_at = disconnected_at; }

    public String getEnded_by() { return ended_by; }
    public void setEnded_by(String ended_by) { this.ended_by = ended_by; }

    public String getEnd_reason() { return end_reason; }
    public void setEnd_reason(String end_reason) { this.end_reason = end_reason; }

    public String getHost_login_id() { return host_login_id; }
    public void setHost_login_id(String host_login_id) { this.host_login_id = host_login_id; }

    public String getHost_nickname() { return host_nickname; }
    public void setHost_nickname(String host_nickname) { this.host_nickname = host_nickname; }

    public Integer getViewer_count() { return viewer_count; }
    public void setViewer_count(Integer viewer_count) { this.viewer_count = viewer_count; }

    public String getHashtag_text() { return hashtag_text; }
    public void setHashtag_text(String hashtag_text) { this.hashtag_text = hashtag_text; }

    public List<String> getHashtags() { return hashtags; }
    public void setHashtags(List<String> hashtags) { this.hashtags = hashtags; }
}
