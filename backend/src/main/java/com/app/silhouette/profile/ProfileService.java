package com.app.silhouette.profile;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProfileService {

	private final ProfileDAO profileDAO;

	public ProfileService(ProfileDAO profileDAO) {
		this.profileDAO = profileDAO;
	}

	// ===================== 회원 기본 정보 =====================
	public ProfileDTO selectMemberBasic(String loginId) {
		if (loginId == null || loginId.isBlank()) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인한 회원만 이용할 수 있습니다.");
		}
		ProfileDTO basic = profileDAO.selectMemberBasic(loginId);
		if (basic == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "회원 정보를 찾을 수 없습니다.");
		}
		return basic;
	}

	// ===================== 온보딩 완료 여부 =====================
	public Map<String, Object> selectOnboardingStatus(String loginId) {
		selectMemberBasic(loginId);   // 회원 확인 (없으면 401)
		boolean completed = profileDAO.countProfile(loginId) > 0;
		return Map.of("completed", completed);
	}

	// ===================== 온보딩 저장 =====================
	@Transactional
	public void saveOnboarding(OnboardingDTO dto) {
		String loginId = dto.getLoginId();

		// 1) 회원 확인 + 회원번호·닉네임 얻기 (없으면 401)
		ProfileDTO basic = selectMemberBasic(loginId);

		// 2) 이미 온보딩 했으면 거부
		if (profileDAO.countProfile(loginId) > 0) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 프로필이 등록되어 있습니다.");
		}

		// 3) 나의 정보 확인 (MEMBER_PROFILE은 전부 필수)
		ProfileDTO p = dto.getProfile();
		if (p == null || p.getHeight() == null || p.getWeight() == null
				|| isBlank(p.getMbti()) || isBlank(p.getJob()) || isBlank(p.getLoveType())
				|| isBlank(p.getDrinking()) || isBlank(p.getSmoking()) || isBlank(p.getReligion())
				|| isBlank(p.getFaceType()) || isBlank(p.getSkinType()) || isBlank(p.getHobby())
				|| isBlank(p.getFavorite()) || isBlank(p.getDislike()) || isBlank(p.getFoodPreference())
				|| isBlank(p.getIntroduction())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "프로필 항목을 모두 입력해 주세요.");
		}

		// 4) 서버가 정하는 값 채우고 저장
		p.setMemberSeq(basic.getMemberSeq());
		p.setNickname(basic.getNickname());   // 닉네임은 회원가입 정보 그대로
		profileDAO.insertProfile(p);

		// 5) 이상형은 하나라도 입력했을 때만 저장 (선택)
		IdealTypeDTO ideal = dto.getIdeal();
		if (ideal != null && ideal.hasAnyValue()) {
			ideal.setLoginId(loginId);
			if (profileDAO.countIdealType(loginId) > 0) {
				profileDAO.updateIdealType(ideal);
			} else {
				profileDAO.insertIdealType(ideal);
			}
		}
	}

	private boolean isBlank(String s) {
		return s == null || s.isBlank();
	}
}