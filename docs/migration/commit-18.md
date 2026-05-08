# Commit 18 — Markdown Caption Tooltip / Chip Native Port

## 목적

Super/Notion 본체 바디에 있던 이미지 캡션 툴팁과 `[필수]`, `[선택]`, `[기타]` 칩을 Vite/Vue3 Markdown 렌더 파이프라인으로 이식한다.

기존 DOM 후처리 방식처럼 `.notion-image figcaption`을 늦게 스캔하지 않는다. 콘텐츠 SSOT는 `src/content/pages/**/index.md`이며, Markdown image title 또는 `::captioned-image` directive가 caption/chip의 기준이다.

## 추가된 것

- `CaptionedImage.vue`
- `captionTag.ts`
- `captionedImageDirective.ts`
- Markdown 기본 이미지의 `captioned-image` placeholder 렌더링
- `mountMarkdownComponents()`의 `captioned-image` Vue mount
- tooltip / chip / missing asset UI
- `scripts/validate-content.mjs`의 `captioned-image` 검증

## Markdown 이미지 규칙

```md
![대체 텍스트](./images/cover.svg "[필수] 대표 이미지 설명")
```

위 구문은 다음 의미로 렌더된다.

- `alt`: 대체 텍스트
- `tag`: 필수
- `caption`: 대표 이미지 설명
- `lightbox`: true

alt는 접근성 텍스트이며 tooltip caption으로 자동 승격하지 않는다. caption은 title 또는 directive caption으로 명시된 경우에만 생성된다.

## Directive 규칙

```md
::captioned-image
src: ./images/cover.svg
alt: 대표 이미지
caption: 보정 전후 비교용 대표 이미지
tag: 선택
lightbox: true
::
```

## 허용 tag

- 필수
- 선택
- 기타

그 외 tag는 렌더 단계에서는 invalid directive로 막고, content validation에서는 warning으로 보고한다.

## 완료 기준

- `npm run validate:content`
- `npm run typecheck`
- `npm run build`
- `node scripts/create-spa-fallback.mjs`

위 명령이 모두 통과해야 Commit 18 베이크로 인정한다.

## 비범위

- `[전]`, `[후]` legacy before/after adapter
- Pagecard grid migration
- TOC back/up/home 버튼
- Super/Notion DOM MutationObserver 복구
