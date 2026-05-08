# Commit 09 — Markdown Card / Featured Works Foundation

## 목적

Commit 09는 기존 Super/Notion 바디의 Featured Works DOM 후처리를 직접 이식하지 않고, VARUNTOOLS 작업 쇼룸 카드 구조를 Markdown frontmatter와 directive 기반으로 새로 세운다.

기존 방식:

```txt
Featured Works heading 탐색
→ Notion page link 수집
→ JS로 .vg-feature-card 생성
```

Commit 09 방식:

```txt
Markdown frontmatter
→ page registry
→ ::featured-works / ::work-card
→ FeaturedWorksGrid.vue / WorkCard.vue
```

## 범위

```txt
- MarkdownFrontmatter card metadata 보강
- pageRegistry.ts 추가
- ::featured-works directive 추가
- ::work-card directive 추가
- FeaturedWorksGrid.vue 추가
- WorkCard.vue 추가
- mountMarkdownComponents.ts bridge 연결
- markdown-cards.css 추가
- home / works / wiper 샘플 Markdown 갱신
```

## Frontmatter 카드 규약

```md
---
title: "Before / After Wiper"
slug: "tools/wiper"
kind: "tool"
status: "active"
featured: true
order: 3
cover: "./images/cover.svg"
cardTitle: "Before / After Wiper"
cardDescription: "이미지 비교를 위한 전후 슬라이더 도구"
cardCover: "./images/cover.svg"
tags:
  - tool
  - image
  - markdown
---
```

Fallback 규칙:

```txt
cardTitle 없으면 title 사용
cardDescription 없으면 summary → description 순서로 사용
cardCover 없으면 cover 사용
kind 없으면 page
status 없으면 active
```

없는 값을 새로 지어내지는 않는다. 명시된 frontmatter 필드 안에서만 fallback한다.

## Directive 문법

### Featured Works

```md
::featured-works
title: Featured Works
kind: tool
limit: 6
::
```

출력:

```html
<featured-works
  data-title="Featured Works"
  data-kind="tool"
  data-limit="6"
></featured-works>
```

### Work Card

```md
::work-card
slug: tools/wiper
::
```

수동 카드:

```md
::work-card
title: Manual Card
description: 직접 입력한 카드
cover: ./images/manual-cover.svg
href: /manual
tag: lab
::
```

## Page Registry

`src/markdown/pageRegistry.ts`가 LoadedMarkdownPage를 WorkCardEntry로 정규화한다.

```txt
LoadedMarkdownPage
→ toWorkCardEntry()
→ getFeaturedWorkEntries()
→ FeaturedWorksGrid.vue
```

## 하지 않는 것

```txt
- 기존 Featured Works DOM parser 이식 안 함
- Notion page link 자동 변환 안 함
- Callout → Pagecard Grid legacy 이식 안 함
- 외부 URL og:image fetch 안 함
- 검색/필터 UI 안 함
- Lightbox / VENOM NAV 이식 안 함
```

## 완료 기준

```txt
- DirectiveName에 featured-works / work-card 추가
- directiveParser known directives 갱신
- featuredWorksDirective.ts 추가
- workCardDirective.ts 추가
- directives/index.ts 연결
- pageRegistry.ts 추가
- FeaturedWorksGrid.vue 추가
- WorkCard.vue 추가
- mountMarkdownComponents.ts bridge 연결
- markdown-cards.css 추가
- main.ts에 markdown-cards.css import
- sample Markdown 갱신
- 기존 Featured Works DOM parser는 보류
```

## 후속 커밋 후보

Commit 10은 `/works`를 단순 featured grid가 아니라 전체 작업 인덱스로 승격하는 방향이 자연스럽다.

```txt
Commit 10 — Markdown Page Index / Works Collection Page
```
