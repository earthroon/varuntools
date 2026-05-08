---
title: "Before / After Wiper"
slug: "wiper"
layout: "tool"
theme: "showroom"
description: "전후 비교 와이퍼 도구"
summary: "이미지 전후를 비교하는 쇼룸형 와이퍼 컴포넌트"
kind: "tool"
status: "active"
visibility: "public"
featured: true
order: 3
date: "2026-04-26"
updated: "2026-04-26"
series: "markdown-tools"
related:
  - lab/markdown-gallery
cover: "./images/cover.svg"
cardTitle: "Before / After Wiper"
cardDescription: "이미지 비교를 위한 전후 슬라이더 도구"
cardCover: "./images/cover.svg"
tags:
  - tool
  - image
  - markdown
work:
  type: "tool"
  category: "tool"
  status: "published"
  featured: true
  weight: 60
  year: 2026
  role:
    - "designer"
    - "developer"
  stack:
    - "typescript"
    - "vue"
    - "css"
    - "markdown"
  tags:
    - "image"
    - "comparison"
    - "tool"
seoTitle: "Before / After Wiper"
seoDescription: "이미지 전후를 비교하는 VARUNTOOLS 와이퍼 도구입니다."
ogImage: "./images/cover.svg"
---

# Before / After Wiper

이미지 전후를 비교하는 와이퍼 도구입니다.

::section-gap
size: sm
::

## Demo

::before-after
before: ./images/before.svg
after: ./images/after.svg
caption: 보정 전후 비교
initial: 50
::

::section-break
label: Usage
tone: quiet
::

## Authoring Rule

신규 Markdown 콘텐츠에서는 `[전]`, `[후]` 마커보다 `::before-after` directive를 우선 사용합니다.

### Legacy Compatibility

기존 Super/Notion 마커 파서는 후속 legacy adapter 커밋에서 따로 흡수합니다.
