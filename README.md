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
| 매칭 | 알고리즘 매칭 | 이상형 체크리스트(나이·키·MBTI·흡연·음주·병역)와 상대 프로필을 서로 비교한 상호 점수 기반 1:1 매칭 |
| 매칭 | 프로필 탐색 | 주소지 기반 내 주변 이성 추천 (같은 시·군·구 → 같은 시·도 순) |
| 채팅 | 블라인드 채팅 | 시간제한 채팅 및 Go/Stop 상호 선택에 따른 프로필 공개 |
| 채팅 | AI 추천 답변 | 대화 맥락을 기반으로 답변 후보 제공 |
| 채팅 | 실시간 채팅 | 매칭 이후 상대방과 실시간 대화 |
| 라이브 | 라이브 방송 | LiveKit 기반 실시간 영상·음성 송출 및 시청, 방송 채팅(금칙어·도배 방지), 강퇴·차단, 신고 및 관리자 강제 종료 |
| 이벤트 | 출석체크 | 출석에 따른 마일리지 및 이용권 지급 |
| 관리자 | 운영 관리 | 회원 및 콘텐츠 관리, 서비스 운영 설정 |
| 관리자 | 통계 대시보드 | 연령대·성별·지역별 서비스 이용 현황 시각화 |

## 🛠 기술 스택

| 구분 | 기술 |
|---|---|
| Backend | Java 21, Spring Boot 4.0 |
| Frontend | React 19, Vite 8, JavaScript, CSS Modules |
| Database | Oracle |
| ORM / SQL | MyBatis 4.0 |
| Real-time | WebSocket, STOMP |
| Streaming | LiveKit (WebRTC SFU), livekit-client, @livekit/components-react |
| Storage | Google Cloud Storage (게시판 첨부, 라이브 썸네일) |
| Auth | JWT (java-jwt) |
| AI | (실제 적용 기술 및 API 입력) |
| Tools | Git, GitHub, Notion, Figma |

## 📁 프로젝트 구조

```text
Silhouette/
├── .github/                  # GitHub PR 템플릿
├── backend/                  # Spring Boot 백엔드
├── frontend/                 # React 프론트엔드
├── .gitignore
├── README.md
├── CONVENTION.md             # 협업 규칙
└── TROUBLESHOOTING.md        # 트러블슈팅 기록
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

#### application.properties

`backend/src/main/resources/application.properties.example`을 복사해 `application.properties`를 만들고 값을 채운다. (이 파일은 Git에 올리지 않는다)

| 항목 | 설명 |
|---|---|
| `spring.datasource.*` | Oracle 접속 정보 |
| `jwt.secret`, `jwt.expiration` | JWT 서명 키, 만료 시간 |
| `gcp.credentials.location`, `gcp.project.id`, `gcp.bucket` | GCS 업로드 |
| `livekit.url`, `livekit.api-key`, `livekit.api-secret` | LiveKit Cloud 프로젝트 |
| `live.max-viewers` | 방송당 최대 시청자 수 (기본 50) |
| `spring.servlet.multipart.max-file-size` / `max-request-size` | 업로드 크기 (20MB / 25MB) |
| `spring.ai.model.chat`, `spring.ai.google.genai.*` | 블라인드 채팅 AI 추천 답변(Gemini). 키가 없으면 `none`으로 두면 서버는 정상 실행 |
| `blind.time-limit-min`, `blind.vote-seconds` | 블라인드 채팅 시간 (기본 15분) / GO·STOP 선택 시간 (기본 30초) |

#### 라이브 webhook (로컬 개발)

LiveKit Cloud는 `localhost`로 webhook을 보낼 수 없어, 시청자 수·입장 안내·끊긴 방송 자동 종료를 확인하려면 터널이 필요하다.

1. `ngrok http 80` 실행
2. LiveKit Cloud → Settings → Webhooks에 `https://<ngrok 주소>/api/livekit/webhook` 등록 (서명 키 = `livekit.api-key`)
3. 시청자로 입장했을 때 서버 콘솔에 `LiveKit webhook 수신`이 찍히면 정상

배포 서버에서는 ngrok 없이 배포 주소로 등록한다.

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
- PR 제목은 `[타입] 작업 내용` 형식으로 작성
- 최소 1명 이상의 코드 리뷰 및 승인 후 병합
- 병합 방식은 Create a merge commit(일반 머지) 사용

PR 제목 작성 예시:

- `[Feat] 알고리즘 매칭 기능 구현`
- `[Fix] 로그인 오류 수정`
- `[Refactor] 회원 서비스 구조 개선`
- `[Docs] README 협업 규칙 수정`

자세한 협업 방법은 [CONVENTION.md](./CONVENTION.md)를, 개발 중 겪은 문제와 해결 과정은 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)를 참고하세요.

## 🔒 보안 규칙

- DB 비밀번호, API 키 등 민감 정보는 GitHub에 업로드하지 않습니다.
- 환경변수 및 개인별 설정 파일은 `.gitignore`로 관리합니다.
- 실제 개인정보를 테스트 데이터로 사용하지 않습니다.

## 📝 참고 문서

- [협업 컨벤션](./CONVENTION.md)
- [트러블슈팅 기록](./TROUBLESHOOTING.md)
