package com.app.silhouette.friend;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class MemberFriendService {

    private final MemberFriendDAO memberFriendDAO;

    public MemberFriendService(MemberFriendDAO memberFriendDAO) {
        this.memberFriendDAO = memberFriendDAO;
    }

    public List<MemberFriendDTO> getFriendList(Long memberSeq) {
        return memberFriendDAO.selectFriendList(memberSeq);
    }

    public List<MemberFriendDTO> searchAcceptedFriends(String keyword, Long memberSeq) {
        return memberFriendDAO.searchAcceptedFriends(keyword, memberSeq);
    }

    public boolean isAcceptedFriend(Long memberSeq, Long friendSeq) {
        return memberFriendDAO.isAcceptedFriend(memberSeq, friendSeq) > 0;
    }
}
