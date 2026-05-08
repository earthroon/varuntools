# Commit 10 — Markdown Page Index / Works Collection Page

## 목적

`src/content/pages/**/index.md`의 frontmatter registry를 기준으로 `/works`를 VARUNTOOLS 공식 작업 인덱스 페이지로 승격한다.

Commit 09에서 `::featured-works` / `::work-card`와 `pageRegistry.ts`가 추가되었고, Commit 10에서는 그 registry를 필터·검색·정렬 가능한 컬렉션 UI로 연결한다.

## 범위

- `WorksPage.vue`를 Markdown placeholder에서 collection page로 교체
- `useWorksCollection.ts` 추가
- `WorkCollectionFilters.vue` 추가
- `WorksCollectionGrid.vue` 추가
- `pageRegistry.ts`에 collection helper 추가
- `markdown-works.css` 추가
- `main.ts`에 CSS import 추가
- 기존 `WorkCard.vue` 재사용

## SSOT

```txt
페이지 데이터 SSOT
└─ src/content/pages/**/index.md frontmatter

Registry SSOT
└─ src/markdown/pageRegistry.ts

Works collection state SSOT
└─ src/composables/useWorksCollection.ts

Works UI SSOT
└─ src/pages/WorksPage.vue
   src/components/works/
```

## 포함 기준

`/works` 컬렉션에는 아래 조건을 만족하는 페이지가 들어간다.

```txt
포함 후보
├─ kind: work
├─ kind: tool
├─ kind: lab
├─ kind: doc
└─ 또는 featured: true

제외
├─ slug: works
└─ status: archived
```

`status: draft`는 데이터로는 남기되, 기본 필터에서는 제외한다.

## 필터/정렬 정책

```txt
query
└─ title / description / kind / status / tags 단순 포함 검색

kind
└─ entry.kind 정확 일치

tag
└─ entry.tags 포함 여부

sort
├─ order
├─ title
└─ kind
```

URL query는 `q`, `kind`, `tag`, `sort`와 동기화한다. 필터 변경 시 `router.replace()`를 사용해 히스토리 스택이 과도하게 늘어나지 않게 한다.

## 하지 않는 것

- fuzzy search 도입 안 함
- pagination 안 함
- infinite scroll 안 함
- card drag/sort 안 함
- legacy Featured Works DOM parser 이식 안 함
- Notion page link 자동 변환 안 함
- Lightbox 연결 안 함
- GitHub Pages deploy workflow 안 함

## 완료 기준

```txt
Commit 10 완료 조건
├─ useWorksCollection.ts 추가
├─ WorkCollectionFilters.vue 추가
├─ WorksCollectionGrid.vue 추가
├─ pageRegistry.ts collection helper 보강
├─ WorksPage.vue collection page로 교체
├─ markdown-works.css 추가
├─ main.ts에 markdown-works.css import
├─ /works에서 entries grid 표시
├─ query/kind/tag/sort 필터 연결
├─ URL query sync 연결
├─ resetFilters 연결
├─ archived/works self 제외
└─ legacy Featured Works DOM parser는 여전히 보류
```
