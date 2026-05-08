# VARUNTOOLS Markdown Content Rules

## Page folder

```txt
src/content/pages/<page-folder>/
├─ index.md
├─ images/
└─ media/
```

The page folder is the asset resolution base. A page may expose a different URL slug through frontmatter, but local media still resolves from the physical content folder.

## Frontmatter

```md
---
title: "Page title"
slug: "tools/wiper"
layout: "tool"
theme: "showroom"
description: "Short page description"
cover: "./images/cover.webp"
---
```

## Images

Use normal Markdown image syntax.

```md
![alt text](./images/file.webp)
```

Recommended image formats:

```txt
webp
avif
png
jpg/jpeg
svg
```

## GIF

GIF is allowed through normal Markdown image syntax.

```md
![short loop](./images/preview.gif)
```

Use GIF only for small loops or preview thumbnails. For heavier motion, prefer WebM.

## WebM / MP4

Use the `::video` directive.

```md
::video
src: ./media/demo.webm
fallback: ./media/demo.mp4
poster: ./images/demo-poster.webp
caption: 기능 작동 예시
autoplay: true
loop: true
muted: true
playsinline: true
controls: false
::
```

Policy:

```txt
src      -> preferred WebM source
fallback -> MP4 fallback source
poster   -> optional still image, stored in images/
```

If `src` and `fallback` are both missing, the renderer shows a missing media shell instead of silently hiding the block.

## Before / After

Use the explicit directive for new Markdown content.

```md
::before-after
before: ./images/before.webp
after: ./images/after.webp
caption: 보정 전후 비교
initial: 50
::
```

Both `before` and `after` are required. If either side is missing, the slider does not render and a missing media shell is shown.

## Image card

```md
::image-card
src: ./images/work-01.webp
alt: 작업물 미리보기
caption: 쇼룸 카드용 대표 이미지
tag: 필수
href: /works/work-01
::
```

If the image is missing, the card shell stays visible and the image area shows a missing thumbnail.

## Asset path rules

```txt
./images/... -> resolves from current page folder
./media/...  -> resolves from current page folder
/...         -> public path, kept as-is
https://...  -> external URL, kept as-is
data:...     -> data URL, kept as-is
```

Missing local assets are not auto-corrected. In development, they are logged through `[VARUNTOOLS][media-asset]`.

## File names

Use lowercase kebab-case.

```txt
work-01-loop.webm
cover.webp
wiper-demo.mp4
demo-poster.webp
```

Avoid Korean names, spaces, and ad-hoc final file names in committed content assets.

---

## Layout spacing rule — Commit 07

새 콘텐츠에서는 기존 Super/Notion용 `[문단끝]` 토큰 대신 Markdown-native layout directive를 사용한다.

### Section gap

```md
::section-gap
size: md
::
```

Allowed size:

```txt
sm / md / lg / xl
```

### Explicit gap height

```md
::section-gap
height: 96
::
```

Height is clamped between 12px and 240px.

### Section break

```md
::section-break
label: Works
tone: accent
::
```

Allowed tone:

```txt
quiet / accent / ink
```

`section-break label` is decorative. Semantic section names should still be written as Markdown headings.

Legacy `[문단끝]` compatibility is reserved for a later adapter commit.

---

## Legacy Section Gap Token

기존 Super/Notion 문서 호환을 위해 `[문단끝]` 토큰을 허용한다.

권장 신규 문법:

```md
::section-gap
size: md
::
```

legacy 호환 문법:

```md
[문단끝]
```

prefix 형태도 지원한다.

```md
[문단끝]## 다음 섹션
```

단, fenced code block 내부와 문장 중간의 `[문단끝]`은 변환하지 않는다.

```txt
변환 대상
├─ [문단끝] 단독 줄
└─ [문단끝]으로 시작하는 prefix 줄

변환 제외
├─ 문장 중간 [문단끝]
└─ fenced code block 내부 [문단끝]
```


---

## Work Card Frontmatter

작업 카드의 SSOT는 각 Markdown page의 frontmatter다.

```md
---
title: "Before / After Wiper"
slug: "tools/wiper"
kind: "tool"
status: "active"
featured: true
order: 3
cover: "./images/cover.svg"
cardTitle: "Before / After Wiper"
cardDescription: "이미지 비교를 위한 전후 슬라이더 도구"
cardCover: "./images/cover.svg"
tags:
  - tool
  - image
  - markdown
---
```

필드 규칙:

```txt
featured: true이면 ::featured-works 대상
status: archived이면 featured 목록에서 제외
kind는 page/work/tool/lab/doc 중 하나 권장
order는 작은 숫자부터 먼저 표시
cardTitle 없으면 title 사용
cardDescription 없으면 summary → description 순서로 사용
cardCover 없으면 cover 사용
```

기존 Notion 링크를 DOM에서 긁어 카드화하는 방식은 신규 SSOT가 아니다.

---

## Commit 10 — Works Collection Frontmatter Rule

`/works` 컬렉션에 노출할 페이지는 각 Markdown frontmatter를 기준으로 등록된다.

권장 필드:

```yaml
title: "Before / After Wiper"
slug: "tools/wiper"
kind: "tool"
status: "active"
summary: "이미지 전후를 비교하는 쇼룸형 와이퍼 컴포넌트"
cardTitle: "Before / After Wiper"
cardDescription: "이미지 비교를 위한 전후 슬라이더 도구"
cardCover: "./images/cover.svg"
tags:
  - tool
  - image
  - markdown
order: 3
```

