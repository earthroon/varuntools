---
title: "VARUNTOOLS 쇼룸 시스템"
slug: "works/varuntools-showroom"
layout: "default"
theme: "showroom"
description: "바룬툴즈 홈페이지와 스토어 카탈로그 구조를 정리한 쇼룸 시스템 작업입니다."
summary: "홈, 작업, 도구, 실험, 상품 카탈로그를 하나의 콘텐츠 구조로 묶은 VARUNTOOLS 쇼룸 시스템."
kind: "work"
status: "active"
visibility: "public"
featured: true
order: 1
cover: "./images/cover.svg"
thumbnail: "./images/cover.svg"
cardTitle: "VARUNTOOLS 쇼룸"
cardDescription: "홈페이지와 스토어 카탈로그를 함께 운영하기 위한 콘텐츠 쇼룸 구조."
cardCover: "./images/cover.svg"
tags:
  - work
  - homepage
  - store
  - system
work:
  type: "system"
  category: "system"
  status: "published"
  featured: true
  weight: 90
  year: 2026
  role:
    - "designer"
    - "developer"
    - "system-architect"
  stack:
    - "typescript"
    - "vue"
    - "markdown"
    - "cloudflare"
    - "css"
  tags:
    - "portfolio"
    - "showroom"
    - "content-system"
seoTitle: "VARUNTOOLS 쇼룸 시스템"
seoDescription: "VARUNTOOLS 홈페이지와 스토어 카탈로그 구조 작업 기록입니다."
ogImage: "./images/cover.svg"
---

# VARUNTOOLS 쇼룸 시스템

::editorial-title
level: major
as: h2
kicker: FEATURED WORK
title: VARUNTOOLS 쇼룸 시스템
subtitle: 홈페이지, 작업 기록, 실험실, 상품 카탈로그를 하나의 콘텐츠 동선으로 묶어 개인 작업실의 구조를 보여주는 쇼룸 시스템.
::

::markdown-box
type: ssot
title: 작업 요약
::
VARUNTOOLS는 포트폴리오, 도구, 실험, 상품 카탈로그를 한 구조 안에 묶는 개인 작업실형 홈페이지입니다. 이 페이지는 그 구조가 단순한 메뉴 묶음이 아니라, 작업자의 판단 흐름을 방문자가 따라갈 수 있게 만드는 쇼룸 시스템임을 설명합니다.
::

::editorial-columns
cols: 3
gap: lg
collapse: tablet
::
### 감정

흩어진 작업들이 단순 목록으로 밀려나지 않게 붙잡았습니다. 방문자가 결과만 훑고 지나가는 대신, 작업자의 감각과 방향성이 남아 있는 전시장처럼 읽히는 상태를 목표로 삼았습니다.

---
### 구조

홈, 작업, 도구, 실험, 상품 카탈로그를 분리하되 같은 콘텐츠 파이프라인 안에서 연결했습니다. 각 페이지는 독립적으로 보이지만, 메타데이터와 카드 흐름은 하나의 쇼룸 규칙을 공유합니다.

---
### 기술

Markdown directive, page metadata, 카드 그리드, smoke 검증을 엮어 실제 배포 가능한 구조로 고정했습니다. 보여주는 화면과 검증 가능한 콘텐츠 규칙을 같은 레이어에서 관리합니다.
::

::editorial-title
level: middle
as: h3
title: 문제와 해결
subtitle: 포트폴리오는 결과물 목록이 아니라, 작업 방식이 어떻게 반복 가능한 구조가 되었는지 보여주는 증거여야 합니다.
::

::editorial-columns
cols: 2
gap: md
collapse: mobile
::
### 문제

포트폴리오, 상품, 실험, 도구가 서로 다른 페이지로 흩어지면 방문자는 결과만 보고 판단 구조를 놓치기 쉽습니다. 작업은 많은데, 그것들이 왜 같은 세계에 있는지 설명하는 축이 사라집니다.

---
### 해결

각 콘텐츠를 같은 쇼룸 문법으로 묶고, 대표 작업과 상품 카탈로그가 서로를 밀어주는 탐색 흐름을 만들었습니다. 페이지는 나뉘지만, 방문자가 읽는 방향은 하나의 작업실을 통과하듯 이어집니다.
::

::editorial-title
level: middle
as: h3
title: 쇼룸이 고정하는 것
subtitle: 이 시스템은 예쁜 목록이 아니라, 작업의 공개 기준과 검증 가능한 콘텐츠 흐름을 함께 붙잡는 장치입니다.
::

::editorial-columns
cols: 3
gap: md
collapse: tablet
::
### 전시 밀도

대표 작업, 실험, 상품 후보가 서로 고립되지 않도록 최소한의 전시 밀도를 유지합니다.

---
### 작성 흐름

Markdown을 기본으로 두고 필요한 곳에만 directive를 얹어, 글을 쓰는 손맛과 구조화된 렌더링을 동시에 유지합니다.

---
### 검증 루프

카드, 메타데이터, 링크, 검색, editorial block이 smoke로 묶여 콘텐츠가 조용히 깨지는 일을 줄입니다.
::

::editorial-title
level: minor
as: h4
title: Seed Work 기준
::

::markdown-box
type: note
title: Commit 50-0 Seed
::
이 페이지는 실제 판매 상품을 임의로 만들지 않으면서 대표 작업 섹션의 최소 전시 밀도를 확보하기 위한 seed work입니다. 없는 상품을 꾸며내지 않고, 실제 구조와 공개 가능한 작업 단위만 전시 대상으로 삼습니다.
::
