# Commit 50-0 — Seed Content / Empty Section Guard

## 목적

Commit 50의 wide media rail 작업에 들어가기 전에 홈페이지와 상품 카탈로그의 빈 섹션이 개발자용 문구로 노출되지 않도록 empty state 계약을 고정한다.

```txt
Commit 49   = Homepage Index / Featured Works + Products System
Commit 50-0 = Seed Content / Empty Section Guard
Commit 50   = Media Breakout Rail / Wide Image Layout
```

## 변경 요약

- `HomeSection.vue`에 `emptyMode`, `emptyTitle`, `emptyBody`, `emptyHref`, `emptyLabel` props를 추가했다.
- `emptyMode: hide`일 때 실제 섹션 wrapper를 렌더하지 않는다.
- `emptyMode: notice`일 때 사용자용 empty card를 렌더한다.
- `::home-section` directive와 mount bridge가 empty props를 전달한다.
- 홈/상품 인덱스에 한국어 empty notice를 명시했다.
- 실제 상품을 임의 생성하지 않고, work seed `works/varuntools-showroom`만 추가했다.
- `smoke:seed-content-empty`를 추가하고 `check:launch`에 연결했다.

## 오염 방지

상품 seed는 추가하지 않았다. 상품명, SKU, 가격, 구매 링크는 실제 운영 정보이므로 없는 데이터를 public content tree에 넣지 않는다.

## 검증

```bash
npm run smoke:product-catalog
npm run smoke:homepage-index
npm run smoke:seed-content-empty
npm run smoke:responsive-ui
npm run check:launch
```
