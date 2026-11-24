# 🛠 트러블슈팅 기록

개발 중 겪은 문제와 해결 과정을 기록합니다.
새 항목은 **목차와 본문 모두 맨 위에** 추가합니다. (최신순)

## 목차

| # | 날짜 | 제목 | 분류 |
|---|---|---|---|
| 2 | 2026.11.24 | [DTO 필드 네이밍(camelCase / snake_case) 혼용으로 인한 충돌](#2-dto-필드-네이밍camelcase--snake_case-혼용으로-인한-충돌) | Backend · MyBatis · 협업 규칙 |
| 1 | 2026.11.20 | [시퀀스 이름 접두사/접미사 혼용으로 인한 충돌](#1-시퀀스-이름-접두사접미사-혼용으로-인한-충돌) | DB · MyBatis · 협업 규칙 |

---

## 2. DTO 필드 네이밍(camelCase / snake_case) 혼용으로 인한 충돌

- **날짜:** 2026.11.24
- **분류:** Backend · MyBatis · 협업 규칙
- **관련 문서:** `CONVENTION.md` 6-3, 6-4

### 문제 상황

팀원마다 DTO 필드 이름을 다르게 작성했다.

```java
// A 팀원
private Long live_room_seq;   // snake_case

// B 팀원
private Long memberSeq;       // camelCase
```

- 같은 파일을 서로 다른 방식으로 고치면서 **Git 머지 충돌**이 났다.
- 어느 쪽이 맞는지 기준이 없어서 충돌을 해결할 때마다 의견이 갈렸다.
- 확인 당시 DTO 43개 가운데 14개에 camelCase 필드 86개가 있었고, 나머지는 snake_case를 썼다.

### 원인 분석

**1. 규칙이 서로 맞지 않았다**

| 위치 | 기존 규칙 |
|---|---|
| 6-2 DB | 테이블, 컬럼은 `snake_case` |
| 6-3 자바 | 변수, 메서드는 `camelCase` |
| 6-4 MyBatis | DTO마다 snake_case 필드 또는 camelCase + 별칭 중 **선택** (별칭 권장) |
| 프론트엔드 / API JSON 키 | **규칙 없음** |

6-4에서 DTO마다 방식을 고를 수 있게 해 두어서, 사람마다 다른 방식을 쓰는 것이 규칙상 허용되었다.

**2. MyBatis 자동 변환이 꺼져 있다**

이 프로젝트는 `map-underscore-to-camel-case`를 쓰지 않는다.
MyBatis는 **컬럼명과 필드명을 대소문자만 무시하고 그대로 비교**한다.

| 컬럼 / 별칭 | DTO 필드 | 결과 |
|---|---|---|
| `MEMBER_SEQ` | `member_seq` | ⭕ 정상 |
| `member_seq AS memberSeq` | `memberSeq` | ⭕ 정상 |
| `MEMBER_SEQ` | `memberSeq` | ❌ **null** (에러 없음) |

**3. 오류는 케이스 혼용이 아니라 이름 불일치에서 난다**

케이스를 섞었다고 바로 오류가 나지는 않는다. 아래 세 곳에서 이름이 서로 다를 때 문제가 생긴다.

| 지점 | 이름이 다를 때 |
|---|---|
| SELECT 결과 → DTO | 값이 **조용히 null** |
| DTO → `#{...}` 파라미터 (INSERT/UPDATE) | `There is no getter for property named '...'` **예외** |
| 프론트 JSON ↔ DTO (`@RequestBody`, 응답) | 값이 **조용히 null**, 프론트에서 `undefined` |

방식을 바꾸는 과정에서 DTO 필드명만 바꾸고 매퍼 XML이나 프론트 코드를 그대로 두면, 에러 없이 null이 되어 원인을 찾기 어렵다.

**참고: 이름 규칙과 Git 충돌은 별개다**

Git 충돌은 **같은 파일의 같은 줄을 동시에 고칠 때** 생긴다.
규칙을 통일하면 "어느 쪽이 맞나" 하는 논쟁은 사라지지만, 같은 줄을 함께 수정하면 여전히 충돌이 난다.

### 해결

**1. 팀 합의: DTO 멤버 필드는 `snake_case`로 통일**

- DB 컬럼명 = DTO 필드명 = API JSON 키가 되어 이름을 따로 맞출 필요가 없다.
- 자바 클래스, 메서드, React 컴포넌트 이름은 기존 규칙(`PascalCase` / `camelCase`)을 유지한다.

**2. `CONVENTION.md` 개정**

- 6-3: "DTO 멤버 필드는 예외로 snake_case" 추가
- 6-4: 선택 규칙과 camelCase 별칭 권장을 삭제하고 아래 내용을 추가
  - SELECT는 컬럼명을 그대로 쓰고, 별칭이 필요하면 snake_case로 쓴다 (`AS viewer_count`)
  - 파라미터도 `#{member_seq}`처럼 필드명을 그대로 쓴다
  - DTO 필드명을 바꾸면 **매퍼 XML과 프론트 코드를 같은 커밋에서** 함께 바꾼다
  - 바꾼 뒤에는 조회 결과와 요청 값이 null인지 확인한다

**3. 기존 camelCase DTO 전환 방법**

일괄 변경은 많은 파일을 건드려서 진행 중인 브랜치와 크게 충돌한다. 그래서 아래 순서로 진행한다.

1. 열려 있는 PR을 먼저 모두 머지한다.
2. 한 사람이 `refactor/etc-dto-snake-case` 브랜치에서 한 번에 바꾼다. 바꾸는 동안 다른 팀원은 해당 파일을 수정하지 않는다.
3. 바꿀 대상은 DTO 필드, getter/setter, 매퍼 XML의 별칭과 `#{}`, 프론트의 JSON 키 사용처다.
4. 머지가 끝나면 전원 Sync fork를 하고 새 브랜치를 딴다.

### 배운 점

- 규칙에 "각자 선택"을 열어 두면 결국 섞인다. 공유 코드는 **한 가지로 정해 두는 것**이 낫다.
- 규칙은 백엔드 → DB → 프론트로 이어지는 **흐름 전체**를 기준으로 정해야 한다. 프론트나 JSON 키처럼 규칙이 빠진 곳에서 혼용이 시작된다.
- MyBatis와 Jackson의 이름 불일치는 대부분 **에러 없이 null**로 나타난다. 이름을 바꾼 뒤에는 실제 값이 들어오는지 꼭 확인한다.

---

## 1. 시퀀스 이름 접두사/접미사 혼용으로 인한 충돌

- **날짜:** 2026.11.20
- **분류:** DB · MyBatis · 협업 규칙
- **관련 문서:** `CONVENTION.md` 6-2
- **관련 PR / 커밋:** PR #31 (`refactor/etc-sequence-rename`), `[Hotfix] : 시퀀스 명 수정`, `hotfix : 채팅방 시퀀스 글자 위치 수정`, `hotfix : 시퀀스 글자위치 수정`

### 문제 상황

Oracle 시퀀스 이름을 팀원마다 다르게 만들었다. `seq`를 **앞에 붙인 사람**과 **뒤에 붙인 사람**이 섞여 있었다.

```sql
-- 접미사 방식
SELECT MEMBER_SEQ.NEXTVAL FROM DUAL
SELECT CHAT_ROOM_SEQ.NEXTVAL FROM DUAL

-- 접두사 방식
SELECT SEQ_POST.NEXTVAL FROM DUAL
SELECT seq_notice.nextval FROM DUAL
```

- 팀이 DB를 함께 쓰는데 시퀀스 이름이 제각각이라, 다른 사람이 만든 시퀀스를 매퍼에서 잘못 부르면 `ORA-02289: 시퀀스가 존재하지 않습니다` 오류가 났다.
- 통일하는 과정에서 매퍼의 `NEXTVAL` 이름을 일일이 고치는 hotfix 커밋이 여러 번 필요했다.
- 같은 테이블의 시퀀스를 다른 이름으로 새로 만들면 1부터 다시 시작해서, 기존 PK와 겹쳐 `ORA-00001: 무결성 제약 조건에 위배됩니다`가 날 수 있었다.

### 원인 분석

**1. 시퀀스 이름이 PK·FK 컬럼 이름과 똑같았다**

이 프로젝트의 PK는 `seq`, FK는 `대상테이블_seq`다. (예: `member_seq`)
접미사 방식으로 시퀀스를 만들면 **시퀀스 이름이 FK 컬럼 이름과 똑같아진다.**

| 이름 | 접미사 방식에서의 의미 |
|---|---|
| `MEMBER_SEQ` | FK 컬럼 `member_seq` 이기도 하고, 시퀀스 `MEMBER_SEQ` 이기도 하다 |
| `CHAT_ROOM_SEQ` | FK 컬럼 `chat_room_seq` 이기도 하고, 시퀀스 `CHAT_ROOM_SEQ` 이기도 하다 |

그래서 매퍼를 읽을 때 `CHAT_ROOM_SEQ`가 컬럼인지 시퀀스인지 바로 알 수 없었고, 수정하다 헷갈리기 쉬웠다.

**2. 시퀀스 이름 규칙이 없었다**

처음에는 `CONVENTION.md`에 시퀀스 이름 규칙이 없어서 각자 익숙한 방식으로 만들었다.

**3. 시퀀스 이름은 DB와 매퍼 양쪽에 있다**

시퀀스 이름은 DB 객체 이름이면서 매퍼 XML 안의 문자열이기도 하다. 한쪽만 바꾸면 컴파일은 되고 **실행할 때 오류가 난다.**

### 해결

**1. 시퀀스 이름을 접두사 `seq_테이블명`으로 통일** (`CONVENTION.md` 6-2)

```sql
-- ⭕
SEQ_MEMBER.NEXTVAL
SEQ_CHAT_ROOM.NEXTVAL

-- ❌
MEMBER_SEQ.NEXTVAL
CHAT_ROOM_SEQ.NEXTVAL
```

- 접두사 방식으로 하면 `SEQ_`로 시작하는 것은 시퀀스, `_seq`로 끝나는 것은 컬럼으로 **이름만 보고 구분**할 수 있다.

**2. 기존 시퀀스와 매퍼 일괄 수정**

| 커밋 | 바꾼 곳 | 예시 |
|---|---|---|
| PR #31 `refactor: 라이브·이상형 매칭 시퀀스명을 seq_테이블명 규칙으로 변경` | `live-mapper.xml`, `ideal-matching-mapper.xml` | `LIVE_CHAT_SEQ` → `SEQ_LIVE_CHAT` |
| `[Hotfix] : 시퀀스 명 수정` | `blind-mapper.xml` | `BLIND_CHAT_ROOM_SEQ` → `SEQ_BLIND_CHAT_ROOM` |
| `hotfix : 채팅방 시퀀스 글자 위치 수정` | `chatting-mapper.xml` | `CHAT_MESSAGE_SEQ` → `SEQ_CHAT_MESSAGE` |
| `hotfix : 시퀀스 글자위치 수정` | `members-mapper.xml` | `MEMBER_SEQ` → `SEQ_MEMBER` |

현재 매퍼의 모든 `NEXTVAL`이 `SEQ_` 접두사를 쓰고 있다.

**3. 시퀀스를 바꿀 때 지킬 규칙 추가** (`CONVENTION.md` 6-2)

- 테이블에 데이터가 있으면 새 시퀀스를 `START WITH (PK 최댓값 + 1)`로 만든다. 1부터 시작하면 기존 PK와 겹쳐 `ORA-00001`이 난다.

  ```sql
  -- 예: member 테이블의 seq 최댓값이 37이면
  CREATE SEQUENCE seq_member START WITH 38;
  DROP SEQUENCE member_seq;
  ```

- DB는 팀이 함께 쓰므로, 테이블이나 시퀀스를 바꾸기 전에 **미리 공지**하고 PR 본문에 SQL 스크립트를 함께 적는다.

### 배운 점

- 이름은 **겹치지 않게** 정해야 한다. 시퀀스와 컬럼이 같은 이름을 쓰면 읽을 때도, 고칠 때도 실수가 난다.
- DB 객체 이름을 바꿀 때는 **DB와 매퍼를 함께** 바꾸고, 데이터가 있으면 시퀀스 시작 번호까지 챙겨야 한다.
- 공용 DB를 바꾸는 작업은 혼자 하지 말고 공지와 SQL 공유부터 한다.
- 이 경험이 있었는데도 DTO 필드 이름에서 같은 문제가 다시 생겼다. (2번 항목) 이름 규칙은 **처음부터 한 가지로** 정해 두는 것이 가장 싸다.
