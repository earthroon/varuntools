# VARUNTOOLS Extended Markdown v0

## Status

Commit 02 implements directive parsing and custom element placeholder output.

Vue component mounting is reserved for Commit 03.

## Frontmatter

```md
---
title: "VARUNTOOLS"
slug: "home"
layout: "default"
theme: "showroom"
description: "도구와 작업의 쇼룸"
cover: "./images/cover.webp"
tags:
  - portfolio
  - tools
order: 1
---
```

## Basic image

```md
![작업물 미리보기](./images/work-01.webp)
```

## GIF

```md
![짧은 루프 미리보기](./images/preview.gif)
```

GIF is treated as a normal Markdown image.

## Video

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

Commit 02 output:

```html
<varun-video data-src="./media/demo.webm" data-fallback="./media/demo.mp4" data-poster="./images/demo-poster.webp" data-caption="기능 작동 예시" data-autoplay="true" data-loop="true" data-muted="true" data-playsinline="true" data-controls="false"></varun-video>
```

## Before / After

```md
::before-after
before: ./images/before.webp
after: ./images/after.webp
caption: 보정 전후 비교
initial: 50
::
```

Commit 02 output:

```html
<before-after-wiper data-before="./images/before.webp" data-after="./images/after.webp" data-caption="보정 전후 비교" data-initial="50"></before-after-wiper>
```

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

Commit 02 output:

```html
<image-card data-src="./images/work-01.webp" data-alt="작업물 미리보기" data-caption="쇼룸 카드용 대표 이미지" data-tag="필수" data-href="/works/work-01"></image-card>
```

## Callouts

```md
::note
이건 일반 노트입니다.
::

::warning
이건 주의 문구입니다.
::

::tip
이건 팁입니다.
::
```

Commit 02 output:

```html
<callout-box data-type="warning">이건 주의 문구입니다.</callout-box>
```

## Invalid directive policy

Required values are not auto-filled.

Example:

```md
::before-after
before: ./images/before.webp
::
```

outputs an invalid directive placeholder instead of guessing `after`.

---

## Commit 03부터의 렌더링 상태

```txt
::video
→ <varun-video>
→ VarunVideo.vue로 mount

::before-after
→ <before-after-wiper>
→ BeforeAfterWiper.vue로 mount

::image-card
→ <image-card>
→ ImageCard.vue로 mount

::note / ::warning / ::tip
→ <callout-box>
→ CalloutBox.vue로 mount
```

Markdown raw HTML은 계속 비허용한다.

---

## Commit 04 theme stabilization note

Commit 04부터 directive component는 VARUNTOOLS Showroom theme token을 기준으로 표면 질감을 공유한다.

```txt
Shared theme tokens:
--vt-ink
--vt-ink-soft
--vt-surface
--vt-surface-strong
--vt-hair
--vt-hair-strong
--vt-shadow-1
--vt-radius-md
```

`::video`, `::before-after`, `::image-card`, `::note`, `::warning`, `::tip`의 parser grammar는 Commit 04에서 변경하지 않는다.

Commit 04는 parser 변경 커밋이 아니라 component surface stabilization 커밋이다.

---

## Commit 06 — Heading / TOC Metadata

Commit 06부터 Markdown 렌더링 시 `h1`, `h2`, `h3`에 자동 id를 부여하고, 페이지별 `headings` metadata를 생성한다.

```txt
# Works -> works
## Featured Works -> featured-works
### Preview Loop -> preview-loop
```

중복 heading은 `-2`, `-3` 접미사로 구분한다.

기존 Super/Notion `wiki-nav`는 이 커밋에서 이식하지 않는다. 새 Vue-native TOC는 `vt-toc` 네임스페이스를 사용한다.

---

## Commit 07 — Layout Directives

Commit 07부터 문서의 시각적 호흡과 섹션 분리는 Markdown-native layout directive로 관리한다.

기존 Super/Notion Head Pack의 `[문단끝]` DOM scanner는 이 커밋에서 이식하지 않는다. 신규 콘텐츠는 `::section-gap` / `::section-break`를 우선 사용한다.

### Section Gap

```md
::section-gap
size: lg
::
```

출력:

```html
<section-gap data-size="lg"></section-gap>
```

지원 size:

```txt
sm / md / lg / xl
```

### Section Gap with explicit height

```md
::section-gap
height: 96
::
```

`height`는 12~240px 범위로 clamp된다.

### Section Break

```md
::section-break
label: Works
tone: accent
::
```

출력:

```html
<section-break data-label="Works" data-tone="accent"></section-break>
```

지원 tone:

```txt
quiet / accent / ink
```

### Accessibility rule

`section-gap`과 `section-break`는 시각적 구획 장치이므로 기본적으로 `aria-hidden="true"`로 렌더링한다.

의미 있는 제목은 `section-break label`이 아니라 Markdown heading(`#`, `##`, `###`)으로 작성한다.

---

## Legacy Compatibility

### `[문단끝]`

`[문단끝]`은 기존 Super/Notion 페이지 호환을 위한 legacy token이다.

렌더링 전 Markdown source transform 단계에서 아래 directive로 변환된다.

```md
::section-gap
size: md
::
```

신규 문서에서는 `::section-gap`을 우선 사용한다. `[문단끝]`은 과거 콘텐츠 호환을 위한 입력으로만 유지한다.


---

## Card Directives

### Featured Works

```md
::featured-works
title: Featured Works
limit: 6
::
```

`featured: true`이며 `status`가 `archived`가 아닌 Markdown page를 카드 그리드로 렌더링한다.

### Featured Works with Kind Filter

```md
::featured-works
title: Tools
kind: tool
limit: 4
::
```

### Work Card by Slug

```md
::work-card
slug: tools/wiper
::
```

### Manual Work Card

```md
::work-card
title: Manual Card
description: 직접 입력한 카드
cover: ./images/manual-cover.svg
href: /manual
tag: lab
::
```

`::work-card`는 `slug` 또는 `title` 중 하나가 있어야 한다.

---

## Commit 10 — Works Collection

`/works`는 Commit 10부터 Markdown page registry를 기반으로 한 공식 작업 인덱스 페이지로 동작한다.

기존 `::featured-works`와 `::work-card` directive는 계속 유지된다.

```md
::featured-works
title: Featured Works
limit: 6
::
```

`/works` 컬렉션은 별도 directive가 아니라 `LoadedMarkdownPage[]` registry에서 직접 생성된다.

## Work Detail Metadata

Commit 11 uses frontmatter metadata to render related work surfaces.

```yaml
series: "markdown-tools"
related:
  - home
visibility: "public"
```

Explicit `related` entries are preferred, then the registry falls back to series, tags, kind, and order proximity.


## SEO / Page Meta

Extended Markdown pages may include SEO fields in frontmatter.

```yaml
seoTitle: "Page title"
seoDescription: "Page description"
ogImage: "./images/cover.svg"
robots: "index,follow"
```

These fields are consumed by the runtime page meta layer introduced in Commit 15.

---

## Markdown Image Lightbox

기본 Markdown 이미지 문법은 Commit 17부터 Lightbox에 연결된다.

```md
![대표 이미지](./images/cover.svg)
```

렌더링 단계에서 아래 속성이 추가된다.

```html
<img
  data-vt-lightbox="1"
  data-vt-caption="대표 이미지"
/>
```

이미지 title이 있으면 title이 caption으로 우선 사용된다.

```md
![작업물 미리보기](./images/work.svg "쇼룸 대표 이미지")
```

이 기능은 Markdown 기본 이미지에만 적용되며, WorkCard / ImageCard / BeforeAfterWiper 내부 이미지는 제외된다.
