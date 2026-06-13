---
title: "상품"
slug: "products"
layout: "default"
theme: "showroom"
description: "바룬툴즈 상품 카탈로그입니다."
summary: "판매 가능 상품과 준비 중인 상품을 모아두는 카탈로그입니다."
kind: "page"
status: "active"
visibility: "public"
featured: false
order: 20
tags:
  - products
  - store
seoTitle: "VARUNTOOLS 상품"
seoDescription: "바룬툴즈 상품 카탈로그입니다."
---

# 상품

::markdown-box
type: ssot
title: 상품 카탈로그
::
바룬툴즈의 판매 가능 상품과 준비 중인 상품을 모아두는 카탈로그입니다.  
Commit 48 기준으로 자체 결제는 구현하지 않고, Toss Payments 결제 링크와 Cloudflare 디지털 다운로드 URL을 상품 메타데이터로 관리합니다.
::

::markdown-box
type: note
title: 스토어 정책
::
상품 가격은 공개한다. `coming-soon`과 `sold-out` 상태의 상품도 메인/목록 노출 후보로 유지할 수 있다.  
구매는 `product.checkoutUrl`에 연결한 Toss Payments 링크를 사용하고, 디지털 상품 다운로드는 추후 `product.downloadUrl`에 Cloudflare 연동 URL을 연결한다.
::

::store-nav
title: 상품 분류
intro: 상품을 매대별로 둘러봅니다.
mode: categories
currentCategory: all
showCounts: true
showEmpty: true
includeAllLink: true
::

::product-catalog
title: 상품 카탈로그
intro: 판매 가능 상품과 준비 중인 상품을 검색하고 상태별로 확인합니다.
limit: 48
showUnavailable: true
showCategoryFilter: true
showCollectionFilter: true
showSubcategoryFilter: false
defaultCategory: all
defaultStatus: all
defaultType: all
defaultCollection: all
defaultTag: all
defaultSort: order
emptyTitle: 상품이 없습니다
emptyBody: 필터 조건을 바꾸거나 전체 상품으로 돌아가세요.
::
