package com.app.silhouette.post;

import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

@Repository
public class QnaDAO {

    private static final String NS = "Qna.";

    @Autowired
    private SqlSessionTemplate sqlSession;

    public int countQnaList(Map<String, Object> param) {
        return sqlSession.selectOne(NS + "countQnaList", param);
    }

    public List<QnaDTO> selectQnaList(Map<String, Object> param) {
        return sqlSession.selectList(NS + "selectQnaList", param);
    }

    public QnaDTO selectQna(long qnaSeq) {
        return sqlSession.selectOne(NS + "selectQna", qnaSeq);
    }

    public int insertQna(QnaDTO dto) {
        return sqlSession.insert(NS + "insertQna", dto);
    }

    public int updateQna(QnaDTO dto) {
        return sqlSession.update(NS + "updateQna", dto);
    }

    public int deleteQna(long qnaSeq) {
        return sqlSession.update(NS + "deleteQna", qnaSeq);
    }

    public int updateAnswerStatus(Map<String, Object> param) {
        return sqlSession.update(NS + "updateAnswerStatus", param);
    }

    public QnaAnswerDTO selectAnswer(long qnaSeq) {
        return sqlSession.selectOne(NS + "selectAnswer", qnaSeq);
    }

    public int insertAnswer(QnaAnswerDTO dto) {
        return sqlSession.insert(NS + "insertAnswer", dto);
    }

    public int updateAnswer(QnaAnswerDTO dto) {
        return sqlSession.update(NS + "updateAnswer", dto);
    }

    public int deleteAnswer(long qnaSeq) {
        return sqlSession.delete(NS + "deleteAnswer", qnaSeq);
    }
}