노출 기준:

```txt
- kind: work / tool / lab / doc 는 컬렉션 후보가 된다.
- kind: page 는 featured: true 인 경우에만 컬렉션 후보가 된다.
- status: archived 는 기본 컬렉션에서 제외된다.
- slug: works 는 자기 자신이므로 컬렉션에서 제외된다.
```

검색 대상:

```txt
- title
- description
- kind
- status
- tags
```

## Related metadata rule

Detail pages may define related metadata in frontmatter.

```yaml
date: "2026-04-26"
updated: "2026-04-26"
series: "markdown-tools"
related:
  - tools/wiper
visibility: "public"
```

- `date`: recommended date format is `YYYY-MM-DD`.
- `updated`: recommended date format is `YYYY-MM-DD`.
- `series`: shared work sequence name.
- `related`: explicit related slug list.
- `visibility`: `public` or `hidden`.
- `status: archived` excludes the page from lists and related surfaces.
- `related` should only contain existing slugs.

## Commit 12 — Shared Document Rendering Rule

Markdown-backed pages should render through `MarkdownDocumentView.vue`.

```txt
MarkdownPage.vue
HomePage.vue
WiperPage.vue
└─ thin wrappers around MarkdownDocumentView.vue
```

`WorksPage.vue` is excluded from this rule because it is a collection page driven by the page registry and filter state.

Slug lookup is exact. Similar slugs are not silently corrected.


## Slug / Route Rule

Markdown 문서의 URL 경로는 `frontmatter.slug`를 기준으로 한다.

```txt
권장
slug: "tools/wiper"

비권장
slug: "/tools/wiper/"
```

### 규칙

```txt
- 앞뒤 slash 금지
- 중복 slash 금지
- slug 중복 금지
- reserved route slug 금지
  - works
  - 404
- contentDir와 slug는 달라도 되지만, slug가 우선한다.
- 유사 slug 자동 보정은 하지 않는다.
```

### Reserved routes

```txt
/      : site home
/works : works collection app page
/404   : not found page
```

`works`와 `404`는 앱이 직접 소유하는 경로이므로 일반 Markdown 문서 slug로 사용하지 않는다.


## SEO frontmatter

페이지별 SEO/공유 표면은 Markdown frontmatter에 둔다.

```yaml
seoTitle: "Before / After Wiper"
seoDescription: "이미지 전후를 비교하는 VARUNTOOLS 와이퍼 도구입니다."
ogTitle: "Before / After Wiper"
ogDescription: "이미지 전후를 비교하는 VARUNTOOLS 와이퍼 도구입니다."
ogImage: "./images/cover.svg"
canonical: "tools/wiper"
robots: "index,follow"
```

우선순위는 다음과 같다.

```txt
title: seoTitle -> ogTitle -> title -> defaultTitle
description: seoDescription -> ogDescription -> summary -> description -> defaultDescription
ogImage: ogImage -> cardCover -> cover -> defaultOgImage
robots: frontmatter.robots -> hidden/draft noindex -> index,follow
```

Commit 15는 runtime meta 갱신만 담당한다. route별 정적 OG 보장은 후속 prerender/SSG 커밋에서 다룬다.

---

## Commit 16 — Validation Gate

### 필수 frontmatter

```yaml
title: "Page Title"
slug: "path/to/page"
```

### Slug 규칙

```txt
- 앞뒤 slash 금지
- 중복 slash 금지
- 공백 금지
- 중복 slug 금지
- reserved route slug 금지: works, 404
- 유사 slug 자동 보정 없음
```

### Related 규칙

```txt
- related는 string[]이어야 한다.
- 모든 related slug는 실제 존재해야 한다.
- 자기 자신을 related에 넣으면 warning이다.
- hidden / archived page를 related에 넣으면 warning이다.
```

### Asset 규칙

다음 필드는 실제 파일 존재를 검사한다.

```txt
cover
cardCover
cardIcon
ogImage
```

허용 경로:

```txt
./images/...
./media/...
/public-path...
https://...
http://...
data:...
```

외부 URL은 네트워크 검사하지 않는다.

### Enum 규칙

```txt
layout: default / wide / tool
theme: default / showroom
kind: page / work / tool / lab / doc
status: draft / active / archived
visibility: public / hidden
robots: index,follow / noindex,nofollow / noindex,follow
```

### Date 규칙

```txt
date: YYYY-MM-DD
updated: YYYY-MM-DD
```

실제로 존재하는 날짜만 통과한다.

### 실행

```bash
npm run validate:content
```

`npm run build`와 `npm run build:pages`는 validation을 먼저 실행한다.

---

## Markdown Image Lightbox

Commit 17부터 기본 Markdown 이미지는 Lightbox 대상이다.

```md
![작업물 미리보기](./images/work.svg "쇼룸 대표 이미지")
```

규칙:

```txt
caption 우선순위
├─ image title
├─ alt text
└─ 빈 문자열
```

Lightbox 대상:

```txt
├─ Markdown 기본 이미지
└─ img[data-vt-lightbox="1"]
```

Lightbox 제외:

```txt
├─ WorkCard 내부 이미지
├─ ImageCard 내부 이미지
├─ BeforeAfterWiper before/after 이미지
├─ VarunVideo poster
└─ UI 아이콘
```

이미지 경로는 contentDir 기준으로 Vite asset URL로 resolve된다. 누락된 asset은 validation gate에서 먼저 실패해야 한다.
