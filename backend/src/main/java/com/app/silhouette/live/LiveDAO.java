package com.app.silhouette.live;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class LiveDAO {

    private static final String NS = "Live.";

    private final SqlSessionTemplate mybatis;

    LiveDAO(SqlSessionTemplate mybatis) {
        this.mybatis = mybatis;
    }

    // ===== 회원 =====

    // 로그인 아이디 → 회원 번호 (없으면 null)
    public Long selectMemberSeqByLoginId(String loginId) {
        return mybatis.selectOne(NS + "selectMemberSeqByLoginId", loginId);
    }

    public boolean isAdmin(String loginId) {
        int cnt = mybatis.selectOne(NS + "countAdmin", loginId);
        return cnt > 0;
    }

    public LiveProfileDTO selectProfile(long memberSeq) {
        return mybatis.selectOne(NS + "selectProfile", memberSeq);
    }

    public String selectNickname(long memberSeq) {
        return mybatis.selectOne(NS + "selectNickname", memberSeq);
    }

    // ===== 방송 =====

    public LiveRoomDTO selectLiveRoom(long liveRoomSeq) {
        return mybatis.selectOne(NS + "selectLiveRoom", liveRoomSeq);
    }

    public LiveRoomDTO selectMyOnAir(long hostSeq) {
        return mybatis.selectOne(NS + "selectMyOnAir", hostSeq);
    }

    // params: category, keyword, startRow, endRow
    public List<LiveRoomDTO> selectLiveList(Map<String, Object> params) {
        return mybatis.selectList(NS + "selectLiveList", params);
    }

    // 실행 후 dto.live_room_seq가 채워짐
    public int insertLiveRoom(LiveRoomDTO dto) {
        return mybatis.insert(NS + "insertLiveRoom", dto);
    }

    // 이미 종료된 방송이면 0
    public int endLiveRoom(long liveRoomSeq, String endedBy, String endReason) {
        return mybatis.update(NS + "endLiveRoom",
                Map.of("liveRoomSeq", liveRoomSeq, "endedBy", endedBy,
                       "endReason", endReason == null ? "" : endReason));
    }

    // 방송 중이 아니면 0
    public int updateLiveRoom(LiveRoomDTO dto) {
        return mybatis.update(NS + "updateLiveRoom", dto);
    }

    public int markHostDisconnected(long liveRoomSeq) {
        return mybatis.update(NS + "markHostDisconnected", liveRoomSeq);
    }

    public int clearHostDisconnected(long liveRoomSeq) {
        return mybatis.update(NS + "clearHostDisconnected", liveRoomSeq);
    }

    public List<Long> selectTimedOutRooms(int seconds) {
        return mybatis.selectList(NS + "selectTimedOutRooms", seconds);
    }

    // ===== 해시태그 =====

    public int insertHashtag(long liveRoomSeq, String tag) {
        return mybatis.insert(NS + "insertHashtag", Map.of("liveRoomSeq", liveRoomSeq, "tag", tag));
    }

    public int deleteHashtags(long liveRoomSeq) {
        return mybatis.delete(NS + "deleteHashtags", liveRoomSeq);
    }

    public List<String> selectHashtags(long liveRoomSeq) {
        return mybatis.selectList(NS + "selectHashtags", liveRoomSeq);
    }

    // ===== 시청자 =====

    public int countActiveViewers(long liveRoomSeq) {
        return mybatis.selectOne(NS + "countActiveViewers", liveRoomSeq);
    }

    public boolean isKicked(long liveRoomSeq, long memberSeq) {
        int cnt = mybatis.selectOne(NS + "countKicked",
                Map.of("liveRoomSeq", liveRoomSeq, "memberSeq", memberSeq));
        return cnt > 0;
    }

    public boolean isBanned(long hostSeq, long memberSeq) {
        int cnt = mybatis.selectOne(NS + "countBanned",
                Map.of("hostSeq", hostSeq, "memberSeq", memberSeq));
        return cnt > 0;
    }

    public int insertViewer(long liveRoomSeq, long memberSeq) {
        return mybatis.insert(NS + "insertViewer",
                Map.of("liveRoomSeq", liveRoomSeq, "memberSeq", memberSeq));
    }

    public int closeViewer(long liveRoomSeq, long memberSeq) {
        return mybatis.update(NS + "closeViewer",
                Map.of("liveRoomSeq", liveRoomSeq, "memberSeq", memberSeq));
    }

    public int closeAllViewers(long liveRoomSeq) {
        return mybatis.update(NS + "closeAllViewers", liveRoomSeq);
    }

    public List<LiveViewerDTO> selectViewers(long liveRoomSeq) {
        return mybatis.selectList(NS + "selectViewers", liveRoomSeq);
    }

    // 이 방송에 시청 기록이 없으면 0
    public int kickViewer(long liveRoomSeq, long memberSeq) {
        return mybatis.update(NS + "kickViewer",
                Map.of("liveRoomSeq", liveRoomSeq, "memberSeq", memberSeq));
    }
    

    public int unkickViewer(long liveRoomSeq, long memberSeq) {
        return mybatis.update(NS + "unkickViewer",
                Map.of("liveRoomSeq", liveRoomSeq, "memberSeq", memberSeq));
    }

    // ===== 차단 =====

    public boolean existsMember(long memberSeq) {
        int cnt = mybatis.selectOne(NS + "countMember", memberSeq);
        return cnt > 0;
    }

    // 이미 차단돼 있으면 DuplicateKeyException (UQ_LIVE_BAN)
    public int insertBan(long hostSeq, long memberSeq) {
        return mybatis.insert(NS + "insertBan", Map.of("hostSeq", hostSeq, "memberSeq", memberSeq));
    }

    public int deleteBan(long hostSeq, long memberSeq) {
        return mybatis.delete(NS + "deleteBan", Map.of("hostSeq", hostSeq, "memberSeq", memberSeq));
    }

    public List<LiveViewerDTO> selectBans(long hostSeq) {
        return mybatis.selectList(NS + "selectBans", hostSeq);
    }

    // ===== 채팅 =====

    public boolean isWatching(long liveRoomSeq, long memberSeq) {
        int cnt = mybatis.selectOne(NS + "countWatching",
                Map.of("liveRoomSeq", liveRoomSeq, "memberSeq", memberSeq));
        return cnt > 0;
    }

    // 저장 후 LIVE_CHAT_SEQ 반환
    public long insertChat(long liveRoomSeq, long memberSeq, String content) {
        Map<String, Object> params = new HashMap<>();
        params.put("liveRoomSeq", liveRoomSeq);
        params.put("memberSeq", memberSeq);
        params.put("content", content);
        mybatis.insert(NS + "insertChat", params);
        return (Long) params.get("liveChatSeq");
    }

    public List<String> selectFilterWords() {
        return mybatis.selectList(NS + "selectFilterWords");
    }

    public int deleteChatsExceptReported(long liveRoomSeq) {
        return mybatis.delete(NS + "deleteChatsExceptReported", liveRoomSeq);
    }

    // ===== 신고 =====

    public LiveMessageDTO selectChat(long liveChatSeq) {
        return mybatis.selectOne(NS + "selectChat", liveChatSeq);
    }

    public boolean hasPendingReport(long liveRoomSeq, Long liveChatSeq, long reporterSeq) {
        Map<String, Object> params = new HashMap<>();
        params.put("liveRoomSeq", liveRoomSeq);
        params.put("liveChatSeq", liveChatSeq);
        params.put("reporterSeq", reporterSeq);
        int cnt = mybatis.selectOne(NS + "countPendingReport", params);
        return cnt > 0;
    }

    public int insertReport(LiveReportDTO dto) {
        return mybatis.insert(NS + "insertReport", dto);
    }

    // params: status(null이면 전체), startRow, endRow
    public List<LiveReportDTO> selectReports(Map<String, Object> params) {
        return mybatis.selectList(NS + "selectReports", params);
    }

    public int updateReportDone(long liveReportSeq) {
        return mybatis.update(NS + "updateReportDone", liveReportSeq);
    }

    public int updateReportsDoneByRoom(long liveRoomSeq) {
        return mybatis.update(NS + "updateReportsDoneByRoom", liveRoomSeq);
    }
}
