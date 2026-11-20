package com.app.silhouette.live;

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

    // ===== 채팅 =====

    public int deleteChatsExceptReported(long liveRoomSeq) {
        return mybatis.delete(NS + "deleteChatsExceptReported", liveRoomSeq);
    }
}
