package com.app.silhouette.friend;

public class MemberFriendDTO {

    // MEMBER_FRIEND 테이블 컬럼
    private Long member_friend_seq;
    private Long member_seq;
    private Long friend_member_seq;
    private String friend_status;

    // 친구 요청 관계를 명확하게 표현하는 DTO 필드
    // DB 컬럼이 아니며 MEMBER_SEQ / FRIEND_MEMBER_SEQ와 같은 값을 담는다.
    private Long requester_member_seq;
    private Long requested_member_seq;

    // 친구 목록 및 프론트엔드 응답에 필요한 상대 회원 정보
    private String login_id;
    private String nickname;
    private String profile_image;

    public Long getMember_friend_seq() {
        return member_friend_seq;
    }

    public void setMember_friend_seq(Long member_friend_seq) {
        this.member_friend_seq = member_friend_seq;
    }

    public Long getMemberFriendSeq() {
        return member_friend_seq;
    }

    public void setMemberFriendSeq(Long member_friend_seq) {
        this.member_friend_seq = member_friend_seq;
    }

    public Long getMember_seq() {
        return member_seq;
    }

    public void setMember_seq(Long member_seq) {
        this.member_seq = member_seq;
    }

    public Long getMemberSeq() {
        return member_seq;
    }

    public void setMemberSeq(Long member_seq) {
        this.member_seq = member_seq;
    }

    public Long getFriend_member_seq() {
        return friend_member_seq;
    }

    public void setFriend_member_seq(Long friend_member_seq) {
        this.friend_member_seq = friend_member_seq;
    }

    public Long getFriendMemberSeq() {
        return friend_member_seq;
    }

    public void setFriendMemberSeq(Long friend_member_seq) {
        this.friend_member_seq = friend_member_seq;
    }

    public String getFriend_status() {
        return friend_status;
    }

    public void setFriend_status(String friend_status) {
        this.friend_status = friend_status;
    }

    public String getFriendStatus() {
        return friend_status;
    }

    public void setFriendStatus(String friend_status) {
        this.friend_status = friend_status;
    }

    public Long getRequester_member_seq() {
        return requester_member_seq;
    }

    public void setRequester_member_seq(Long requester_member_seq) {
        this.requester_member_seq = requester_member_seq;
    }

    public Long getRequesterMemberSeq() {
        return requester_member_seq;
    }

    public void setRequesterMemberSeq(Long requester_member_seq) {
        this.requester_member_seq = requester_member_seq;
    }

    public Long getRequested_member_seq() {
        return requested_member_seq;
    }

    public void setRequested_member_seq(Long requested_member_seq) {
        this.requested_member_seq = requested_member_seq;
    }

    public Long getRequestedMemberSeq() {
        return requested_member_seq;
    }

    public void setRequestedMemberSeq(Long requested_member_seq) {
        this.requested_member_seq = requested_member_seq;
    }

    public String getLogin_id() {
        return login_id;
    }

    public void setLogin_id(String login_id) {
        this.login_id = login_id;
    }

    public String getLoginId() {
        return login_id;
    }

    public void setLoginId(String login_id) {
        this.login_id = login_id;
    }

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public String getProfile_image() {
        return profile_image;
    }

    public void setProfile_image(String profile_image) {
        this.profile_image = profile_image;
    }

    public String getProfileImage() {
        return profile_image;
    }

    public void setProfileImage(String profile_image) {
        this.profile_image = profile_image;
    }
}
