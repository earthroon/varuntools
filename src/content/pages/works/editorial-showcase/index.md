---
title: "Editorial Block Showcase"
slug: "works/editorial-showcase"
layout: "default"
theme: "showroom"
description: "Portfolio editorial block preview surface for heading hierarchy and responsive column layouts."
summary: "대제목, 중제목, 소제목, 2/3칼럼 조판을 한 화면에서 검수하기 위한 숨김 쇼케이스 페이지."
kind: "work"
status: "active"
visibility: "hidden"
featured: false
order: 125
cardTitle: "Editorial Block Showcase"
cardDescription: "Portfolio editorial block preview surface."
tags:
  - portfolio
  - editorial
  - qa
work:
  type: "system"
  status: "private"
  featured: false
  weight: 0
  year: 2026
  role:
    - "Editorial system"
  stack:
    - "Markdown"
    - "Vue"
    - "CSS Grid"
  tags:
    - "portfolio"
    - "editorial"
    - "preview"
---

# Editorial Block Showcase

::editorial-title
level: major
as: h2
kicker: EDITORIAL SYSTEM
title: 포트폴리오를 문서가 아니라 편집물처럼 세우는 방법
subtitle: 대제목, 중제목, 소제목, 칼럼 조판을 통해 프로젝트의 사고 구조를 한 화면에서 검수한다.
::

이 페이지는 공개 작품 설명이 아니라, portfolio editorial block을 실제 렌더링 흐름에서 확인하기 위한 preview surface입니다.

::editorial-title
level: middle
as: h3
title: 제목 계층 Preview
subtitle: visual level과 실제 heading tag를 분리해 문서 순서를 보존합니다.
::

::editorial-title
level: minor
as: h4
title: 칼럼 내부의 짧은 판단 단위
::

소제목은 카드나 칼럼 내부에서 작은 판단 단위를 고정할 때 사용합니다. 과한 여백 없이 본문 흐름에 붙어야 합니다.

::editorial-title
level: middle
as: h3
title: 문제와 해결 2칼럼
subtitle: 비교가 필요한 구간은 좌우 구조로 짧게 접어 독자의 시선을 붙잡습니다.
::

::editorial-columns
cols: 2
gap: md
collapse: mobile
::
### 문제

프로젝트 설명이 긴 문단으로만 이어지면 독자는 핵심 판단 구조를 놓치기 쉽습니다.

---
### 해결

문제와 해결을 나란히 배치해 시선이 비교하고, 머리가 정리할 수 있는 구조를 만듭니다.
::

::editorial-title
level: middle
as: h3
title: 감정 / 구조 / 기술 3칼럼
subtitle: 선배식 판단 스택을 포트폴리오 화면에 직접 세우는 preview입니다.
::

::editorial-columns
cols: 3
gap: lg
collapse: tablet
::
### 감정

사용자가 먼저 느끼는 압력과 결핍을 놓치지 않습니다.

---
### 구조

그 감각이 머물 수 있도록 정보 흐름과 상태 귀속 위치를 나눕니다.

---
### 기술

그 구조를 실제로 작동시키는 렌더링, 저장, 검증 로직으로 봉인합니다.
::

::editorial-title
level: middle
as: h3
title: Long Text Preview
subtitle: 긴 제목과 긴 본문이 들어와도 column은 화면 밖으로 도망가지 않아야 합니다.
::

::editorial-columns
cols: 3
gap: md
collapse: tablet
::
### 긴 제목 후보

아주 긴 문장이 들어와도 텍스트는 column 내부에서 줄바꿈되어야 하며, layout은 수평 스크롤을 만들지 않아야 합니다.

---
### 긴 토큰 후보

https://varun.tools/portfolio/editorial-showcase/very-long-token-that-should-wrap-inside-the-column-without-breaking-the-grid

---
### 기존 heading 혼용

일반 Markdown heading과 editorial block은 서로를 대체하지 않고, 필요한 장면에서만 함께 사용합니다.
::
