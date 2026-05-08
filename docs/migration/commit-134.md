# Commit 134 Migration — Page Inventory Warning Cleanup

## Commit

```txt
chore(content): resolve page inventory warnings
```

## 기준

Commit 133의 page search index visibility alignment를 유지한다.

## 변경

Commit 127 이후 inventory audit에 남아 있던 warning 후보를 정리했다.

### route / slug 정렬

파일 이동이나 route rewrite 없이 현재 `src/content/pages/**/index.md`의 routePath를 기준으로 frontmatter `slug`를 정렬했다.

```txt
src/content/pages/wiper/index.md
slug: wiper
routePath: /wiper

src/content/pages/lab-markdown-gallery/index.md
slug: lab-markdown-gallery
routePath: /lab-markdown-gallery

src/content/pages/works/index.md
slug: works
routePath: /works
```

장기적으로 `/tools/wiper` 또는 `/lab/markdown-gallery` 같은 계층형 route로 옮길지는 별도 route migration 커밋에서 판단한다.

### dummy / playground visibility 정리

작성용/검증용 상품 페이지는 public page에서 hidden/noindex page로 낮췄다.

```txt
src/content/pages/products/dummy-catalog/index.md
visibility: hidden
robots: noindex
featured: false

src/content/pages/products/spec-playground/index.md
visibility: hidden
robots: noindex
featured: false
```

페이지 파일은 삭제하지 않는다. 내부 검증/작성 기준으로 유지하되 public navigation, sitemap, public search 후보에서는 제외한다.

## 재생성 대상

```txt
generated/page-inventory.json
generated/page-inventory.md
generated/sitemap.xml
generated/robots.txt
src/content/generated/page-search-index.json
src/content/generated/internal-docs-search-index.json
```

## 제외

```txt
라우터 대규모 수정
파일 경로 이동
navigation 구조 재설계
sitemap/search visibility rule 재설계
portfolio editorial component 수정
inquiry/admin/Worker/D1 시스템 수정
```

## 검증

```txt
npm run content:page-inventory
npm run seo:generate
npm run search:generate
npm run smoke:content-page-inventory
npm run smoke:content-page-inventory-clean
npm run smoke:sitemap-output
npm run smoke:robots-output
npm run smoke:page-search-public-visibility
npm run smoke:page-search-index-boundary
```

## 봉인

Commit 134는 page inventory warning cleanup 커밋이다. 현재 routePath 기준으로 slug metadata를 정렬하고, dummy/playground 페이지는 hidden/noindex로 낮춘다.
