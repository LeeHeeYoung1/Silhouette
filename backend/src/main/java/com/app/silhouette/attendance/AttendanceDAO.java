package com.app.silhouette.attendance;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class AttendanceDAO {

	private final SqlSessionTemplate mybatis;
    private static final String NAMESPACE = "AttendanceMapper.";

    public AttendanceDAO(SqlSessionTemplate sqlSession) {
        this.mybatis = sqlSession;
    }

    public List<AttendanceDTO> selectWeeklyAttendance(Long memberSeq, LocalDate startDate, LocalDate endDate) {
        Map<String, Object> params = new HashMap<>();
        params.put("memberSeq", memberSeq);
        params.put("startDate", startDate);
        params.put("endDate", endDate);
        return mybatis.selectList(NAMESPACE + "selectWeeklyAttendance", params);
    }

    public AttendanceDTO selectAttendanceByDate(Long memberSeq, LocalDate targetDate) {
        Map<String, Object> params = new HashMap<>();
        params.put("memberSeq", memberSeq);
        params.put("targetDate", targetDate);
        return mybatis.selectOne(NAMESPACE + "selectAttendanceByDate", params);
    }

    public int insertAttendance(AttendanceDTO dto) {
        return mybatis.insert(NAMESPACE + "insertAttendance", dto);
    }

    public int selectLatestMileageBalance(Long memberSeq) {
        Integer balance = mybatis.selectOne(NAMESPACE + "selectLatestMileageBalance", memberSeq);
        return balance != null ? balance : 0;
    }

    public int insertMileageLedger(Long memberSeq, String sourceType, int changeAmount, int balanceAfter, String description) {
        Map<String, Object> params = new HashMap<>();
        params.put("memberSeq", memberSeq);
        params.put("sourceType", sourceType);
        params.put("changeAmount", changeAmount);
        params.put("balanceAfter", balanceAfter);
        params.put("description", description);
        return mybatis.insert(NAMESPACE + "insertMileageLedger", params);
    }

    public int selectLatestTicketBalance(Long memberSeq) {
        Integer balance = mybatis.selectOne(NAMESPACE + "selectLatestTicketBalance", memberSeq);
        return balance != null ? balance : 0;
    }

    public int insertTicketLedger(Long memberSeq, String sourceType, int changeAmount, int balanceAfter, String description) {
        Map<String, Object> params = new HashMap<>();
        params.put("memberSeq", memberSeq);
        params.put("sourceType", sourceType);
        params.put("changeAmount", changeAmount);
        params.put("balanceAfter", balanceAfter);
        params.put("description", description);
        return mybatis.insert(NAMESPACE + "insertTicketLedger", params);
    }
}