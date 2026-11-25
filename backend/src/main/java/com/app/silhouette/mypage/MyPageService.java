package com.app.silhouette.mypage;

import java.util.Map;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.silhouette.commons.AuthMemberDTO;
import com.app.silhouette.commons.AuthMemberService;

@Service
public class MyPageService {

	// 회원가입(signup.jsx)과 같은 규칙
	private static final Pattern NICKNAME = Pattern.compile("^[a-zA-Z0-9가-힣]{2,20}$");
	private static final Pattern PHONE = Pattern.compile("^\\d{3}-\\d{3,4}-\\d{4}$");
	private static final Pattern EMAIL = Pattern.compile("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");
	private static final String NO_DETAIL = "상세주소 없음";   // 회원가입과 같은 기본값 (ADDRESS2는 NOT NULL)

	private final MyPageDAO myPageDAO;
	private final AuthMemberService authMemberService;

	public MyPageService(MyPageDAO myPageDAO, AuthMemberService authMemberService) {
		this.myPageDAO = myPageDAO;
		this.authMemberService = authMemberService;
	}

	// 내 기본 정보
	public MyPageDTO getMyInfo(String authorization) {
		AuthMemberDTO me = authMemberService.loginMember(authorization);
		return myPageDAO.selectMyInfo(me.getMemberSeq());
	}

	// 닉네임 사용 가능 여부 (형식이 틀리면 IllegalArgumentException)
	public Map<String, Object> checkNickname(String authorization, String nickname) {
		AuthMemberDTO me = authMemberService.loginMember(authorization);
		String value = nickname == null ? "" : nickname.trim();
		if (!NICKNAME.matcher(value).matches()) {
			throw new IllegalArgumentException("닉네임은 영문, 숫자, 한글로 2~20자리 입력해 주세요.");
		}
		boolean available = myPageDAO.countNickname(me.getMemberSeq(), value) == 0;
		return Map.of("available", available);
	}

	// 기본 정보 수정 (닉네임 · 휴대전화 · 이메일 · 주소만)
	@Transactional
	public MyPageDTO updateMyInfo(String authorization, MyPageDTO input) {
		AuthMemberDTO me = authMemberService.loginMember(authorization);
		Long memberSeq = me.getMemberSeq();

		String nickname = trim(input.getNickname());
		String phone = trim(input.getPhone());
		String email = trim(input.getEmail());
		String zipcode = trim(input.getZipcode());
		String address1 = trim(input.getAddress1());
		String address2 = trim(input.getAddress2());

		if (!NICKNAME.matcher(nickname).matches()) {
			throw new IllegalArgumentException("닉네임은 영문, 숫자, 한글로 2~20자리 입력해 주세요.");
		}
		if (!PHONE.matcher(phone).matches()) {
			throw new IllegalArgumentException("핸드폰 번호를 010-XXXX-XXXX 양식으로 입력해 주세요.");
		}
		if (!EMAIL.matcher(email).matches()) {
			throw new IllegalArgumentException("올바른 이메일 양식을 입력해 주세요.");
		}
		if (zipcode.isEmpty() || address1.isEmpty()) {
			throw new IllegalArgumentException("우편번호 검색을 통해 주소를 입력해 주세요.");
		}
		if (myPageDAO.countNickname(memberSeq, nickname) > 0) {
			throw new IllegalStateException("이미 사용 중인 닉네임입니다.");
		}

		// 바꿀 수 있는 값만 새 DTO에 담음 (화면에서 아이디 · 이름 등을 보내도 무시됨)
		MyPageDTO dto = new MyPageDTO();
		dto.setMemberSeq(memberSeq);
		dto.setNickname(nickname);
		dto.setPhone(phone);
		dto.setEmail(email);
		dto.setZipcode(zipcode);
		dto.setAddress1(address1);
		dto.setAddress2(address2.isEmpty() ? NO_DETAIL : address2);

		myPageDAO.updateMyInfo(dto);
		return myPageDAO.selectMyInfo(memberSeq);   // 바뀐 정보를 다시 보내줌
	}

	private String trim(String value) {
		return value == null ? "" : value.trim();
	}
}