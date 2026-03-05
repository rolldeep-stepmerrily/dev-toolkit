---
name: responsive-design
description: 프론트엔드 UI 작업 시 반응형 디자인을 적용합니다. PC를 기본으로 작성하되 모바일도 반드시 함께 고려합니다. FE 컴포넌트 작성/수정 시 항상 참고합니다.
triggers:
  - 컴포넌트 작성
  - 컴포넌트 수정
  - UI 작업
  - 프론트엔드
  - 반응형
  - 모바일
---

# 반응형 디자인 컨벤션

## 개요

모든 프론트엔드 UI 작업은 **PC(데스크탑)를 기본**으로 작성하고, 모바일에서도 사용 가능하도록 반드시 함께 고려합니다.
새 컴포넌트를 만들거나 기존 컴포넌트를 수정할 때 모바일 레이아웃을 빠뜨리지 않도록 반드시 이 가이드를 따릅니다.

---

## Tailwind CSS 브레이크포인트

| 접두사 | 최솟값 | 대상 기기 |
|--------|--------|-----------|
| (없음) | 0px | 공통 기본값 |
| `sm:` | 640px | 큰 모바일 / 소형 태블릿 |
| `md:` | 768px | 태블릿 |
| `lg:` | 1024px | 데스크탑 (주요 타겟) |
| `xl:` | 1280px | 와이드 데스크탑 |

---

## 기본 원칙

### PC 기준으로 작성, 모바일은 max-width 또는 작은 브레이크포인트로 대응

```tsx
// ❌ Bad - 모바일 대응 없음
<div className="grid grid-cols-3 gap-6 p-8">

// ✅ Good - PC 기본, 모바일에서 단일 열로 축소
<div className="grid grid-cols-3 gap-6 p-8 max-md:grid-cols-1 max-md:p-4">
```

> `max-md:` = md(768px) 미만에서 적용 — Tailwind v3.2+의 max-width variant

### 레이아웃

```tsx
// ✅ Good - PC: 가로 배치, 모바일: 세로 배치
<div className="flex flex-row gap-6 max-md:flex-col max-md:gap-4">

// ✅ Good - PC: 3열 그리드, 모바일: 1열
<div className="grid grid-cols-3 gap-6 max-md:grid-cols-1">
```

### 텍스트 크기

```tsx
// ✅ Good - PC 기준 크기, 모바일에서 축소
<h1 className="text-4xl font-bold max-md:text-2xl">
<p className="text-base max-md:text-sm">
```

### 여백

```tsx
// ✅ Good - PC 기준 여백, 모바일에서 축소
<section className="px-16 py-12 max-md:px-4 max-md:py-6">
```

---

## 컴포넌트 유형별 체크리스트

### 네비게이션

- [ ] PC: 사이드바 또는 상단 네비게이션 항상 표시
- [ ] 모바일: 햄버거 메뉴 버튼으로 접고 펼치는 드로어/오버레이 제공
- [ ] 모바일 오버레이 열림-닫힘 상태 관리

```tsx
// ✅ Good
<nav className="w-56 shrink-0 max-md:hidden">          {/* PC: 고정 사이드바 */}
<button className="hidden max-md:flex">메뉴</button>   {/* 모바일: 햄버거 버튼 */}
```

### 버튼 / 인터랙티브 요소

- [ ] 모바일에서 터치 타겟 최소 44x44px 확보

```tsx
// ✅ Good
<button className="px-4 py-2 max-md:min-h-[44px] max-md:min-w-[44px]">
```

### 폼

- [ ] PC: 인풋과 버튼 나란히 배치 가능
- [ ] 모바일: 전체 너비로 세로 배치

```tsx
// ✅ Good
<div className="flex flex-row gap-4 max-md:flex-col">
  <input className="max-md:w-full" />
  <button className="max-md:w-full">제출</button>
</div>
```

### 테이블 / 데이터 목록

- [ ] PC: 일반 테이블 레이아웃
- [ ] 모바일: 가로 스크롤 허용 또는 카드형 목록으로 전환

```tsx
// ✅ Good - 모바일 가로 스크롤
<div className="overflow-x-auto">
  <table className="min-w-full max-md:min-w-[600px]">
```

### 모달 / 다이얼로그

- [ ] PC: 중앙 다이얼로그
- [ ] 모바일: 전체 화면 또는 하단 시트(bottom sheet)

```tsx
// ✅ Good
<div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] max-md:inset-0 max-md:w-full max-md:translate-x-0 max-md:translate-y-0">
```

---

## PC 전용 / 모바일 전용 노출

```tsx
// PC에서만 표시
<div className="block max-md:hidden">PC 전용</div>

// 모바일에서만 표시
<div className="hidden max-md:block">모바일 전용</div>
```

---

## 접근성

- [ ] 터치 가능한 요소에 `aria-label` 명시
- [ ] `type="button"` 누락 금지 (form 내 버튼)
- [ ] `outline-none`만 사용 시 `focus-visible:ring` 대체 필수

```tsx
// ✅ Good
<button
  type="button"
  aria-label="메뉴 열기"
  className="rounded-md p-2 focus-visible:ring-2 focus-visible:ring-ring"
>
  <MenuIcon className="h-5 w-5" />
</button>
```

---

## 작업 완료 체크리스트

컴포넌트 작성/수정 후 아래 항목을 반드시 확인합니다.

- [ ] PC(1280px) 레이아웃이 의도대로 표시됨
- [ ] 태블릿(768px) 전환이 자연스러움
- [ ] 모바일(375px) 레이아웃이 깨지지 않음
- [ ] 모바일에서 터치 타겟 크기 충분 (최소 44px)
- [ ] 모바일 전용 UI 요소(햄버거 메뉴 등) 정상 동작
- [ ] `aria-label` 등 접근성 속성 누락 없음
- [ ] 의도치 않은 가로 스크롤 발생하지 않음
