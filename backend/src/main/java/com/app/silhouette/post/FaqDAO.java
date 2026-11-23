package com.app.silhouette.post;

import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

@Repository
public class FaqDAO {

    private static final String NS = "Faq.";

    @Autowired
    private SqlSessionTemplate sqlSession;

    public List<FaqDTO> selectFaqList(Map<String, Object> param) {
        return sqlSession.selectList(NS + "selectFaqList", param);
    }

    public FaqDTO selectFaq(long faqSeq) {
        return sqlSession.selectOne(NS + "selectFaq", faqSeq);
    }

    public int insertFaq(FaqDTO dto) {
        return sqlSession.insert(NS + "insertFaq", dto);
    }

    public int updateFaq(FaqDTO dto) {
        return sqlSession.update(NS + "updateFaq", dto);
    }

    public int deleteFaq(long faqSeq) {
        return sqlSession.delete(NS + "deleteFaq", faqSeq);
    }
}