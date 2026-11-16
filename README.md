# Silhouette

블라인드 랜덤 매칭과 프로필 탐색을 통해 새로운 인연을 연결하는 소개팅 플랫폼

## 📌 프로젝트 소개

Silhouette는 사용자의 취향과 이상형을 기반으로 한 프로필 추천 및 블라인드 랜덤 매칭을 제공하는 소개팅 플랫폼입니다.

블라인드 채팅을 통해 상대방과 먼저 대화하고, 상호 동의 시 프로필을 공개하여 실시간 채팅으로 이어지는 만남의 경험을 제공합니다.

- **개발 기간:** 2026.00.00 ~ 2026.00.00
- **개발 인원:** 4명
- **프로젝트 유형:** 팀 프로젝트
- **핵심 목표:** 매칭부터 대화, 실제 만남으로 이어지는 통합 소개팅 서비스 구현

## ✨ 주요 기능

| 구분 | 기능 | 상세 내용 |
|---|---|---|
| 회원 | 회원가입 및 인증 | 회원가입, 중복 확인, 휴대전화·이메일 본인인증 |
| 회원 | 프로필 관리 | 프로필 사진, MBTI, 직업, 취향 등 개인정보 관리 |
| 매칭 | 블라인드 랜덤 매칭 | 실시간 대기열 기반 1:1 랜덤 매칭 |
| 매칭 | 알고리즘 매칭 | 위치, 이상형 체크리스트, MBTI, 취향 기반 프로필 추천 |
| 매칭 | 프로필 탐색 | 위치 기반 회원 탐색 및 추천 프로필 조회 |
| 채팅 | 블라인드 채팅 | 시간제한 채팅 및 Go/Stop 상호 선택에 따른 프로필 공개 |
| 채팅 | AI 추천 답변 | 대화 맥락을 기반으로 답변 후보 제공 |
| 채팅 | 실시간 채팅 | 매칭 이후 상대방과 실시간 대화 |
| 라이브 | 라이브 방송 | WebRTC 기반 실시간 영상·음성 송출 및 시청 |
| 이벤트 | 출석체크 | 출석에 따른 마일리지 및 이용권 지급 |
| 관리자 | 운영 관리 | 회원 및 콘텐츠 관리, 서비스 운영 설정 |
| 관리자 | 통계 대시보드 | 연령대·성별·지역별 서비스 이용 현황 시각화 |

## 🛠 기술 스택

| 구분 | 기술 |
|---|---|
| Backend | Java, Spring Boot |
| Frontend | React, JavaScript, HTML, CSS |
| Database | (확정 후 입력) |
| ORM / SQL | (확정 후 입력) |
| Real-time | WebSocket, STOMP |
| Streaming | WebRTC |
| AI | (실제 적용 기술 및 API 입력) |
| Tools | Git, GitHub, Notion, Figma |

## 📁 프로젝트 구조

```text
Silhouette/
├── .github/                  # GitHub Issue / PR 템플릿
├── backend/                  # Spring Boot 백엔드
├── frontend/                 # React 프론트엔드
├── .gitignore
├── README.md
└── CONVENTION.md             # 협업 규칙
```

## 👥 팀원

| 이름 | 역할 | 담당 기능 | GitHub |
|---|---|---|---|
| 서현수 | Developer | 알고리즘 매칭, 라이브 방송, 관리자 대시보드, 블라인드 채팅 공동 개발 | @아이디 |
| 조형진 | Developer | 블라인드 랜덤 매칭, 블라인드 채팅 공동 개발 | @아이디 |
| 팀원 3 | Developer | 담당 기능 입력 | @아이디 |
| 팀원 4 | Developer | 담당 기능 입력 | @아이디 |

## 🚀 실행 방법

### 1. 프로젝트 Clone

```bash
git clone https://github.com/dongjin0503/Silhouette.git
cd Silhouette
```

### 2. Backend 실행

- `backend` 프로젝트를 STS4에서 Import
- `application.properties` 환경 설정
- 데이터베이스 및 외부 API 설정
- Spring Boot 애플리케이션 실행

### 3. Frontend 실행

```bash
cd frontend
npm install
npm run dev
```

※ 데이터베이스, 환경변수 및 외부 API 설정에 관한 상세 실행 방법은 개발 환경 확정 후 업데이트합니다.

## 📏 협업 규칙

### Branch Strategy

원본 저장소의 `main`을 기준으로 각자 Fork한 저장소에서 기능별 브랜치를 생성합니다.

```text
dongjin0503/Silhouette (원본)
└── main
     ↑
     └── Pull Request
          ↑
팀원 Fork 저장소
├── feat/C1-blind-matching
├── fix/C2-login-error
└── refactor/C3-member-service
```

- `main`: 원본 저장소의 통합 브랜치
- `feat/*`: 새로운 기능 개발
- `fix/*`: 버그 수정
- `refactor/*`: 코드 구조 개선
- `docs/*`: 문서 수정
- `chore/*`: 설정 및 기타 작업

### Commit Convention

| Type | 설명 |
|---|---|
| feat | 새로운 기능 추가 |
| fix | 버그 수정 |
| hotfix | 긴급 오류 수정 |
| refactor | 코드 리팩토링 |
| style | 코드 스타일 및 포맷 수정 |
| docs | 문서 수정 |
| test | 테스트 코드 추가 및 수정 |
| chore | 설정 및 기타 작업 |

작성 예시: `feat: 알고리즘 매칭 기능 구현`

### Pull Request 규칙

- 원본 `main` 브랜치에 직접 Push 금지
- 기능별 브랜치에서 작업 후 Pull Request 생성
- 최소 1명 이상의 코드 리뷰 및 승인 후 병합
- PR 제목과 커밋 메시지는 Convention 준수
- 병합 방식은 Squash and merge 사용

자세한 협업 방법은 [CONVENTION.md](./CONVENTION.md)를 참고하세요.

## 🔒 보안 규칙

- DB 비밀번호, API 키 등 민감 정보는 GitHub에 업로드하지 않습니다.
- 환경변수 및 개인별 설정 파일은 `.gitignore`로 관리합니다.
- 실제 개인정보를 테스트 데이터로 사용하지 않습니다.

## 📝 참고 문서

- [협업 컨벤션](./CONVENTION.md)
