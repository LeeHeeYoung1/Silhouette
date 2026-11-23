package com.app.silhouette.chatting;

public class ChattingMemberDTO {
    private Long member_seq;
    private String login_id;
    private String nickname;
    private String profile_image;
    private String participant_role;

    public Long getMember_seq() { return member_seq; }
    public void setMember_seq(Long value) { this.member_seq = value; }
    public String getLogin_id() { return login_id; }
    public void setLogin_id(String value) { this.login_id = value; }
    public String getNickname() { return nickname; }
    public void setNickname(String value) { this.nickname = value; }
    public String getProfile_image() { return profile_image; }
    public void setProfile_image(String value) { this.profile_image = value; }
    public String getParticipant_role() { return participant_role; }
    public void setParticipant_role(String value) { this.participant_role = value; }
}