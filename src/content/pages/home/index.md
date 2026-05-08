---
title: "VARUN Tools"
slug: "home"
layout: "default"
theme: "showroom"
description: "디자인, 도구, 실험, 상품을 모아둔 바룬툴즈 작업실입니다."
summary: "작업물, 상품, 도구, 실험을 정리하는 VARUNTOOLS 쇼룸"
cover: "./images/cover.svg"
thumbnail: "./images/cover.svg"
kind: "page"
status: "active"
visibility: "public"
featured: false
tags:
  - home
  - portfolio
  - tools
order: 0
seoTitle: "VARUN Tools"
seoDescription: "디자인, 도구, 실험, 상품을 모아둔 바룬툴즈 작업실입니다."
ogImage: "/og/default-og.svg"
---

# VARUN Tools

::markdown-box
type: ssot
title: 작업실 안내
::
바룬툴즈는 디자인 작업, 실험적 도구, 이미지/문서 아카이브, 상품 카탈로그를 한곳에 묶는 개인 작업실형 홈페이지입니다.
::

::home-section
title: Featured Products
source: products
featured: true
limit: 6
layout: product-grid
showUnavailable: true
emptyMode: notice
emptyTitle: 상품을 준비하고 있습니다
emptyBody: 판매 가능 상품과 디지털 다운로드 항목을 이곳에 정리할 예정입니다.
emptyHref: /products
emptyLabel: 상품 카탈로그 보기
::

::home-section
title: Featured Works
source: works
featured: true
limit: 6
layout: card-grid
emptyMode: notice
emptyTitle: 대표 작업을 정리하고 있습니다
emptyBody: 바룬툴즈의 작업 사례와 제작 기록이 이곳에 표시됩니다.
::

::home-section
title: Tools
source: tools
limit: 6
layout: card-grid
emptyMode: hide
::

::home-section
title: Lab
source: lab
limit: 4
layout: compact-list
emptyMode: hide
::
