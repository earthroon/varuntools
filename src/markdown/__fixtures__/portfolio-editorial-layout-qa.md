# Existing Markdown heading remains part of the authoring flow

This fixture keeps normal Markdown headings beside editorial blocks so the layout QA does not accidentally replace the writing surface with a page-builder-shaped cage.

::editorial-title
level: major
as: h2
kicker: PORTFOLIO QA
title: 아주 긴 포트폴리오 대제목이 들어와도 레이아웃은 터지지 않아야 한다
subtitle: subtitle이 길어져도 본문 흐름을 밀어내지 않고 자연스럽게 줄바꿈되어야 한다. 이 문장은 의도적으로 길게 둔다.
::

::editorial-title
level: middle
as: h3
title: 반응형 칼럼 리듬 확인
subtitle: 태블릿과 모바일에서 칼럼이 자연스럽게 접히는지 확인한다.
::

::editorial-columns
cols: 2
gap: md
collapse: mobile
::
### 문제

긴 문장과 긴-토큰-긴-토큰-긴-토큰-긴-토큰이 들어와도 칼럼은 화면 바깥으로 도망가지 않아야 한다.

---
### 해결

각 grid item은 min-width: 0을 유지하고, 내부 텍스트는 overflow-wrap 기준으로 줄바꿈된다.
::

::editorial-columns
cols: 3
gap: lg
collapse: tablet
::
### 감정

사용자가 먼저 느끼는 압력과 결핍을 한 칼럼에 놓는다.

---
### 구조

정보 흐름은 DOM 순서를 따라 읽히며 모바일에서도 순서가 뒤집히지 않아야 한다.

---
### 기술

grid는 무너지지 않고, 긴 URL 후보 https://varun.tools/portfolio/editorial-layout-qa-long-token-example 도 column 내부에서 줄바꿈되어야 한다.
::

::editorial-title
level: minor
as: h4
title: 소제목은 칼럼 안팎에서 과한 여백 없이 작동해야 한다
::

## Existing Markdown middle heading remains valid

Normal `##` and `###` headings still work. Editorial blocks are a rhythm layer, not a replacement for Markdown.
