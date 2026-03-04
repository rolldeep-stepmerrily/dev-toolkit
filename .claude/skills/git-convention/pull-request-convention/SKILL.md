---
name: pull-request-convention
description: PR 생성 전 코드 리뷰를 수행하고 이슈가 없으면 PR을 생성합니다.
triggers:
  - PR
  - PR 만들어줘
  - pull request
  - git pr
---

# PR 생성 워크플로우

PR 생성 전 코드 리뷰를 자동 수행하여 품질을 보장합니다.

---

## 워크플로우 개요

```
[Step 1] 코드 리뷰 수행 (code-reviewer 서브에이전트)
    ↓
[Step 2] 리뷰 결과 판단
    ↓
[Step 3] base 브랜치 선택
    ↓
[Step 4] PR 생성 또는 수정 안내
```

---

## Step 1: 코드 리뷰 수행

**code-reviewer 에이전트를 호출하여 변경사항을 검토합니다.**

```
Task 도구 호출:
- subagent_type: "code-reviewer"
- prompt: "현재 브랜치의 변경사항을 리뷰해주세요."
```

### 리뷰 대상

- `git diff`로 확인되는 모든 변경사항
- 컨벤션 준수 여부
- 보안 취약점
- 코드 품질

---

## Step 2: 리뷰 결과 판단

| 결과 | 조건 | 조치 |
|------|------|------|
| **BLOCKED** | CRITICAL 이슈 존재 | PR 생성 중단, 수정 필요 사항 안내 |
| **WARNING** | WARNING 이슈만 존재 | 사용자에게 확인 후 진행 여부 질문 |
| **APPROVED** | SUGGESTION 이하만 존재 | PR 생성 진행 |

### BLOCKED 시 출력 형식

```
## PR 생성 불가

코드 리뷰에서 CRITICAL 이슈가 발견되어 PR을 생성할 수 없습니다.

### 발견된 이슈

[CRITICAL] 이슈 제목
- 파일: src/path/to/file.ts:42
- 문제: 문제 설명
- 수정: 수정 방법

### 다음 단계

1. 위 이슈들을 수정해주세요.
2. 수정 후 다시 "PR 올려줘"를 요청해주세요.
```

### WARNING 시 사용자 질문

AskUserQuestion 도구를 사용하여 사용자의 선택을 받습니다.

---

## Step 3: base 브랜치 선택

**PR 생성 전 사용자에게 base 브랜치를 확인합니다.**

### AskUserQuestion 호출

```json
{
  "questions": [{
    "question": "PR의 base 브랜치를 선택해주세요.",
    "header": "Base 브랜치",
    "options": [
      { "label": "develop (Recommended)", "description": "개발 브랜치로 머지" },
      { "label": "main", "description": "운영 브랜치로 직접 머지" }
    ],
    "multiSelect": false
  }]
}
```

| 브랜치 | 용도 |
|--------|------|
| `develop` | 일반적인 기능 개발/버그 수정 (기본값) |
| `main` | 핫픽스, 긴급 배포, 릴리스 |

---

## Step 4: PR 생성

### 4-1. 브랜치 정보 확인

```bash
git branch --show-current
```

### 4-2. 변경사항 분석

```bash
git log {base}..HEAD --oneline
git diff {base}...HEAD --stat
```

### 4-3. PR 작성

#### PR 제목

```
<type>: <description>
```

- 브랜치명 또는 커밋에서 type 추출
- 한국어로 간결하게 작성

#### PR 본문 템플릿

```markdown
## 💡 PR 요약

여기에 요약 작성 (1-2문장)

---

## 📖 설명

여기에 상세 설명 작성 (72자 마다 줄바꿈)

---

### 🔗 참고 링크

여기에 관련 이슈, 문서, 참고 자료 링크

---

## 👀 확인 사항

여기에 확인 사항 작성 (72자 마다 줄바꿈)
 
```

#### PR 라벨

| 커밋 타입 | PR 라벨 |
|-----------|---------|
| `feat` | `enhancement` |
| `refactor` | `refactoring` |
| `fix` | `bug` |
| `docs` | `documentation` |
| `test` | `test` |
| `chore` | (라벨 없음) |

**gh CLI 사용 시:**
```bash
gh pr create --label "enhancement" --title "feat: ..." --body "..."
```

#### GitHub MCP 호출

```
mcp__github__create_pull_request 사용:
- owner: {repository owner}
- repo: {repository name}
- title: PR 제목
- body: PR 본문
- head: 현재 브랜치
- base: 사용자가 선택한 브랜치
```

---

## 주의사항

1. **리모트 푸시 확인**: PR 생성 전 현재 브랜치가 리모트에 푸시되어 있는지 확인
2. **base 브랜치**: 사용자가 선택한 브랜치 사용 (기본값: develop)
3. **라벨 설정**: 타입에 맞는 라벨 반드시 추가

---

## 체크리스트

PR 생성 전 확인사항:

- [ ] 코드 리뷰 통과
- [ ] 커밋 메시지가 컨벤션을 따르는가?
- [ ] 브랜치 이름이 컨벤션을 따르는가?
- [ ] PR 제목이 명확한가?
- [ ] PR 라벨이 타입에 맞게 설정되었는가?