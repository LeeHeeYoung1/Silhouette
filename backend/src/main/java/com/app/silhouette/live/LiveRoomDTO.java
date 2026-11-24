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

    public Long getLiveRoomSeq() { return live_room_seq; }
    public void setLiveRoomSeq(Long live_room_seq) { this.live_room_seq = live_room_seq; }

    public Long getHostSeq() { return host_seq; }
    public void setHostSeq(Long host_seq) { this.host_seq = host_seq; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getThumbnailUrl() { return thumbnail_url; }
    public void setThumbnailUrl(String thumbnail_url) { this.thumbnail_url = thumbnail_url; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Date getStartedAt() { return started_at; }
    public void setStartedAt(Date started_at) { this.started_at = started_at; }

    public Date getEndedAt() { return ended_at; }
    public void setEndedAt(Date ended_at) { this.ended_at = ended_at; }

    public Date getCreatedAt() { return created_at; }
    public void setCreatedAt(Date created_at) { this.created_at = created_at; }

    public Date getDisconnectedAt() { return disconnected_at; }
    public void setDisconnectedAt(Date disconnected_at) { this.disconnected_at = disconnected_at; }

    public String getEndedBy() { return ended_by; }
    public void setEndedBy(String ended_by) { this.ended_by = ended_by; }

    public String getEndReason() { return end_reason; }
    public void setEndReason(String end_reason) { this.end_reason = end_reason; }

    public String getHostLoginId() { return host_login_id; }
    public void setHostLoginId(String host_login_id) { this.host_login_id = host_login_id; }

    public String getHostNickname() { return host_nickname; }
    public void setHostNickname(String host_nickname) { this.host_nickname = host_nickname; }

    public Integer getViewerCount() { return viewer_count; }
    public void setViewerCount(Integer viewer_count) { this.viewer_count = viewer_count; }

    public String getHashtagText() { return hashtag_text; }
    public void setHashtagText(String hashtag_text) { this.hashtag_text = hashtag_text; }

    public List<String> getHashtags() { return hashtags; }
    public void setHashtags(List<String> hashtags) { this.hashtags = hashtags; }
}
