# Commit 04 — VARUNTOOLS Showroom Theme Stabilization

## 목적

Commit 03에서 실제 Vue 컴포넌트로 살아난 Markdown directive 요소들을 VARUNTOOLS Showroom 테마 안에 안정적으로 정착시킨다.

이 커밋은 기능 추가 커밋이 아니라, 뒤 커밋들이 올라탈 수 있는 표면 기준을 세우는 CSS / 토큰 / 반응형 안정화 커밋이다.

## 범위

- `tokens.css`에 `--vt-*` 토큰 SSOT 추가
- 기존 `--ink`, `--surface`, `--hair` 계열은 backward compatibility alias로 유지
- `base.css` 전역 배경 / 타이포 / reduced-motion 안정화
- `markdown.css` 문서 표면, heading, paragraph, list, link, strong, mark, code 스타일 정리
- `markdown-components.css`에서 Video / BeforeAfter / ImageCard / Callout 표면감 통일
- `varuntools-showroom.css`를 실제 theme layer로 승격
- 모바일 padding / handle size / caption spacing 보강
- `BeforeAfterWiper.vue`에 pointerleave cleanup과 caption 기반 aria-label 보강
- `VarunVideo.vue`에서 source가 없으면 video를 렌더하지 않도록 보강

## 보류

- VENOM NAV 이식 안 함
- Lightbox 이식 안 함
- Tooltip Caption 이식 안 함
- Pagecard Grid legacy parser 이식 안 함
- Featured Works Grid legacy parser 이식 안 함
- Super/Notion `[전]` / `[후]` DOM parser 이식 안 함
- Markdown directive parser 변경 안 함
- Vue mount bridge 구조 변경 안 함
- GitHub Pages deploy workflow 추가 안 함

## SSOT

```txt
Theme Token SSOT:
src/styles/tokens.css

Markdown Layout SSOT:
src/styles/markdown.css

Markdown Component SSOT:
src/styles/markdown-components.css

Theme Override SSOT:
src/styles/themes/varuntools-showroom.css
```

## 토큰 정책

새 기준 토큰은 `--vt-*` 이름을 사용한다.

```txt
--vt-bg-0
--vt-bg-1
--vt-ink
--vt-ink-soft
--vt-ink-muted
--vt-accent
--vt-accent-soft
--vt-accent-glow
--vt-surface
--vt-surface-strong
--vt-surface-solid
--vt-hair
--vt-hair-strong
--vt-shadow-0
--vt-shadow-1
--vt-shadow-2
--vt-radius-lg
--vt-radius-md
--vt-radius-sm
--vt-radius-pill
--vt-content-max
--vt-page-padding-x
--vt-page-padding-y
--vt-page-padding-bottom
```

기존 커밋의 CSS / 컴포넌트가 참조하던 변수명은 alias로 유지한다.

```txt
--ink → --vt-ink
--ink-soft → --vt-ink-soft
--surface → --vt-surface
--surface2 → --vt-surface-strong
--hair → --vt-hair
--hair2 → --vt-hair-strong
--sh1 → --vt-shadow-1
--r-md → --vt-radius-md
```

## 전역 CSS 정책

기존 Showroom V3처럼 `a, a *` 또는 `body` 전체를 강제로 덮는 방식은 쓰지 않는다.

```txt
금지:
a, a * { box-shadow: none !important; }
body { transform: none !important; }
```

새 구조에서는 `.vt-markdown`, `.theme-showroom` 범위 안에서만 스타일을 제어한다.

## 접근성 보강

- `prefers-reduced-motion: reduce` 대응 추가
- `BeforeAfterWiper`의 range input aria-label을 caption 기반으로 변경
- `BeforeAfterWiper`에 `:focus-within` outline 추가
- pointer가 컴포넌트 밖으로 나갔을 때 dragging 상태가 남지 않도록 pointerleave cleanup 추가

## QA 체크리스트

```txt
- / 에서 Markdown 문서 표면이 정상 표시
- /works 에서 GIF 이미지가 정상 표시
- /tools/wiper 에서 before-after 위젯이 쇼룸 톤으로 표시
- video directive가 카드 표면과 같은 질감으로 표시
- image-card hover가 과하지 않음
- callout-box note/warning/tip 구분 가능
- 모바일 900px 이하에서 padding 과밀하지 않음
- before-after handle이 모바일에서 터치 가능
- link hover가 카드 그림자를 죽이지 않음
- global a, a * 규칙이 존재하지 않음
- !important 사용은 reduced-motion 접근성 처리 외 최소화
```

## 완료 기준

```txt
- tokens.css에 --vt-* 토큰 추가
- 기존 변수명 alias 유지
- base.css 전역 안정화
- markdown.css 기본 문서 스타일 정리
- markdown-components.css 컴포넌트 표면감 정리
- varuntools-showroom.css theme layer 구현
- 모바일 CSS 보강
- reduced-motion 대응
- BeforeAfterWiper focus-within 접근성 보강
- docs/migration/commit-04.md 작성
- legacy Super/Notion 관련 기능은 여전히 보류
```

## 후속 커밋 후보

```txt
Commit 05 — Markdown Media / Asset Hardening
- video poster fallback
- missing asset warning
- resolved URL debug
- image lazy / decoding 정책
- contentDir mismatch 방어
```
