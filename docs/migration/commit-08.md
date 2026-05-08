# Commit 08 — Legacy Section Gap Adapter

## 목적

기존 Super/Notion 시절 사용하던 `[문단끝]` 토큰을 DOM 후처리로 되살리지 않고, Markdown 렌더링 전 source transform 단계에서 `::section-gap` directive로 귀속한다.

```txt
기존 방식
[문단끝]
→ DOM scanner
→ .vg-section-gap 삽입

새 방식
[문단끝]
→ Markdown source adapter
→ ::section-gap directive
→ SectionGap.vue
```

이 커밋의 핵심은 과거 문서를 살리되, 런타임 권한은 새 Markdown layout directive SSOT에 귀속시키는 것이다.

---

## 범위

```txt
Commit 08 범위
├─ legacySectionGapAdapter.ts 추가
├─ [문단끝] 토큰을 ::section-gap으로 변환
├─ fenced code block 내부 토큰 무시
├─ token-only line 처리
├─ prefix token line 처리
├─ 변환 report 타입 추가
├─ LoadedMarkdownPage에 legacyTransforms report 추가
├─ loadMarkdownPages.ts에 adapter 연결
├─ legacy fixture 추가
└─ 문서 갱신
```

---

## 하지 않는 것

```txt
보류
├─ DOM scanner 이식 안 함
├─ MutationObserver 이식 안 함
├─ Super/Notion rootReady 이식 안 함
├─ 기존 .vg-section-gap CSS 이식 안 함
├─ [문단끝] 외 다른 legacy token 처리 안 함
├─ ::section nested wrapper 구현 안 함
├─ VENOM NAV 이식 안 함
├─ Lightbox / Tooltip / Pagecard legacy 이식 안 함
└─ GitHub Pages deploy workflow 안 함
```

---

## 변환 규칙

### token-only line

```md
문단 A

[문단끝]

문단 B
```

변환 결과:

```md
문단 A

::section-gap
size: md
::

문단 B
```

### prefix token line

```md
[문단끝]## 다음 섹션
```

변환 결과:

```md
::section-gap
size: md
::

## 다음 섹션
```

### inline token 무시

```md
이 문장 안의 [문단끝] 표기는 설명용이다.
```

문장 중간의 토큰은 변환하지 않는다.

### fenced code block 무시

````md
```txt
[문단끝]
```
````

코드블록 내부 토큰은 변환하지 않는다.

---

## 파일 변경

```txt
src/markdown/legacy/
├─ types.ts
├─ legacySectionGapAdapter.ts
└─ index.ts

src/markdown/types.ts
src/markdown/loadMarkdownPages.ts
src/markdown/__fixtures__/
├─ legacy-section-gap.md
├─ legacy-section-gap-prefix.md
└─ legacy-section-gap-code-fence.md
```

---

## 완료 기준

```txt
Commit 08 완료 조건
├─ src/markdown/legacy/types.ts 추가
├─ legacySectionGapAdapter.ts 추가
├─ legacy/index.ts 추가
├─ LoadedMarkdownPage에 legacyTransforms 추가
├─ loadMarkdownPages.ts에 applyLegacyMarkdownAdapters 연결
├─ token-only [문단끝] 변환
├─ prefix [문단끝] 변환
├─ inline [문단끝] 무시
├─ fenced code block [문단끝] 무시
├─ legacy fixtures 추가
├─ sample Markdown에 legacy token 예시 추가
├─ docs/migration/commit-08.md 작성
├─ markdown-content-rule.md 갱신
├─ extended-markdown-v0.md 갱신
└─ 기존 DOM scanner는 여전히 보류
```

---

## 후속 연결

다음 커밋 후보:

```txt
Commit 09 — Markdown Card / Featured Works Foundation
├─ ::feature-grid
├─ ::work-card
├─ frontmatter 기반 featured works
├─ 작업 목록 페이지 고도화
└─ 기존 Featured Works Grid 흡수 준비
```
