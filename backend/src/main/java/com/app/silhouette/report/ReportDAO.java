package com.app.silhouette.report;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

@Repository
public class ReportDAO {

    private static final String NS = "Report.";

    @Autowired
    private SqlSessionTemplate sqlSession;

    // ===== 사용자 신고 =====
    public ReportTargetDTO selectPostTarget(long targetSeq) {
        return sqlSession.selectOne(NS + "selectPostTarget", targetSeq);
    }

    public ReportTargetDTO selectCommentTarget(long targetSeq) {
        return sqlSession.selectOne(NS + "selectCommentTarget", targetSeq);
    }

    public int countMyReport(Map<String, Object> param) {
        return sqlSession.selectOne(NS + "countMyReport", param);
    }

    public int insertReport(ReportDTO dto) {
        return sqlSession.insert(NS + "insertReport", dto);
    }

    public int countMyReports(long reporterSeq) {
        return sqlSession.selectOne(NS + "countMyReports", reporterSeq);
    }

    public List<ReportDTO> selectMyReports(Map<String, Object> param) {
        return sqlSession.selectList(NS + "selectMyReports", param);
    }

    // ===== 관리자: 신고 =====
    public int countAdminReports(Map<String, Object> param) {
        return sqlSession.selectOne(NS + "countAdminReports", param);
    }

    public List<AdminReportDTO> selectAdminReports(Map<String, Object> param) {
        return sqlSession.selectList(NS + "selectAdminReports", param);
    }

    public ReportDTO selectReport(long reportSeq) {
        return sqlSession.selectOne(NS + "selectReport", reportSeq);
    }

    public int updateReportProcess(Map<String, Object> param) {
        return sqlSession.update(NS + "updateReportProcess", param);
    }

    public int updateSameTargetReports(Map<String, Object> param) {
        return sqlSession.update(NS + "updateSameTargetReports", param);
    }

    public int deletePostByAdmin(long targetSeq) {
        return sqlSession.update(NS + "deletePostByAdmin", targetSeq);
    }

    public int deleteCommentByAdmin(long targetSeq) {
        return sqlSession.update(NS + "deleteCommentByAdmin", targetSeq);
    }

    // ===== 관리자: 블랙리스트 =====
    public String selectMemberRole(long memberSeq) {
        return sqlSession.selectOne(NS + "selectMemberRole", memberSeq);
    }

    public int countActiveBlacklist(long memberSeq) {
        return sqlSession.selectOne(NS + "countActiveBlacklist", memberSeq);
    }

    public int insertBlacklist(BlacklistDTO dto) {
        return sqlSession.insert(NS + "insertBlacklist", dto);
    }

    public int countBlacklist(boolean activeOnly) {
        Map<String, Object> param = new HashMap<>();
        param.put("activeOnly", activeOnly);
        return sqlSession.selectOne(NS + "countBlacklist", param);
    }

    public List<BlacklistDTO> selectBlacklist(Map<String, Object> param) {
        return sqlSession.selectList(NS + "selectBlacklist", param);
    }

    public int releaseBlacklist(Map<String, Object> param) {
        return sqlSession.update(NS + "releaseBlacklist", param);
    }
    public int recountPostComments(long targetSeq) {
        return sqlSession.update(NS + "recountPostComments", targetSeq);
    }
}