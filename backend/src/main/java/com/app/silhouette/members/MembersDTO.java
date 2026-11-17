package com.app.silhouette.members;

import java.time.LocalDate;
import java.util.Date;

public class MembersDTO {

    private Integer member_Seq;
    private String login_Id;
    private String password;
    private String name;
    private String nickname;
    private String phone;
    private String email;
    private String gender;
    private LocalDate birth_Date;
    private String zipcode;
    private String address1;
    private String address2;
    private String role;
    private String member_Status;
    private Date created_At;

    // 기본 생성자
    public MembersDTO() {
    }

    // 전체 필드를 받는 생성자
    public MembersDTO(Integer member_Seq, String login_Id, String password,
            String name, String nickname, String phone, String email,
            String gender, LocalDate birth_Date, String zipcode,
            String address1, String address2, String role,
            String member_Status, Date created_At) {

        this.member_Seq = member_Seq;
        this.login_Id = login_Id;
        this.password = password;
        this.name = name;
        this.nickname = nickname;
        this.phone = phone;
        this.email = email;
        this.gender = gender;
        this.birth_Date = birth_Date;
        this.zipcode = zipcode;
        this.address1 = address1;
        this.address2 = address2;
        this.role = role;
        this.member_Status = member_Status;
        this.created_At = created_At;
    }

    // Getter / Setter

    public Integer getMember_Seq() {
        return member_Seq;
    }

    public void setMember_Seq(Integer member_Seq) {
        this.member_Seq = member_Seq;
    }

    public String getLogin_Id() {
        return login_Id;
    }

    public void setLogin_Id(String login_Id) {
        this.login_Id = login_Id;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public LocalDate getBirth_Date() {
        return birth_Date;
    }

    public void setBirth_Date(LocalDate birth_Date) {
        this.birth_Date = birth_Date;
    }

    public String getZipcode() {
        return zipcode;
    }

    public void setZipcode(String zipcode) {
        this.zipcode = zipcode;
    }

    public String getAddress1() {
        return address1;
    }

    public void setAddress1(String address1) {
        this.address1 = address1;
    }

    public String getAddress2() {
        return address2;
    }

    public void setAddress2(String address2) {
        this.address2 = address2;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getMember_Status() {
        return member_Status;
    }

    public void setMember_Status(String member_Status) {
        this.member_Status = member_Status;
    }

    public Date getCreated_At() {
        return created_At;
    }

    public void setCreated_At(Date created_At) {
        this.created_At = created_At;
    }
}