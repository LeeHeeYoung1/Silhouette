package com.app.silhouette.chatbot;

import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

@Repository
public class ChatbotDAO {

    private static final String NS = "Chatbot.";

    @Autowired
    private SqlSessionTemplate sqlSession;

    public List<ChatbotDTO> searchChatbot(List<String> keywords) {
        return sqlSession.selectList(
                NS + "searchChatbot",
                Map.of("keywords", keywords)
        );
    }
}
