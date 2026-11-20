package com.app.silhouette.blind;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class BlindDAO {
	
	private final SqlSessionTemplate mybatis;

    BlindDAO(SqlSessionTemplate mybatis) {
        this.mybatis = mybatis;
    }
	
    public Long createBlindChatRoom(String user1, String user2) {
    	
    	BlindChatRoomDTO blindChatRoomDto = new BlindChatRoomDTO();
    	
    	blindChatRoomDto.setTimeLimitMin(10L); // 시간제한10분
    	blindChatRoomDto.setStatus("ON AIR");
    	
    	mybatis.insert("Blind.insertBlindChatRoom", blindChatRoomDto);
    	
    	return blindChatRoomDto.getBlindChatRoomSeq();
    }
    
    public int insertMessage(BlindChatMessageDTO blindChatMessageDto) {
    	return mybatis.insert("Blind.insertBlindMessage", blindChatMessageDto);
    }
    
    
    
    
}
