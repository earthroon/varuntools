# Commit 15 — Page Meta / SEO / OG Image

## 목적

Markdown frontmatter를 기준으로 각 페이지의 browser title, description, Open Graph, Twitter Card, canonical URL, robots meta를 runtime에서 갱신한다.

## 범위

- `src/metadata/siteConfig.ts` 추가
- `src/metadata/pageMeta.ts` 추가
- `src/metadata/staticPageMeta.ts` 추가
- `src/composables/usePageMeta.ts` 추가
- `MarkdownDocumentView.vue`에 page meta 연결
- `WorksPage.vue`에 static collection meta 연결
- `NotFoundPage.vue`에 404 meta 연결
- `index.html` 기본 meta 보강
- `public/og-default.svg` 추가

## Frontmatter SEO 필드

```txt
seoTitle
seoDescription
ogTitle
ogDescription
ogImage
canonical
robots
```

## 우선순위

```txt
title: seoTitle -> ogTitle -> title -> defaultTitle
description: seoDescription -> ogDescription -> summary -> description -> defaultDescription
ogImage: ogImage -> cardCover -> cover -> defaultOgImage
robots: frontmatter.robots -> hidden/draft noindex -> index,follow
```

## SPA meta 한계

이 커밋은 runtime meta update다. GitHub Pages + Vue SPA에서 모든 SNS 봇의 route별 OG 미리보기를 완전히 보장하려면 후속 prerender/SSG 커밋이 필요하다.

## 하지 않는 것

- prerender / SSG 안 함
- sitemap.xml 생성 안 함
- robots.txt 고도화 안 함
- JSON-LD 구조화 데이터 안 함
- OG 이미지 자동 생성 안 함

## 완료 기준

- `npm run build` 통과
- `npm run build:pages` 통과
- `document.title` runtime 갱신 구조 존재
- Open Graph/Twitter/canonical/robots 갱신 구조 존재
- default OG image 파일 존재
