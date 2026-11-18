package com.app.silhouette.live;

import java.util.List;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class LiveDAO {

    private static final String NS = "Live.";

    private final SqlSessionTemplate mybatis;

    LiveDAO(SqlSessionTemplate mybatis) {
        this.mybatis = mybatis;
    }

    // 로그인 아이디 → 회원 번호 (없으면 null)
    public Integer selectMemberSeqByLoginId(String loginId) {
        return mybatis.selectOne(NS + "selectMemberSeqByLoginId", loginId);
    }

    // 내 방송 중인 방송 종료 처리 (없으면 0)
    public int endMyLive(int memberSeq) {
        return mybatis.update(NS + "endMyLive", memberSeq);
    }

    // 방송 시작 (실행 후 dto에 live_Seq가 채워짐)
    public int insertLive(LiveDTO dto) {
        return mybatis.insert(NS + "insertLive", dto);
    }

    // 방송 중인 목록
    public List<LiveDTO> selectOnAirList() {
        return mybatis.selectList(NS + "selectOnAirList");
    }

    // 방송 중인 방송 1개 (종료됐거나 없으면 null)
    public LiveDTO selectOnAir(int liveSeq) {
        return mybatis.selectOne(NS + "selectOnAir", liveSeq);
    }
    // 유령 방송 종료 (시작 30초 이내면 0)
    public int endGhostLive(int liveSeq) {
        return mybatis.update(NS + "endGhostLive", liveSeq);
    }
}