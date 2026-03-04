# Dev Toolkit

개발자를 위한 도구 모음 웹서비스. kitd.kr과 유사한 형태.

## 모노레포 구조

```
dev-toolkit/
├── apps/
│   ├── api/          # NestJS - REST API 서버 (@repo/api)
│   └── web/          # Next.js 15 App Router - 프론트엔드 (@repo/web)
├── packages/
│   └── shared/       # FE/BE 공통 타입 및 유틸 (@repo/shared)
├── .claude/
│   ├── agents/       # code-reviewer
│   └── skills/       # code-convention, git-convention
├── biome.json        # 전체 lint/format 설정
├── tsconfig.json     # 베이스 TypeScript 설정
└── pnpm-workspace.yaml
```

## 에이전트 & 스킬

| 이름 | 경로 | 용도 |
|------|------|------|
| `code-reviewer` | `.claude/agents/code-reviewer.md` | 코드 리뷰 (코드 작성/수정 후 호출) |
| `general-convention` | `.claude/skills/code-convention/general-convention/SKILL.md` | TS 코딩 컨벤션 |
| `jsdoc-convention` | `.claude/skills/code-convention/jsdoc-convention/SKILL.md` | JSDoc 작성 규칙 |
| `commit-convention` | `.claude/skills/git-convention/commit-convention/SKILL.md` | 커밋/브랜치 컨벤션 |
| `pull-request-convention` | `.claude/skills/git-convention/pull-request-convention/SKILL.md` | PR 생성 워크플로우 |

## 패키지 매니저

**pnpm** 사용. npm/yarn 사용 금지.

```bash
pnpm install                          # 전체 의존성 설치
pnpm dev                              # api + web 동시 실행
pnpm build                            # 전체 빌드
pnpm lint                             # 전체 lint (biome)
pnpm check                            # lint + format 자동 수정

# 특정 앱만 실행
pnpm --filter @repo/api dev
pnpm --filter @repo/web dev

# 특정 앱에 패키지 추가
pnpm --filter @repo/api add <package>
pnpm --filter @repo/web add <package>
pnpm --filter @repo/shared add -D <package>
```

## 기술 스택

| 영역 | 기술 |
|---|---|
| Backend | NestJS, Prisma, PostgreSQL, Redis |
| Frontend | Next.js, React |
| Shared | TypeScript |
| Linter/Formatter | Biome |
| DB | PostgreSQL |
| Auth | JWT |
| API Docs | Scalar (`/docs`, 개발 환경만) |

## Biome 설정

- indent: 2 spaces, lineWidth: 120, quote: single, trailingCommas: all, semicolons: always
- `*.strategy.ts`, `*.controller.ts`, `*.service.ts`, `*.error.ts` → `useExplicitType: error`

---

## apps/api — NestJS 아키텍처

### 디렉토리 구조

```
src/
├── app.module.ts         # 루트 모듈 (ConfigModule, PrismaModule 등록)
├── main.ts               # 부트스트랩 (글로벌 설정)
└── common/
    ├── decorators/       # @@decorators
    ├── entities/         # @@entities
    ├── exceptions/       # @@exceptions — AppException, GLOBAL_ERRORS
    ├── filters/          # HttpExceptionFilter (전역)
    ├── interceptors/     # TransformInterceptor (전역)
    ├── middlewares/      # HttpLoggerMiddleware
    ├── pipes/            # @@pipes
    └── prisma/           # PrismaModule, PrismaService
```

새 기능: `src/<feature>/` 단위로 생성. 예: `src/tools/`, `src/auth/`

### Path Aliases

```typescript
import { AppException, GLOBAL_ERRORS } from '@@exceptions';
import { User } from '@@decorators';
import { BaseEntity } from '@@entities';
import { ParsePositiveIntPipe } from '@@pipes';
```

새 common 항목은 반드시 해당 디렉토리 `index.ts`에서 re-export.

### 에러 처리

`AppException` 사용 통일. `new Error()` / `HttpException` 직접 사용 금지.

```typescript
// src/<feature>/<feature>.error.ts
export const TOOL_ERRORS = {
  NOT_FOUND: {
    statusCode: HttpStatus.NOT_FOUND,
    errorCode: 'TOOL_NOT_FOUND',
    message: 'Tool not found',
  },
};

throw new AppException(TOOL_ERRORS.NOT_FOUND);
```

에러 응답: `{ statusCode, errorCode, message, timestamp, path }`

### 응답

`TransformInterceptor` 전역 적용 — `null`/`undefined` 반환 시 `{}`로 변환. 별도 래퍼 불필요.

### 모듈 패턴

```typescript
@Module({
  imports: [PrismaModule],
  controllers: [ToolsController],
  providers: [ToolsService],
})
export class ToolsModule {}
// → app.module.ts imports 배열에 추가
```

### Prisma

`PrismaModule`은 global — 별도 import 없이 `PrismaService` DI 주입.
DB 에러: `@CatchDatabaseErrors()` 데코레이터 사용.

### 환경 변수

`ConfigModule` global 등록 — `ConfigService` DI 주입.
새 env 변수는 `app.module.ts` Joi 스키마에 반드시 추가.

```typescript
this.configService.getOrThrow<string>('MY_ENV');
```

### 인증

JWT (access + refresh token). 인증 필요 시 `@UseGuards(JwtAuthGuard)` + `@ApiBearerAuth('accessToken')`.
현재 유저: `@User() user: UserEntity` 데코레이터로 추출.

---

## apps/web — Next.js 아키텍처

### 디렉토리 구조

```
src/
├── app/                  # App Router (pages/ 디렉토리 생성 금지)
│   ├── layout.tsx
│   ├── page.tsx
│   └── (tools)/<tool-name>/page.tsx
├── components/
│   ├── ui/               # 재사용 기본 UI
│   └── <feature>/        # 기능별 컴포넌트
├── lib/
│   ├── api.ts
│   └── utils.ts
└── types/                # FE 전용 타입
```

### Path Alias

`@/*` → `src/*`

### Server / Client Component

- **기본값: Server Component** — `async` 함수, 데이터 fetch는 서버에서 처리.
- `'use client'`: `onClick`, `useState`, `useEffect` 등 인터랙션이 실제로 필요할 때만.

### 데이터 페칭

```typescript
// Server Component에서 직접 fetch
export default async function ToolsPage() {
  const tools = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tools`, {
    next: { revalidate: 60 },
  }).then((r) => r.json());

  return <ToolList tools={tools} />;
}
```

### 환경 변수

`apps/web/.env.local`에 정의 (git 제외).

| 변수 | 설명 |
|---|---|
| `NEXT_PUBLIC_API_URL` | API 서버 URL |

### 공통 타입

```typescript
import type { SomeType } from '@repo/shared';
```

---

## Docker

```bash
docker-compose up -d    # PostgreSQL 로컬 실행
```
