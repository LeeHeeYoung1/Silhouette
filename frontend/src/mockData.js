export const DEFAULT_USER = {
  memberSeq: 1,
  loginId: 'silhouette01',
  password: 'Password123!',
  name: '홍길동',
  nickname: '달빛연인',
  phone: '010-1234-5678',
  email: 'silhouette01@example.com',
  gender: 'FEMALE',
  birthDate: '1998-05-20',
  zipcode: '06035',
  address1: '서울특별시 강남구 가로수길 12',
  address2: '실루엣빌딩 3층',
  role: 'ROLE_USER',
  memberStatus: 'ACTIVE',
  createdAt: '2026-01-01 12:00:00'
};

export const INITIAL_TERMS = [
  {
    termsSeq: 1,
    title: '실루엣 서비스 이용약관',
    requiredYn: 'Y',
    version: 'v1.0',
    effectiveAt: '2026-01-01',
    content: `제1조 (목적)
본 약관은 실루엣(이하 "서비스")이 제공하는 소개팅 및 커뮤니티 관련 제반 서비스의 이용조건과 절차, 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (회원가입)
1. 회원은 만 19세 이상의 성인만 가입할 수 있습니다.
2. 타인의 정보를 도용하여 가입한 경우 법적 책임을 질 수 있습니다.`
  },
  {
    termsSeq: 2,
    title: '개인정보 수집 및 이용 동의',
    requiredYn: 'Y',
    version: 'v1.0',
    effectiveAt: '2026-01-01',
    content: `1. 수집 항목: 아이디, 비밀번호, 성명, 닉네임, 연락처, 이메일, 생년월일, 성별, 주소
2. 수집 목적: 회원 식별, 서비스 제공 및 상담, 부정 이용 방지
3. 보유 기간: 회원 탈퇴 시까지 (관계 법령에 따라 보존 의무가 있는 경우 해당 기간 동안 보관)`
  },
  {
    termsSeq: 3,
    title: '마케팅 정보 수신 및 혜택 알림 동의',
    requiredYn: 'N',
    version: 'v1.0',
    effectiveAt: '2026-01-01',
    content: `실루엣에서 제공하는 프로모션, 특별 이벤트, 매칭 추천 알림 소식을 SMS, 이메일, 앱 푸시 등으로 수신하는 것에 동의합니다. (미동의 시에도 기본 서비스 이용 가능)`
  }
];
