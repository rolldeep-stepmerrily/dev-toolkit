# Dev Toolkit

개발자를 위한 온라인 도구 모음 서비스.

## 제공 도구

| 도구 | 설명 |
|------|------|
| JWT 생성/검증기 | JWT 토큰을 생성하고 페이로드를 디코딩하여 검증 |
| Bcrypt 생성/검증기 | 비밀번호 해시 생성 및 검증 |
| JSON 포맷터 | JSON 직렬화/역직렬화, 들여쓰기 포맷팅 |
| Base64 인코더/디코더 | 텍스트 및 파일의 Base64 변환 |
| URL 인코더/디코더 | URL 인코딩/디코딩 변환 |
| 정규식 테스터 | 정규식 패턴 작성 및 실시간 매칭 테스트 |
| IP 주소 확인기 | 현재 IP 확인, IPv4/IPv6 변환, CIDR 계산 |
| Timestamp 변환기 | Unix 타임스탬프 ↔ 날짜/시간 변환 |

## 기술 스택

| 영역 | 기술 |
|------|------|
| Backend | NestJS, Prisma, PostgreSQL, Redis |
| Frontend | Next.js 15 (App Router), React |
| Shared | TypeScript (`@repo/shared`) |
| Linter/Formatter | Biome |
| Auth | JWT (access + refresh token) |
| API Docs | Scalar (`/docs`, 개발 환경) |
| Package Manager | pnpm (워크스페이스 모노레포) |

## 개발 환경 설정

### 사전 요구사항

- Node.js 20+
- pnpm 9+
- Docker (PostgreSQL 로컬 실행용)

### 설치 및 실행

```bash
# 의존성 설치
pnpm install

# DB 실행
docker-compose up -d

# 환경 변수 설정
cp apps/api/.env.example apps/api/.env          # API 환경변수
cp apps/web/.env.example apps/web/.env.local    # Web 환경변수

# 전체 개발 서버 실행 (api + web 동시)
pnpm dev
```

### 개별 앱 실행

```bash
pnpm --filter @repo/api dev   # API 서버 (기본 포트: 3001)
pnpm --filter @repo/web dev   # Web 서버 (기본 포트: 3000)
```

### 빌드 및 린트

```bash
pnpm build    # 전체 빌드
pnpm lint     # Biome 린트 검사
pnpm check    # 린트 + 포맷 자동 수정
```

## 프로젝트 구조

```
dev-toolkit/
├── apps/
│   ├── api/              # NestJS REST API (@repo/api)
│   └── web/              # Next.js 15 프론트엔드 (@repo/web)
├── packages/
│   └── shared/           # FE/BE 공통 타입 및 유틸 (@repo/shared)
├── .claude/
│   ├── agents/           # code-reviewer 에이전트
│   └── skills/           # 코딩/Git 컨벤션 스킬
├── biome.json
├── tsconfig.json
└── pnpm-workspace.yaml
```

## 문서

| 문서 | 설명 |
|------|------|
| [CLAUDE.md](./CLAUDE.md) | Claude Code 아키텍처 가이드 (NestJS/Next.js 패턴) |
| [SPEC.md](./SPEC.md) | 제품 기능 명세 및 API 설계 |
