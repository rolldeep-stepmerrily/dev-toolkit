# Dev Toolkit — 제품 명세서 (SPEC)

## 개요

개발자를 위한 온라인 도구 모음 서비스. 자주 쓰는 개발 유틸리티를 클라이언트 사이드 또는 API 방식으로 제공한다.

---

## 1. 도구 목록 및 상세 명세

### 1-1. JWT 생성/검증기

**경로:** `/tools/jwt`


| 기능  | 설명                                        |
| --- | ----------------------------------------- |
| 생성  | Header + Payload + Secret으로 JWT 생성        |
| 디코딩 | JWT 입력 시 Header, Payload, Signature 분리 표시 |
| 검증  | Secret 입력 시 서명 유효성 검증, 만료 여부 확인           |


**입력 필드:**

- 알고리즘: `HS256` / `HS384` / `HS512` (기본: `HS256`)
- Header (JSON)
- Payload (JSON)
- Secret

**처리 방식:** 클라이언트 사이드 (API 호출 없음)

---

### 1-2. Bcrypt 생성/검증기

**경로:** `/tools/bcrypt`


| 기능    | 설명                             |
| ----- | ------------------------------ |
| 해시 생성 | 평문 + Salt Rounds로 bcrypt 해시 생성 |
| 검증    | 평문과 해시를 입력해 일치 여부 확인           |


**입력 필드:**

- 평문 (plain text)
- Salt Rounds: `1` ~ `14` (기본: `10`)
- 검증 시 bcrypt 해시

**처리 방식:** API (`POST /tools/bcrypt/hash`, `POST /tools/bcrypt/verify`)

> bcrypt 연산은 CPU 집약적이므로 서버 사이드에서 처리한다.

---

### 1-3. JSON 포맷터

**경로:** `/tools/json`


| 기능     | 설명                       |
| ------ | ------------------------ |
| 포맷팅    | 들여쓰기(2/4 spaces, tab) 적용 |
| 압축     | 공백 제거 minify             |
| 유효성 검사 | JSON 파싱 에러 위치 표시         |
| 변환     | JSON → YAML, YAML → JSON |


**처리 방식:** 클라이언트 사이드

---

### 1-4. Base64 인코더/디코더

**경로:** `/tools/base64`


| 기능       | 설명                          |
| -------- | --------------------------- |
| 인코딩      | 텍스트 → Base64                |
| 디코딩      | Base64 → 텍스트                |
| URL-safe | `+`/`/` → `-`/`_` 변환 옵션     |
| 파일 지원    | 파일 업로드 → Base64 Data URL 변환 |


**처리 방식:** 클라이언트 사이드

---

### 1-5. URL 인코더/디코더

**경로:** `/tools/url`


| 기능    | 설명                              |
| ----- | ------------------------------- |
| 인코딩   | `encodeURIComponent` 방식         |
| 디코딩   | `decodeURIComponent` 방식         |
| 쿼리 파싱 | URL 입력 시 쿼리스트링을 파라미터 테이블로 분리 표시 |


**처리 방식:** 클라이언트 사이드

---

### 1-6. 정규식 테스터

**경로:** `/tools/regex`


| 기능     | 설명                          |
| ------ | --------------------------- |
| 실시간 매칭 | 패턴 입력 즉시 테스트 문자열에서 매칭 하이라이트 |
| 플래그    | `g`, `i`, `m`, `s`, `u` 지원  |
| 매칭 목록  | 전체 매칭 및 캡처 그룹 표시            |
| 치환     | 매칭된 문자열을 치환 결과 미리보기         |


**처리 방식:** 클라이언트 사이드

---

### 1-7. IP 주소 확인기

**경로:** `/tools/ip`


| 기능             | 설명                         |
| -------------- | -------------------------- |
| 현재 IP 확인       | 요청자의 공인 IP 반환 (IPv4, IPv6) |
| IP 정보 조회       | 국가, ISP 등 GeoIP 정보 표시      |
| CIDR 계산        | 네트워크 주소, 브로드캐스트, 호스트 범위 계산 |
| IPv4 ↔ IPv6 변환 | IPv4-mapped IPv6 형식 변환     |


**처리 방식:**

- 현재 IP: API (`GET /tools/ip/me`)
- CIDR 계산 및 변환: 클라이언트 사이드

---

### 1-8. Timestamp 변환기

**경로:** `/tools/timestamp`


