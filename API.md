# 📡 Silhouette API 사용 및 연동 명세서

이 문서는 Silhouette 프로젝트에서 사용하는 **외부 서드파티 연동 API** 및 **내부 REST API / WebSocket STOMP 실시간 통신 명세**를 총정리한 공식 문서입니다.

---

## 📑 목차

1. [외부 연동 API 및 서드파티 서비스 (External APIs)](#1-외부-연동-api-및-서드파티-서비스-external-apis)
   - [1.1. Google Gemini (Spring AI)](#11-google-gemini-spring-ai)
   - [1.2. LiveKit Cloud (WebRTC SFU)](#12-livekit-cloud-webrtc-sfu)
   - [1.3. Google Cloud Storage (GCS)](#13-google-cloud-storage-gcs)
   - [1.4. Sightengine AI (이미지 모더레이션)](#14-sightengine-ai-이미지-모더레이션)
   - [1.5. 내부 비전 AI 분석 서버 (외모 및 동일인 판별)](#15-내부-비전-ai-분석-서버-외모-및-동일인-판별)
   - [1.6. 카카오/다음 우편번호 검색 서비스 API](#16-카카오다음-우편번호-검색-서비스-api)
2. [공통 통신 프로토콜 및 인증 규격](#2-공통-통신-프로토콜-및-인증-규격)
   - [2.1. 기본 환경 및 Base URL](#21-기본-환경-및-base-url)
   - [2.2. JWT 인증 메커니즘](#22-jwt-인증-메커니즘)
   - [2.3. WebSocket & STOMP 실시간 프로토콜](#23-websocket--stomp-실시간-프로토콜)
3. [내부 REST API 상세 명세서 (도메인별)](#3-내부-rest-api-상세-명세서-도메인별)
   - [3.1. 인증 및 회원 (`/auth`, `/members`)](#31-인증-및-회원-auth-members)
   - [3.2. 마이페이지 및 프로필 관리 (`/api/mypage`, `/api/profile`)](#32-마이페이지-및-프로필-관리-apimypage-apiprofile)
   - [3.3. 매칭 시스템 (`/matching/ideal`, `/matching/nearby`)](#33-매칭-시스템-matchingideal-matchingnearby)
   - [3.4. 블라인드 매칭 및 채팅 (`/api/blind`)](#34-블라인드-매칭-및-채팅-apiblind)
   - [3.5. 1:1 일반 채팅 및 친구 관리 (`/api/chat`)](#35-11-일반-채팅-및-친구-관리-apichat)
   - [3.6. 라이브 방송 스트리밍 (`/api/live`, `/api/livekit`, `/api/upload`)](#36-라이브-방송-스트리밍-apilive-apilivekit-apiupload)
   - [3.7. 커뮤니티 게시판 및 피드 (`/api/posts`, 댓글, 북마크)](#37-커뮤니티-게시판-및-피드-apiposts-댓글-북마크)
   - [3.8. 고객지원 (공지/FAQ/Q&A) (`/api/notices`, `/api/faqs`, `/api/qnas`)](#38-고객지원-공지faqqna-apinotices-apifaqs-apiqnas)
   - [3.9. 이벤트 및 출석체크 (`/api/event`, `/api/attendance`)](#39-이벤트-및-출석체크-apievent-apiattendance)
   - [3.10. AI 챗봇 추천 서비스 (`/api/chatbot`)](#310-ai-챗봇-추천-서비스-apichatbot)
   - [3.11. AI 외모 등급 테스트 (`/api/beauty-test`)](#311-ai-외모-등급-테스트-apibeauty-test)
   - [3.12. 실시간 알림 및 유저 신고 (`/api/notifications`, `/api/reports`)](#312-실시간-알림-및-유저-신고-apinotifications-apireports)
   - [3.13. 관리자 운영 및 통계 대시보드 (`/api/admin`, `/api/admin/stats`)](#313-관리자-운영-및-통계-대시보드-apiadmin-apiadminstats)
4. [공통 HTTP 상태 코드 및 예외 처리](#4-공통-http-상태-코드-및-예외-처리)

---

## 1. 외부 연동 API 및 서드파티 서비스 (External APIs)

### 1.1. Google Gemini (Spring AI)
Google의 최신 대규모 언어 모델(LLM)을 Spring AI 프레임워크와 결합하여 대화형 인공지능 기능을 제공합니다.

| 항목 | 상세 내용 |
|---|---|
| **제공사** | Google Cloud / Google AI Studio |
| **모델명** | `gemini-3.5-flash-lite` |
| **연동 라이브러리** | `org.springframework.ai:spring-ai-starter-model-google-genai` (Spring AI 2.0.1) |
| **적용 영역** | 1) **AI 데이트/맛집 추천 챗봇** (`/api/chatbot/chat`)<br>2) **블라인드 채팅 맥락 기반 AI 추천 답변** (`/api/blind/room/{roomSeq}/suggestions`) |
| **주요 설정** | `spring.ai.google.genai.api-key`: API 인증 키<br>`spring.ai.google.genai.chat.options.thinking-level=minimal`: 응답 지연 단축<br>`spring.ai.retry.max-attempts=2`: 429 Rate Limit 방지 |
| **호출 방식** | 백엔드 Spring AI `ChatModel.call(Prompt)` 호출 |

---

### 1.2. LiveKit Cloud (WebRTC SFU)
저지연 실시간 1:N 영상/음성 스트리밍 환경을 제공하는 WebRTC SFU 클라우드 인프라입니다.

| 항목 | 상세 내용 |
|---|---|
| **제공사** | LiveKit Cloud (`wss://silhouette-*.livekit.cloud`) |
| **연동 기술** | Backend: `io.livekit:livekit-server:0.5.10` (Java SDK)<br>Frontend: `livekit-client`, `@livekit/components-react` |
| **적용 영역** | **실시간 라이브 방송 송출 및 시청** (`/api/live`) |
| **주요 기능** | 1) **JWT Video Token 발급**: 방장(Publisher), 시청자(Subscriber) 권한 분리 토큰 생성<br>2) **Room 관리**: 방 생성, 종료, 참여자 강제 퇴장(Kick)<br>3) **Webhook 수신**: `room_started`, `room_finished`, `participant_joined`, `participant_left` 이벤트 실시간 동기화 |
| **주요 설정** | `livekit.url`, `livekit.api-key`, `livekit.api-secret`, `live.max-viewers=50` |

---

### 1.3. Google Cloud Storage (GCS)
안정적이고 확장 가능한 클라우드 객체 스토리지로, 사용자 미디어 파일을 안전하게 저장 및 서빙합니다.

| 항목 | 상세 내용 |
|---|---|
| **제공사** | Google Cloud Platform (GCP) |
| **연동 라이브러리** | `com.google.cloud:google-cloud-storage:2.70.0` |
| **적용 영역** | 1) **프로필 사진 원본 및 썸네일**<br>2) **게시판 및 Q&A 첨부파일** (`PostFileDTO`)<br>3) **라이브 방송 대표 썸네일** (`/api/upload/thumbnail`) |
| **인증 방식** | GCP Service Account Key JSON (`gcp.credentials.location`, `gcp.project.id`, `gcp.bucket`) |
| **제공 방식** | 안전한 파일 업로드 후 파일 고유 UUID 키 저장, 백엔드 프록시 스트리밍 및 서명된 URL 제공 |

---

### 1.4. Sightengine AI (이미지 모더레이션)
컴퓨터 비전 인공지능을 통해 업로드되는 프로필 사진의 유해성 및 AI 합성 여부를 사전에 검사합니다.

| 항목 | 상세 내용 |
|---|---|
| **제공사** | Sightengine (`https://api.sightengine.com/1.0/check.json`) |
| **연동 방식** | Spring `RestTemplate` 멀티파트 요청 |
| **적용 영역** | **관리자 프로필 사진 심사 및 자동 검열** (`/api/admin/photo-reviews`) |
| **주요 검사 항목** | 1) **AI 생성 이미지 탐지**: 딥페이크 및 가상 얼굴 생성 여부 점수(`genai` 모델)<br>2) **유해/선정성 검사**: 부적절한 노출 및 선정성 점수(`nudity-2.1` 모델) |
| **주요 설정** | `sightengine.api.url`, `sightengine.api.user`, `sightengine.api.secret` |

---

### 1.5. 내부 비전 AI 분석 서버 (외모 및 동일인 판별)
FastAPI / PyTorch 기반의 독립 AI 마이크로서비스로, 얼굴 임베딩 및 외모 평가 알고리즘을 수행합니다.

| 항목 | 상세 내용 |
|---|---|
| **엔드포인트** | `http://10.10.54.164:8000/api/beauty-test` (내부 사내망/GPU 서버) |
| **연동 방식** | Spring `RestClient` (HTTP/1.1 멀티파트 요청, Connect 3s, Read 30s) |
| **적용 영역** | **외모 등급 및 관상 테스트** (`/api/beauty-test`) |
| **주요 기능** | 1) **동일 인물 검증**: 업로드된 1~4장의 사진이 동일 인물인지 얼굴 임베딩 코사인 유사도로 판별<br>2) **외모 등급 산출**: 얼굴 랜드마크 분석 및 정량적 비주얼 스코어링 제공 |
| **주요 설정** | `ai.server.url=http://10.10.54.164:8000` |

---

### 1.6. 카카오/다음 우편번호 검색 서비스 API
사용자의 주소 입력을 돕고, 도로명 주소 및 행정구역(시·도, 시·군·구)을 정밀하게 추출합니다.

| 항목 | 상세 내용 |
|---|---|
| **제공사** | Kakao / Daum |
| **연동 방식** | 클라이언트 동적 스크립트 로드 (`https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js`) |
| **적용 영역** | 1) **회원가입 주소 입력** (`signup.jsx`)<br>2) **마이페이지 내 거주지 수정** (`mypage.jsx`) |
| **특징** | 별도의 유료 API 키 발급 없이 무료로 도로명/지번 주소 검색 레이어 팝업 제공 |
| **연계 활용** | 추출된 시·군·구 데이터를 바탕으로 **‘내 주변 가까운 매칭’(주소지 반경 우선 추천)** 알고리즘에 활용 |

---

## 2. 공통 통신 프로토콜 및 인증 규격

### 2.1. 기본 환경 및 Base URL
- **Backend API Server**: `http://localhost:80` (개발 환경) / `http://10.5.4.10:80`
- **Frontend Client**: `http://localhost:5173`
- **Content-Type**: `application/json; charset=UTF-8` (파일 업로드 시 `multipart/form-data`)

### 2.2. JWT 인증 메커니즘
- **인증 헤더**: `Authorization: Bearer <JWT_TOKEN>`
- **토큰 발급**: `/auth/login` 성공 시 유효기간 24시간(`jwt.expiration=86400000`)의 JWT 발급
- **인터셉터 검증**: `LoginValidator`가 모든 `/api/**` 요청의 유효성을 자동 검증 (`/members/signup`, `/auth/login` 등 제외)

### 2.3. WebSocket & STOMP 실시간 프로토콜
실시간 매칭 큐, 블라인드 채팅, 일반 채팅, 라이브 방송 채팅을 처리합니다.

- **STOMP 엔드포인트(Handshake)**:
  - `/chat` : 1:1 실시간 채팅 전용
  - `/blind` : 블라인드 랜덤 매칭 대기열 및 블라인드 채팅 전용
  - `/live` : 라이브 방송 채팅 전용
- **메시지 발행 Prefix (Pub)**: `/pub` (예: `/pub/chat/send`, `/pub/match/join`, `/pub/live/chat`)
- **메시지 구독 Prefix (Sub)**: `/sub` (예: `/sub/chat/room/{seq}`, `/sub/live/room/{seq}`)
- **소켓 인증**: `JwtChannelInterceptor`가 STOMP `CONNECT` 프레임의 `Authorization` 헤더에서 JWT 토큰을 검증

---

## 3. 내부 REST API 상세 명세서 (도메인별)

### 3.1. 인증 및 회원 (`/auth`, `/members`)

| Method | Endpoint | 설명 | 인증 | 요청 파라미터 / 바디 |
|---|---|---|:---:|---|
| `POST` | `/auth/login` | 로그인 및 JWT 토큰 발급 | X | `{ "id": "...", "pw": "..." }` |
| `POST` | `/members/signup` | 신규 회원가입 | X | `MembersDTO` (아이디, 비밀번호, 닉네임, 성별, 주소 등) |
| `GET` | `/members/idCheck` | 아이디 중복 확인 | X | `?id=testId` |
| `GET` | `/api/members/me/role` | 현재 로그인 회원 권한 조회 | O | Header 토큰 |

---

### 3.2. 마이페이지 및 프로필 관리 (`/api/mypage`, `/api/profile`)

| Method | Endpoint | 설명 | 인증 | 요청 파라미터 / 바디 |
|---|---|---|:---:|---|
| `GET` | `/api/mypage/me` | 내 상세 정보 조회 (성향, 이상형 등) | O | Header 토큰 |
| `GET` | `/api/mypage/nickname-check` | 닉네임 중복 확인 | O | `?nickname=새닉네임` |
| `PUT` | `/api/mypage/me` | 내 프로필 정보 및 취향/이상형 수정 | O | `MyPageUpdateDTO` JSON |
| `GET` | `/api/profile/basic` | 메인 레이아웃용 내 기본 정보 | O | Header 토큰 |
| `GET` | `/api/profile/status` | 프로필 등록 완료 여부 확인 | O | Header 토큰 |
| `POST` | `/api/profile` | 최초 프로필 기본정보 등록 | O | `ProfileDTO` JSON |
| `GET` | `/api/profile/me` | 내 전체 프로필 상세 조회 | O | Header 토큰 |
| `GET` | `/api/profile/member/{memberSeq}` | 특정 회원 프로필 조회 (상대방) | O | Path Variable |
| `PUT` | `/api/profile` | 프로필 내용 수정 | O | `ProfileDTO` JSON |
| `GET` | `/api/profile/images` | 내 등록 프로필 사진 목록 | O | Header 토큰 |
| `POST` | `/api/profile/images` | 프로필 사진 업로드 (GCS) | O | `multipart/form-data` (`files`) |
| `PUT` | `/api/profile/images/{sortOrder}`| 대표/서브 사진 순서 변경 | O | Path Variable |
| `GET` | `/api/profile/image/{imageSeq}` | 프로필 이미지 바이너리 조회 | X | Path Variable |

---

### 3.3. 매칭 시스템 (`/matching/ideal`, `/matching/nearby`)

| Method | Endpoint | 설명 | 인증 | 요청 파라미터 / 바디 |
|---|---|---|:---:|---|
| `POST` | `/matching/ideal/start` | 알고리즘 이상형 매칭 큐 참가 | O | Header 토큰 |
| `GET` | `/matching/ideal/status` | 이상형 매칭 진행 상태 및 결과 확인 | O | Header 토큰 |
| `POST` | `/matching/ideal/cancel` | 이상형 매칭 큐 취소 | O | Header 토큰 |
| `GET` | `/matching/ideal/room/{roomSeq}/partner` | 매칭 완료된 상대방 프로필 정보 | O | Path Variable |
| `GET` | `/matching/nearby` | 주소지 기반 내 주변 가까운 이웃 추천 | O | `?limit=10` (같은 동네 → 같은 시·도 순) |

---

### 3.4. 블라인드 매칭 및 채팅 (`/api/blind`)

| Method | Endpoint | 설명 | 인증 | 프로토콜 / 바디 |
|---|---|---|:---:|---|
| `STOMP` | `/pub/match/join` | 실시간 블라인드 매칭 대기열 등록 | O | WebSocket STOMP |
| `STOMP` | `/pub/match/cancel` | 실시간 블라인드 매칭 대기열 취소 | O | WebSocket STOMP |
| `GET` | `/api/blind/room/{roomSeq}` | 블라인드 채팅방 정보 및 남은 시간 | O | Path Variable |
| `GET` | `/api/blind/room/{roomSeq}/messages` | 블라인드 채팅 메시지 내역 조회 | O | Path Variable |
| `POST` | `/api/blind/room/{roomSeq}/messages` | 블라인드 메시지 전송 (소켓 미연결 시) | O | `{ "content": "..." }` |
| `POST` | `/api/blind/room/{roomSeq}/vote` | GO / STOP 최종 선택 투표 | O | `{ "choice": "GO" \| "STOP" }` |
| `POST` | `/api/blind/room/{roomSeq}/leave` | 블라인드 채팅방 퇴장 | O | Path Variable |
| `GET` | `/api/blind/ai/status` | Gemini AI 답변 추천 활성화 여부 | O | Header 토큰 |
| `POST` | `/api/blind/room/{roomSeq}/suggestions` | 대화 맥락 기반 Gemini 추천 답변 3개 생성 | O | Header 토큰 |

---

### 3.5. 1:1 일반 채팅 및 친구 관리 (`/api/chat`)

| Method | Endpoint | 설명 | 인증 | 요청 파라미터 / 바디 |
|---|---|---|:---:|---|
| `GET` | `/api/chat/rooms` | 내가 참여 중인 1:1 채팅방 목록 | O | Header 토큰 |
| `POST` | `/api/chat/room` | 새 1:1 채팅방 생성 | O | `{ "room_name": "...", "member_seqs": [...] }` |
| `GET` | `/api/chat/room/{roomSeq}/members` | 채팅방 참여자 정보 조회 | O | Path Variable |
| `GET` | `/api/chat/messages/{roomSeq}` | 채팅방 이전 대화 내역 조회 | O | Path Variable |
| `POST` | `/api/chat/room/{roomSeq}/image` | 채팅 이미지 전송 업로드 | O | `multipart/form-data` (`file`) |
| `POST` | `/api/chat/room/{roomSeq}/voice` | 채팅 음성 녹음 파일 전송 | O | `multipart/form-data` (`file`) |
| `POST` | `/api/chat/room/{roomSeq}/file` | 채팅 일반 첨부파일 전송 | O | `multipart/form-data` (`file`) |
| `POST` | `/api/chat/room/{roomSeq}/leave` | 채팅방 나가기 | O | Path Variable |
| `STOMP` | `/pub/chat/send` | 실시간 1:1 채팅 메시지 전송 | O | WebSocket STOMP |
| `GET` | `/api/chat/friends` | 내 친구 목록 조회 | O | Header 토큰 |
| `GET` | `/api/chat/friends/search` | 친구 추가용 유저 아이디 검색 | O | `?keyword=...` |
| `POST` | `/api/chat/friends/request` | 친구 요청 전송 | O | `{ "target_member_seq": ... }` |
| `GET` | `/api/chat/friends/requests` | 나에게 온 친구 요청 목록 | O | Header 토큰 |
| `POST` | `/api/chat/friends/requests/{seq}/accept` | 친구 요청 수락 | O | Path Variable |
| `POST` | `/api/chat/friends/requests/{seq}/reject` | 친구 요청 거절 | O | Path Variable |
| `DELETE` | `/api/chat/friends/{friendSeq}` | 친구 삭제 | O | Path Variable |

---

### 3.6. 라이브 방송 스트리밍 (`/api/live`, `/api/livekit`, `/api/upload`)

| Method | Endpoint | 설명 | 인증 | 요청 파라미터 / 바디 |
|---|---|---|:---:|---|
| `POST` | `/api/live` | 라이브 방송 생성 및 방장 토큰 발급 | O | `{ "title": "...", "notice": "...", "thumbnailUrl": "..." }` |
| `GET` | `/api/live` | 현재 진행 중인 라이브 방송 목록 | O | `?status=LIVE` |
| `GET` | `/api/live/{liveRoomSeq}` | 라이브 방송 상세 정보 | O | Path Variable |
| `POST` | `/api/live/{liveRoomSeq}/join` | 라이브 방송 시청 입장 (시청자 토큰 발급) | O | Path Variable |
| `POST` | `/api/live/{liveRoomSeq}/end` | 방장의 라이브 방송 종료 | O | Path Variable |
| `PUT` | `/api/live/{liveRoomSeq}` | 방송 제목 및 공지사항 실시간 수정 | O | `{ "title": "...", "notice": "..." }` |
| `GET` | `/api/live/{liveRoomSeq}/viewers` | 실시간 시청자 목록 조회 | O | Path Variable |
| `POST` | `/api/live/{liveRoomSeq}/kick/{memberSeq}` | 방장의 악성 시청자 강퇴 처리 | O | Path Variable |
| `POST` | `/api/live/{liveRoomSeq}/report` | 라이브 방송 불법/유해 신고 | O | `{ "reason": "...", "content": "..." }` |
| `STOMP` | `/pub/live/chat` | 라이브 방송 실시간 채팅 송수신 | O | WebSocket STOMP |
| `POST` | `/api/livekit/webhook` | LiveKit Cloud 서버 상태 웹훅 수신 | X (서명검증) | LiveKit Webhook Payload JSON |
| `POST` | `/api/upload/thumbnail` | 라이브 대표 썸네일 이미지 GCS 업로드 | O | `multipart/form-data` (`file`) |

---

### 3.7. 커뮤니티 게시판 및 피드 (`/api/posts`, 댓글, 북마크)

| Method | Endpoint | 설명 | 인증 | 요청 파라미터 / 바디 |
|---|---|---|:---:|---|
| `GET` | `/api/posts` | 커뮤니티 게시글 목록 (페이징/카테고리/검색) | O | `?cpage=1&category=...&keyword=...` |
| `POST` | `/api/posts` | 커뮤니티 게시글 작성 (파일 첨부 지원) | O | `multipart/form-data` (JSON + `files`) |
| `GET` | `/api/posts/{postSeq}` | 게시글 상세 내용 조회 (조회수 증가) | O | Path Variable |
| `PUT` | `/api/posts/{postSeq}` | 게시글 수정 | O | `PostDTO` JSON |
| `DELETE` | `/api/posts/{postSeq}` | 게시글 삭제 | O | Path Variable |
| `POST` | `/api/posts/{postSeq}/recommend` | 게시글 좋아요(추천) 토글 | O | Path Variable |
| `GET` | `/api/posts/{postSeq}/files` | 게시글 첨부 파일 목록 | O | Path Variable |
| `GET` | `/api/posts/files/{fileSeq}/download` | GCS 첨부 파일 다운로드 스트리밍 | O | Path Variable |
| `GET` | `/api/posts/{postSeq}/comments` | 게시글의 댓글 및 대댓글 목록 | O | Path Variable |
| `POST` | `/api/posts/{postSeq}/comments` | 신규 댓글/대댓글 등록 | O | `{ "content": "...", "parentCommentSeq": null }` |
| `PUT` | `/api/posts/{postSeq}/comments/{cSeq}` | 댓글 내용 수정 | O | `{ "content": "..." }` |
| `DELETE` | `/api/posts/{postSeq}/comments/{cSeq}` | 댓글 삭제 | O | Path Variable |
| `POST` | `/api/bookmarks/posts/{postSeq}` | 게시글 북마크(스크랩) 토글 | O | Path Variable |
| `GET` | `/api/bookmarks/me` | 내가 북마크한 게시글 목록 | O | Header 토큰 |

---

### 3.8. 고객지원 (공지/FAQ/Q&A) (`/api/notices`, `/api/faqs`, `/api/qnas`)

| Method | Endpoint | 설명 | 인증 | 요청 파라미터 / 바디 |
|---|---|---|:---:|---|
| `GET` | `/api/notices` | 공지사항 목록 조회 | O | `?cpage=1` |
| `GET` | `/api/notices/{noticeSeq}` | 공지사항 상세 조회 | O | Path Variable |
| `POST` | `/api/notices` | 공지사항 등록 (관리자) | O (Admin) | `NoticeDTO` JSON |
| `PUT` | `/api/notices/{noticeSeq}` | 공지사항 수정 (관리자) | O (Admin) | `NoticeDTO` JSON |
| `DELETE` | `/api/notices/{noticeSeq}` | 공지사항 삭제 (관리자) | O (Admin) | Path Variable |
| `GET` | `/api/faqs` | 자주 묻는 질문(FAQ) 목록 | O | `?category=...` |
| `POST` | `/api/faqs` | FAQ 신규 등록 (관리자) | O (Admin) | `FaqDTO` JSON |
| `GET` | `/api/qnas` | 1:1 Q&A 문의 내역 목록 (비밀글 필터) | O | `?cpage=1` |
| `POST` | `/api/qnas` | 1:1 Q&A 신규 문의 작성 | O | `QnaDTO` JSON |
| `GET` | `/api/qnas/{qnaSeq}` | 1:1 Q&A 문의 상세 내용 | O | Path Variable |
| `POST` | `/api/qnas/{qnaSeq}/verify` | 비밀글 비밀번호 일치 검증 | O | `{ "password": "..." }` |
| `POST` | `/api/qnas/{qnaSeq}/answer` | 1:1 Q&A 관리자 답변 등록 | O (Admin) | `{ "answer": "..." }` |

---

### 3.9. 이벤트 및 출석체크 (`/api/event`, `/api/attendance`)

| Method | Endpoint | 설명 | 인증 | 요청 파라미터 / 바디 |
|---|---|---|:---:|---|
| `GET` | `/api/attendance/weekly` | 이번 주 내 출석 현황 (월~일) | O | Header 토큰 |
| `POST` | `/api/attendance/check` | 오늘 출석체크 수행 (마일리지 지급) | O | Header 토큰 |
| `POST` | `/api/event/roulette` | 데일리 룰렛 돌리기 (마일리지/아이템) | O | Header 토큰 |
| `POST` | `/api/event/food-test` | 음식 취향 밸런스 게임 결과 저장 | O | `{ "answers": [...] }` |
| `POST` | `/api/event/love-value-test` | 연애 가치관 테스트 결과 저장 | O | `{ "answers": [...] }` |
| `POST` | `/api/event/mbti-test` | MBTI 궁합 테스트 결과 저장 | O | `{ "answers": [...] }` |
| `GET` | `/api/event/quest-status` | 신규 회원 퀘스트 달성 상태 확인 | O | Header 토큰 |
| `POST` | `/api/event/all-tests-reward` | 3종 취향 테스트 완료 보상 수령 | O | Header 토큰 |

---

### 3.10. AI 챗봇 추천 서비스 (`/api/chatbot`)

| Method | Endpoint | 설명 | 인증 | 요청 파라미터 / 바디 |
|---|---|---|:---:|---|
| `POST` | `/api/chatbot/chat` | AI 데이트 코스, 지역 맛집 추천 대화 (Gemini 연동) | O | `{ "message": "강남역 분위기 좋은 파스타 맛집 추천해줘" }` |

- **응답 예시**:
```json
{
  "reply": "강남역 인근에서 소개팅이나 데이트에 좋은 분위기의 파스타 맛집 3곳을 추천해 드릴게요! 1) 바비레드 강남본점 ...",
  "recommendedPlaces": [
    { "name": "바비레드 강남본점", "category": "양식/파스타", "location": "서울 강남구 역삼동" }
  ]
}
```

---

### 3.11. AI 외모 등급 테스트 (`/api/beauty-test`)

| Method | Endpoint | 설명 | 인증 | 요청 파라미터 / 바디 |
|---|---|---|:---:|---|
| `GET` | `/api/beauty-test/me/status` | 이번 주 테스트 가능 여부 확인 (주 1회 제한) | O | Header 토큰 |
| `POST` | `/api/beauty-test` | 사진 1~4장 업로드 → 비전 AI 분석 및 등급 산출 | O | `multipart/form-data` (`files`) |
| `GET` | `/api/beauty-test/me/latest` | 나의 가장 최근 AI 외모 테스트 결과 | O | Header 토큰 |
| `GET` | `/api/beauty-test/me` | 나의 전체 외모 테스트 히스토리 | O | Header 토큰 |

---

### 3.12. 실시간 알림 및 유저 신고 (`/api/notifications`, `/api/reports`)

| Method | Endpoint | 설명 | 인증 | 요청 파라미터 / 바디 |
|---|---|---|:---:|---|
| `GET` | `/api/notifications` | 내 실시간 알림 목록 조회 | O | Header 토큰 |
| `GET` | `/api/notifications/unread-count` | 안 읽은 알림 개수 배지 카운트 | O | Header 토큰 |
| `POST` | `/api/notifications/{seq}/read` | 특정 알림 읽음 처리 | O | Path Variable |
| `POST` | `/api/reports` | 유저 악성 행위 / 게시글 신고 접수 | O | `{ "targetType": "MEMBER" \| "POST", "targetSeq": ..., "reason": "..." }` |
| `GET` | `/api/reports/check` | 해당 대상 이미 신고했는지 여부 확인 | O | `?targetType=...&targetSeq=...` |

---

### 3.13. 관리자 운영 및 통계 대시보드 (`/api/admin`, `/api/admin/stats`)

| Method | Endpoint | 설명 | 인증 | 요청 파라미터 / 바디 |
|---|---|---|:---:|---|
| `GET` | `/api/admin/members` | 전체 회원 관리 목록 (상태/권한) | O (Admin) | `?cpage=1&keyword=...` |
| `POST` | `/api/admin/blacklist` | 악성 유저 블랙리스트 등록 및 계정 정지 | O (Admin) | `{ "memberSeq": ..., "reason": "..." }` |
| `POST` | `/api/admin/blacklist/release/{memberSeq}` | 블랙리스트 정지 해제 | O (Admin) | Path Variable |
| `GET` | `/api/admin/banned-words` | 실시간 채팅/게시판 금칙어 목록 | O (Admin) | Header 토큰 |
| `POST` | `/api/admin/banned-words` | 금칙어 추가 | O (Admin) | `{ "word": "..." }` |
| `DELETE` | `/api/admin/banned-words/{seq}` | 금칙어 삭제 | O (Admin) | Path Variable |
| `GET` | `/api/admin/photo-reviews` | 가입 회원 프로필 사진 심사 대기열 | O (Admin) | Header 토큰 |
| `POST` | `/api/admin/photo-reviews/{seq}/ai-check` | Sightengine API 연동 AI 사진 자동 분석 | O (Admin) | Path Variable |
| `POST` | `/api/admin/photo-reviews/decide` | 사진 승인 / 반려 최종 결정 | O (Admin) | `{ "reviewSeq": ..., "status": "APPROVED" \| "REJECTED" }` |
| `GET` | `/api/admin/blind-config` | 블라인드 채팅 타이머 설정값 조회 | O (Admin) | Header 토큰 |
| `PUT` | `/api/admin/blind-config` | 블라인드 채팅 시간 제한 수정 | O (Admin) | `{ "timeLimitMin": 15, "voteSeconds": 30 }` |
| `GET` | `/api/admin/stats/weekly` | 대시보드 주간 회원/매칭/방송 핵심 지표 | O (Admin) | Header 토큰 |
| `GET` | `/api/admin/stats/trend` | 연령대별·성별·지역별 이용 통계 트렌드 | O (Admin) | Header 토큰 |
| `GET` | `/api/admin/live/report` | 라이브 방송 신고 접수 목록 | O (Admin) | Header 토큰 |
| `POST` | `/api/admin/live/{liveRoomSeq}/end` | 불법 라이브 방송 관리자 강제 폭파/종료 | O (Admin) | Path Variable |

---

## 4. 공통 HTTP 상태 코드 및 예외 처리

| 상태 코드 | 명칭 | 발생 원인 및 설명 |
|---|---|---|
| `200 OK` | 성공 | 요청이 정상적으로 처리됨 |
| `400 BAD REQUEST` | 요청 형식 오류 | 필수 파라미터 누락, 유효성 검사 실패 (`@Valid`) |
| `401 UNAUTHORIZED` | 인증 필요 | JWT 토큰 누락, 서명 불일치, 토큰 만료 |
| `403 FORBIDDEN` | 권한 부족 | 일반 회원이 관리자(`ROLE_ADMIN`) 전용 API 호출 시 |
| `404 NOT FOUND` | 리소스 없음 | 대상 회원, 게시글, 방 번호가 존재하지 않음 |
| `409 CONFLICT` | 데이터 충돌 | 아이디/닉네임 중복, 이미 매칭 큐에 참여 중인 경우 |
| `429 TOO MANY REQUESTS` | 요청 횟수 초과 | Gemini API 분당 Quota 초과 또는 도배 방지 필터링 |
| `500 INTERNAL SERVER ERROR` | 서버 내부 오류 | 비즈니스 로직 예외 및 DB 쿼리 오류 |
| `503 SERVICE UNAVAILABLE` | 외부 서비스 일시 중단 | LiveKit Cloud 장애, AI 서버(`ai.server.url`) 미가동 시 |
