# Portfolio Editorial Usage Examples

Commit 122 applies the Commit 121 editorial blocks to real portfolio content.
This guide is about **where to use the blocks**, not how to rebuild the renderer.

## Existing Markdown headings stay valid

Use normal Markdown headings for ordinary document flow.

```md
# Works
## Preview Loop
### Small note
```

Use `editorial-title` only when a section needs stronger editorial rhythm.

## Major heading

```md
::editorial-title
level: major
as: h2
kicker: PORTFOLIO
title: 감정과 구조를 도구로 바꾸는 작업들
subtitle: 설계, 색채, 자동화, 서사를 하나의 작동 구조로 엮는다.
::
```

## Middle heading

```md
::editorial-title
level: middle
as: h3
title: 문제와 해결
subtitle: 포트폴리오는 결과물 목록이 아니라 작업 방식의 증거여야 합니다.
::
```

## Minor heading

```md
::editorial-title
level: minor
as: h4
title: Seed Work 기준
::
```

## 2-column pattern: problem / solution

```md
::editorial-columns
cols: 2
gap: md
collapse: mobile
::
### 문제

작업 설명이 평면적인 목록으로만 흐르면 판단 구조가 보이지 않습니다.

---
### 해결

editorial heading과 column block을 대표 페이지에만 적용해 조판 리듬을 세웁니다.
::
```

## 3-column pattern: emotion / structure / technology

```md
::editorial-columns
cols: 3
gap: lg
collapse: tablet
::
### 감정

먼저 느껴지는 압력.

---
### 구조

감각이 머무는 정보 구조.

---
### 기술

그 구조를 작동시키는 구현.
::
```

## Applied pages in Commit 122

- `src/content/pages/works/index.md`
- `src/content/pages/works/varuntools-showroom/index.md`
- `src/markdown/__fixtures__/portfolio-editorial-applied.md`

## Overuse rule

Do not replace every `#`, `##`, and `###` with editorial blocks.
The block system is a framing tool. It should mark the moments where the portfolio needs a stronger editorial beat.

## Accessibility rule

The visual level and the HTML heading tag can be different. Keep the real `as` value aligned with document order.
Columns collapse to a single reading flow on smaller screens, so write each column in the order it should be read.