| 기능         | 설명                           |
| ---------- | ---------------------------- |
| 현재 타임스탬프   | 현재 Unix 타임스탬프 (초/밀리초) 실시간 표시 |
| 타임스탬프 → 날짜 | Unix timestamp 입력 → 날짜/시간 변환 |
| 날짜 → 타임스탬프 | 날짜/시간 입력 → Unix timestamp 변환 |
| 타임존 지원     | UTC, KST 등 주요 타임존 선택         |


**처리 방식:** 클라이언트 사이드

---

## 2. API 설계

### 베이스 URL

```
개발: http://localhost:3001
운영: https://api.devtoolkit.kr (예정)
```

### 공통 응답 형식

```json
// 성공
{ "data": { ... } }

// 에러
{
  "statusCode": 400,
  "errorCode": "BCRYPT_INVALID_HASH",
  "message": "유효하지 않은 bcrypt 해시입니다",
  "timestamp": "2026-03-03T00:00:00.000Z",
  "path": "/tools/bcrypt/verify"
}
```

### 엔드포인트


| Method | Path                   | 설명           |
| ------ | ---------------------- | ------------ |
| `POST` | `/tools/bcrypt/hash`   | bcrypt 해시 생성 |
| `POST` | `/tools/bcrypt/verify` | bcrypt 검증    |
| `GET`  | `/tools/ip/me`         | 요청자 IP 확인    |


#### `POST /tools/bcrypt/hash`

```json
// Request
{ "plainText": "myPassword123", "saltRounds": 10 }

// Response
{ "hash": "$2b$10$..." }
```

#### `POST /tools/bcrypt/verify`

```json
// Request
{ "plainText": "myPassword123", "hash": "$2b$10$..." }

// Response
{ "isMatch": true }
```

#### `GET /tools/ip/me`

```json
// Response
{
  "ipv4": "123.456.789.0",
  "ipv6": "::ffff:123.456.789.0",
  "country": "KR",
  "isp": "SK Broadband"
}
```

---

## 3. 프론트엔드 라우팅

```
/                       # 홈 (도구 목록)
/tools/jwt              # JWT 생성/검증기
/tools/bcrypt           # Bcrypt 생성/검증기
/tools/json             # JSON 포맷터
/tools/base64           # Base64 인코더/디코더
/tools/url              # URL 인코더/디코더
/tools/regex            # 정규식 테스터
/tools/ip               # IP 주소 확인기
/tools/timestamp        # Timestamp 변환기
```

---

## 4. 향후 로드맵

### Phase 2 — 사용자 기능


| 기능        | 설명                                    |
| --------- | ------------------------------------- |
| OAuth 로그인 | Google, GitHub OAuth 2.0 소셜 로그인       |
| 즐겨찾기      | 자주 쓰는 도구 북마크                          |
| 히스토리      | 최근 사용 기록 저장 (로그인 사용자)                 |
| 설정 저장     | 도구별 기본값 저장 (예: JWT 알고리즘, Salt Rounds) |


### Phase 3 — 도구 확장


| 도구          | 설명                           |
| ----------- | ---------------------------- |
| UUID 생성기    | v1, v4, v7 UUID 생성           |
| Hash 생성기    | MD5, SHA-1, SHA-256, SHA-512 |
| Color 변환기   | HEX ↔ RGB ↔ HSL              |
| Cron 파서     | Cron 표현식 해석 및 다음 실행 시간 계산    |
| YAML ↔ JSON | YAML 파싱 및 변환                 |
| Diff 뷰어     | 두 텍스트 차이 시각화                 |
| QR 코드 생성기   | 텍스트/URL → QR 코드 생성           |


### Phase 4 — 수익화


| 기능             | 설명                  |
| -------------- | ------------------- |
| Google AdSense | 광고 게재 (비로그인 사용자 대상) |
| 프리미엄 플랜        | 광고 제거, API 사용량 확대   |


---

## 5. 비기능 요구사항


| 항목          | 내용                                       |
| ----------- | ---------------------------------------- |
| 클라이언트 처리 우선 | 민감 데이터(JWT secret 등)는 서버 전송 없이 브라우저에서 처리 |
| 반응형         | 모바일/태블릿/데스크톱 지원                          |
| 다크모드        | 시스템 다크모드 연동                              |
| 복사 버튼       | 모든 출력 결과에 클립보드 복사 버튼 제공                  |
| 실시간 처리      | 입력 즉시 결과 반영 (클라이언트 사이드 도구)               |


