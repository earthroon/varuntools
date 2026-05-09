# VarunTools Markdown Dictionary

## 0. SSOT

```txt
Manual Works page SSOT = src/content/pages/works/<slug>/index.md
CSV-authored page SSOT = src/content/pages/<category>/<slug>/page.csv
Generated Markdown output = index.md
Works collection visibility SSOT = frontmatter.work
Dictionary SSOT = docs/authoring/varuntools-markdown-dictionary.md
```

Use this document as the first stop when authoring a VarunTools page by hand. It is not a generic Markdown guide. It records the Markdown, frontmatter, media, and VarunTools directive syntax that the site understands or plans to support.

## 1. Authoring modes

### Manual Markdown page

Use this for narrative Works pages, case studies, experiments, and pages where prose matters more than repeated tabular data.

```txt
Edit: src/content/pages/works/<slug>/index.md
Do not run: npm run csv:page for this page
Run: npm run validate:content
Run: npm run build
```

### CSV-authored page

Use this for repeated rows, product catalogs, generated galleries, bulk media, and pages where table-like data is the source of truth.

```txt
Edit: src/content/pages/<category>/<slug>/page.csv
Generate: npm run csv:page -- src/content/pages/<category>/<slug>/page.csv
Do not hand-edit generated index.md
```

## 2. Works page minimum frontmatter

A Works card appears in `/works` only when the page is public and its `work.status` is not draft/private.

```md
---
title: "VARUN LOOP"
description: "동영상을 짧은 루프 클립으로 변환하는 로컬 데스크탑 툴입니다."
slug: works/varun-loop
kind: work
status: published
visibility: public
thumbnail: ./images/thumb.gif
cover: ./videos/out.webm
work:
  type: case-study
  status: published
  featured: false
  weight: 50
  year: 2026
  role:
    - Design Engineer
  stack:
    - Electron
    - JavaScript
    - WebGPU
  tools:
    - Electron
    - FFmpeg
    - Rust WASM
  tags:
    - video
    - loop
    - desktop-app
  summary: "프리미어 없이 루프 클립을 생성하는 로컬 데스크탑 툴입니다."
---
```

### Required for Works visibility

```yaml
slug: works/<slug>
kind: work
status: published
visibility: public
work:
  status: published
```

### Common hide states

```yaml
work:
  status: draft      # Hidden from Works by default
```

```yaml
work:
  status: private    # Always hidden
```

```yaml
visibility: hidden   # Hidden even if work.status is published
```

## 3. Frontmatter fields

| Field | Required | Purpose |
| --- | --- | --- |
| `title` | yes | Page title and card title fallback |
| `description` | yes | SEO description and page summary fallback |
| `slug` | yes | Route path, usually `works/<slug>` |
| `kind` | yes for Works | Use `work` for Works entries |
| `status` | recommended | Page status, usually `published` |
| `visibility` | recommended | Use `public` for visible pages |
| `thumbnail` | recommended | Card/list thumbnail. Prefer image/gif/webp/png |
| `cover` | optional | Hero media. Can be image or video path |
| `work` | yes for Works cards | Works collection metadata object |

## 4. Work metadata fields

| Field | Required | Values / Type | Purpose |
| --- | --- | --- | --- |
| `work.type` | recommended | `case-study`, `tool`, `visual`, `service`, `experiment`, `store`, `system` | Filter badge/type |
| `work.status` | yes | `draft`, `published`, `archived`, `private` | Works list visibility |
| `work.featured` | optional | boolean | Featured sorting/surfaces |
| `work.weight` | optional | number | Sort priority |
| `work.year` | recommended | number | Year filter and card meta |
| `work.period` | optional | string | Display period such as `2025-2026` |
| `work.client` | optional | string | Client/internal label |
| `work.role` | recommended | string array | Role chips |
| `work.stack` | recommended | string array | Stack chips |
| `work.tools` | optional | string array | Tool chips |
| `work.tags` | recommended | string array | Filters/search tags |
| `work.summary` | recommended | string | Card summary |
| `work.links.demo` | optional | URL/string | Demo link |
| `work.links.repo` | optional | URL/string | Repository link |
| `work.links.caseStudy` | optional | URL/string | Case study link |

## 5. Basic Markdown

### Heading

```md
## 작업 개요
### 문제
```

### Paragraph

```md
문장은 그냥 씁니다. CSV처럼 쉼표를 피할 필요 없습니다.
```

### Emphasis

```md
**중요한 말**
*기울임*
`inline code`
```

### List

```md
- Electron
- FFmpeg
- Rust WASM
```

### Link

```md
[GitHub](https://github.com/earthroon/varuntools)
```

### Code block

````md
```ts
export const answer = 'structure first'
```
````

## 6. Media paths

Page-local relative paths resolve from the page folder.

```txt
./images/cover.webp
./images/thumb.gif
./videos/demo.webm
```

Recommended layout:

```txt
src/content/pages/works/varun-loop/
  index.md
  images/
    cover.webp
    thumb.gif
    before.webp
    after.webp
  videos/
    demo.webm
```

### Plain image

```md
![VARUN LOOP output](./images/thumb.gif "VARUN LOOP 출력 예시")
```

### Caption badge prefixes supported today

Image title/caption prefixes can carry small meaning badges.

```md
![Cover](./images/cover.webp "[필수] 대표 이미지 설명")
![Step](./images/step.webp "[선택] 과정 이미지")
![Memo](./images/memo.webp "[기타] 참고 이미지")
```

Supported prefixes:

```txt
[필수]
[선택]
[기타]
```

These are the current supported caption badge prefixes. Do not add a separate `::badge` directive for the same purpose unless the caption tag SSOT is deliberately migrated.

## 7. Current media directives

### `before-after`

Use this for visual comparison.

```md
::before-after
before: ./images/before.webp
after: ./images/after.webp
caption: 보정 전후 비교
initial: 50
::
```

Fields:

| Field | Required | Purpose |
| --- | --- | --- |
| `before` | yes | Before image path |
| `after` | yes | After image path |
| `caption` | optional | Visible caption |
| `initial` | optional | Initial split position, usually `50` |

### `video-player`

```md
::video-player
src: ./videos/demo.webm
poster: ./images/demo-poster.webp
title: VARUN LOOP 데모
caption: 로컬에서 짧은 루프 클립을 생성하는 과정입니다.
controls: true
muted: true
autoplay: false
::
```

Fields:

| Field | Required | Purpose |
| --- | --- | --- |
| `src` | yes | Video source |
| `poster` | recommended | Poster image |
| `title` | optional | Video title |
| `caption` | optional | Caption text |
| `controls` | optional | Show controls |
| `muted` | optional | Required if autoplay is true |
| `autoplay` | optional | Autoplay flag |

## 8. Current callout / emphasis directives

### `markdown-box`

Use this for notes, decisions, SSOT blocks, warnings, and short explanations.

```md
::markdown-box
type: ssot
title: 기준
::
Works 목록 노출 기준은 `frontmatter.work.status`입니다.
::
```

Common `type` values:

```txt
note
tip
warning
danger
quote
decision
ssot
```

### `note`, `tip`, `warning`

These shorthand callouts are supported in the legacy/extended Markdown surface.

```md
::note
title: 참고
::
보조 설명입니다.
::
```

```md
::tip
title: 팁
::
작성자가 바로 따라 할 수 있는 조언입니다.
::
```

```md
::warning
title: 주의
::
이 상태로 배포하면 Works 목록에 뜨지 않을 수 있습니다.
::
```

## 9. Current portfolio directives

### `portfolio-hero`

```md
::portfolio-hero
title: VARUN LOOP
src: ./videos/out.webm
alt: VARUN LOOP demo
thumb: ./images/thumb.gif
layout: split
role-json: ["Design Engineer"]
stack-json: ["Electron","JavaScript","WebGPU","WGSL"]
year: 2026
featured: false
::
동영상을 짧은 루프 클립으로 변환하는 로컬 데스크탑 툴입니다.
::
```

### `work-summary`

```md
::work-summary
title: 작업 개요
role-json: ["Design Engineer"]
stack-json: ["Electron","JavaScript","WebGPU"]
period: 2026
client: internal
::
프리미어를 켜지 않고도 짧은 루프 클립을 생성할 수 있도록 만든 로컬 앱입니다.
::
```

### `role-stack`

```md
::role-stack
title: 역할과 스택
role-json: ["Design Engineer"]
stack-json: ["Electron","JavaScript","WebGPU","WGSL"]
tools-json: ["FFmpeg","Rust WASM"]
responsibility-json: ["UX Structure","Encoding Pipeline","Local-first App"]
::
::
```

### `case-section`

Use for problem/decision/solution/process/result.

```md
::case-section
type: problem
title: 문제
axis: workflow
::
원본 영상을 짧은 루프 클립으로 바꾸기 위해 매번 범용 편집툴을 켜는 과정이 병목이었습니다.
::
```

```md
::case-section
type: decision
title: 판단
kind: ssot
ssot: manual-markdown
tradeoff: simple-authoring
::
웹 기반으로 만들면 원본 소스가 외부로 노출될 수 있다는 불안이 생기므로, 로컬 폐쇄형 앱으로 설계했습니다.
::
```

Supported `type` examples:

```txt
problem
decision
solution
process
result
```

### `metric-card`

```md
::metric-card
title: 대표 지표
value: 1
unit: tool
label: 로컬 루프 생성 툴
::
정량 지표는 추후 갱신합니다.
::
```

### `tool-stack`

```md
::tool-stack
title: Tool Stack
stack-json: ["Electron","JavaScript","WebGPU","WGSL","CSS","HTML"]
tools-json: ["FFmpeg","Rust WASM"]
runtime-json: ["Desktop app"]
::
::
```

### `quote-block`

```md
::quote-block
by: VARUN
tone: calm
size: medium
::
간단한 일을 하기 위해 거대한 프로그램을 켜는 건, 창문을 열려고 굴착기를 부르는 일에 가깝다.
::
```

### `case-gallery`

```md
::case-gallery
title: Case Gallery
caption: 대표 화면과 출력 예시를 묶습니다.
variant: framed
columns: 2
::
- ./images/output-01.webp | 루프 변환 결과 | ./images/output-01-thumb.webp | alt=루프 변환 결과; label=01
- ./images/pipeline.webp | 인코딩 파이프라인 | ./images/pipeline-thumb.webp | alt=인코딩 파이프라인; label=02
::
```

### `related-works`

```md
::related-works
title: 관련 작업
items-json: ["dreamcolor-filter", "aro-sae-gim"]
layout: grid
::
::
```

Use internal work slugs only. Put external links in `work.links.demo`, `work.links.repo`, or page body links.

## 10. Current card / index directives

### `work-card`

```md
::work-card
slug: varun-loop
::
```

### `pagecard-grid`

```md
::pagecard-grid
items: /tools/wiper,/lab/markdown-gallery
columns: auto
::
```

### `featured-works`

```md
::featured-works
limit: 3
::
```

## 11. Caption tooltip and caption tag contract

This section records the already implemented authoring helper pattern. Do not create a second tooltip or badge system for the same job.

```txt
Caption tooltip SSOT = src/components/markdown/CaptionedImage.vue
Caption tag SSOT = src/markdown/captionTag.ts
```

### Caption tooltip

Use `captioned-image` when an image needs a hidden explanatory note. When `caption` is present, the image component renders a small `?` help button and a `role="tooltip"` caption body.

```md
::captioned-image
src: ./images/example.webp
alt: 예시 이미지
caption: 이 문장은 이미지 위의 ? 아이콘 툴팁으로 표시됩니다.
::
```

Use this for:

```txt
이미지 보충 설명
필수 확인 사항
작업 과정 설명
사용 조건
저작/출처 메모
```

### Caption tag / badge

The only supported caption tags are:

```txt
필수
선택
기타
```

Use `tag` on `captioned-image` when you want the visible chip/badge.

```md
::captioned-image
src: ./images/thumbnail.webp
alt: 대표 썸네일
caption: Works 카드에 표시되는 대표 이미지입니다.
tag: 필수
::
```

```md
::captioned-image
src: ./images/detail.webp
alt: 상세 화면
caption: 본문 이해를 돕는 보조 화면입니다.
tag: 선택
::
```

```md
::captioned-image
src: ./images/reference.webp
alt: 참고 자료
caption: 부가 참고 자료입니다.
tag: 기타
::
```

### Plain image caption prefix

Plain Markdown image captions can also carry the same tag prefix.

```md
![대표 이미지](./images/cover.webp "[필수] Works 카드에 표시되는 대표 이미지입니다.")
![보조 화면](./images/detail.webp "[선택] 상세 설명용 보조 이미지입니다.")
![참고 자료](./images/reference.webp "[기타] 참고용 이미지입니다.")
```

The prefix is parsed as a caption tag, and the remaining text becomes the caption.

### What not to add in Commit B

```txt
Do not add ::tooltip.
Do not add ::badge.
Do not add a second .vt-tooltip system.
Do not add a second .vt-badge system.
```

Those names are held back because the site already has a caption tooltip and tag/chip contract. Adding a duplicate would split the authoring vocabulary.

### Supported `field-spec`

`field-spec` is the supported dictionary card for explaining a field contract. It does not create a new tooltip or badge system. Its `tag` value reuses the existing caption tag SSOT: `필수`, `선택`, `기타`.

```md
::field-spec
name: work.status
type: draft | published | archived | private
required: true
tag: 필수
default: published
ssot: frontmatter.work.status
usedBy: Works collection visibility
::
Works 목록 표시 여부를 결정합니다. 목록에 보이려면 `published`여야 합니다.
::
```

Rules:

```txt
name is required.
tag accepts only 필수, 선택, 기타.
If tag is omitted, required=true maps to 필수 and required=false maps to 선택.
::tooltip and ::badge remain unsupported production syntax because captioned-image already owns tooltip and tag behavior.
```

## 12. Editorial layout directives

These directives are already implemented. Do not create a second column system. Use `editorial-title` and `editorial-columns` when a Works page needs a more designed, magazine-like layout.

```txt
Editorial title SSOT = src/markdown/directives/portfolioDirective.ts
Editorial columns SSOT = src/markdown/directives/portfolioDirective.ts
Directive registration SSOT = src/markdown/directiveTypes.ts
```

### `editorial-title`

Use `editorial-title` when a section needs a kicker, title, subtitle, and controlled heading level.

```md
::editorial-title
title: 구조와 판단
kicker: VARUN LOOP
subtitle: 문제와 해결을 나란히 비교합니다.
level: middle
as: h2
align: left
::
```

Options:

```txt
title     required. Section title.
kicker    optional. Small label above the title.
subtitle  optional. Supporting sentence below the title.
level     major | middle | minor. Visual scale.
as        h1 | h2 | h3 | h4. Semantic heading tag.
align     left | center.
```

### `editorial-columns`

Use `editorial-columns` when text should be split into two or three vertical columns. Separate each column with a line that contains only `---`.

```md
::editorial-columns
cols: 2
gap: md
collapse: mobile
balance: true
::
### 문제

프리미어를 매번 켜야 하는 과정이 병목이었습니다.

---

### 해결

로컬 앱 내부에서 루프 변환 흐름을 닫았습니다.
::
```

Three-column example:

```md
::editorial-columns
cols: 3
gap: lg
collapse: tablet
::
### 문제

반복 인코딩 과정이 무겁고 느렸습니다.

---

### 판단

외부 통신 없는 로컬 앱으로 가는 것이 맞다고 판단했습니다.

---

### 해결

Electron, FFmpeg, Rust WASM 기반으로 루프 변환 흐름을 구성했습니다.
::
```

Options:

```txt
cols / columns  2 | 3. Defaults to 2.
gap             sm | md | lg. Defaults to md.
collapse        mobile | tablet | never. Defaults to mobile.
balance         true | false. Keeps column rhythm visually balanced when supported by the renderer.
```

Rules:

```txt
Columns are separated by a line containing only ---.
cols: 2 accepts up to 2 column chunks.
cols: 3 accepts up to 3 column chunks.
At least 2 column chunks are required.
Long prose stays inside each column and can use normal Markdown.
Do not use this for simple paragraphs that do not need side-by-side comparison.
```

Recommended Works usage:

```md
::editorial-title
title: 문제와 판단
kicker: VARUN LOOP
subtitle: 왜 로컬 데스크탑 앱이어야 했는지 정리합니다.
level: middle
as: h2
align: left
::

::editorial-columns
cols: 2
gap: md
collapse: mobile
::
### 문제

mov 원본 영상을 짧은 루프 클립으로 만들기 위해 매번 프리미어를 켜는 과정이 병목이었습니다.

---

### 판단

웹 기반 툴은 원본 소스 노출 불안을 만들 수 있으므로, 외부와 통신하지 않는 로컬 앱으로 닫는 편이 더 안전했습니다.
::
```

## 13. Copy-paste recipes

### Minimum visible Works page

```md
---
title: "New Work"
description: "짧은 설명입니다."
slug: works/new-work
kind: work
status: published
visibility: public
thumbnail: ./images/thumb.webp
cover: ./images/cover.webp
work:
  type: case-study
  status: published
  featured: false
  weight: 50
  year: 2026
  role:
    - Design Engineer
  stack:
    - Vue
    - TypeScript
  tags:
    - portfolio
  summary: "Works 카드에 표시될 짧은 설명입니다."
---

## 작업 개요

본문을 씁니다.
```

### Works page with before/after

```md
::before-after
before: ./images/before.webp
after: ./images/after.webp
caption: 적용 전후 비교
initial: 50
::
```

### Works page with video

```md
::video-player
src: ./videos/demo.webm
poster: ./images/demo-poster.webp
title: 데모 영상
caption: 작동 흐름입니다.
controls: true
muted: true
autoplay: false
::
```

### Field spec card

```md
::field-spec
name: thumbnail
type: ./images/*.webp | ./images/*.gif | ./images/*.png
required: false
tag: 선택
default: ./images/thumb.webp
ssot: frontmatter.thumbnail
usedBy: Works card image
::
Works 카드에서 대표 이미지로 사용됩니다. 영상 파일보다 이미지 썸네일이 안정적입니다.
::
```

### Caption tooltip and tags today

```md
::captioned-image
src: ./images/cover.webp
alt: 대표 이미지
caption: Works 카드에 쓰이는 대표 이미지입니다.
tag: 필수
::

![과정 이미지](./images/process.webp "[선택] 제작 과정 참고 이미지")
![참고 이미지](./images/reference.webp "[기타] 부가 참고 이미지")
```

Use the existing caption tooltip and caption tag system. Do not use `::tooltip` or `::badge` as production syntax.

## 15. Link Contract

VarunTools is deployed as a GitHub Pages project site, so internal links must stay inside the app router instead of jumping to the domain root.

Canonical public base:

```txt
https://earthroon.github.io/varuntools/
```

### Internal page links

Use extensionless route links for VarunTools pages.

```md
[VARUN LOOP](/works/varun-loop)
[Works 목록](/works)
[상품 실험장](/products/spec-playground)
```

These are app routes. They should be handled by Vue Router, not by a full browser reload.

### Bare route links

The link handler also accepts route-like links without the first slash.

```md
[VARUN LOOP](works/varun-loop)
```

When possible, prefer the leading-slash form because it is easier to read.

```md
[VARUN LOOP](/works/varun-loop)
```

### External links

External destinations stay normal browser links.

```md
[GitHub](https://github.com/earthroon/varuntools)
[Mail](mailto:hello@example.com)
```

### Asset links

Images, videos, downloads, and files are not router links.

```md
[PDF 다운로드](./files/spec.pdf)
[원본 영상](./videos/demo.webm)
![대표 이미지](./images/cover.webp)
```

Asset links should keep their file extension. The internal link handler leaves common file extensions alone.

### Related works links

`related-works` references can be written in any of these forms:

```md
::related-works
items-json: ["varun-loop", "works/varun-loop", "/works/varun-loop"]
::
::
```

They all resolve to existing Works entries only. Missing slugs are ignored rather than auto-created.

### Deep link fallback

GitHub Pages needs `dist/404.html` for direct access and refresh on nested app routes.

```txt
npm run build
```

The build step creates the SPA fallback after Vite writes `dist/index.html`.

## 14. Troubleshooting

### Works card does not appear

Check:

```yaml
kind: work
status: published
visibility: public
work:
  status: published
```

Also check that the slug starts with `works/`.

### Works card opens GitHub Pages 404

The site is a Vite/Vue single page app on a project path. Use router links for internal cards, and make sure GitHub Pages has an SPA fallback (`dist/404.html`) when deep links are opened directly.

### Image does not appear

Check that the file exists relative to the page folder.

```txt
index.md says: ./images/cover.webp
file must be: src/content/pages/works/<slug>/images/cover.webp
```

### Video does not appear

Use `video-player` and provide a poster image.

```md
::video-player
src: ./videos/demo.webm
poster: ./images/demo-poster.webp
controls: true
::
```

### Manual page got overwritten

Do not run `npm run csv:page` on a manual page. CSV generation is for pages where `page.csv` is the SSOT.

### `::tooltip` or `::badge` renders as plain text

That is expected. These directives are not supported production syntax. Use `captioned-image` with `caption` for tooltip behavior, and use `tag: 필수`, `tag: 선택`, or `tag: 기타` for the visible chip/badge.

### `field-spec` renders as plain text

Check that the current build includes Commit C. `field-spec` is supported after the field-spec directive is registered in `src/markdown/directiveTypes.ts` and routed through `src/markdown/directives/index.ts`.

## `::demo-frame`

`demo-frame` embeds an isolated project demo in an iframe. Use this for interactive demos, canvas/WebGL experiments, or mini apps that should not leak CSS or global events into the main Vue app.

```md
::demo-frame
id: sample-canvas
title: Sample Canvas Demo
ratio: 16 / 10
status: stable
::
This demo runs inside an isolated iframe.
::
```

### Fields

| Field | Required | Description |
|---|---:|---|
| `id` | optional | Looks up `src/data/demoManifest.json` |
| `src` | optional | Direct iframe source. Required when `id` is omitted |
| `title` | optional | Overrides manifest title |
| `ratio` | optional | CSS aspect-ratio value |
| `status` | optional | `stable`, `experimental`, or `archived` |
| `stack-json` | optional | JSON array of stack labels |
| `sandbox` | optional | iframe sandbox override |
| `allowFullscreen` | optional | iframe fullscreen permission |
| `autoResize` | optional | listen for runtime resize messages |
| `minHeight` | optional | minimum iframe height in pixels |
| `maxHeight` | optional | maximum iframe height in pixels |

At least one of `id` or `src` must be provided. Runtime src resolution uses `import.meta.env.BASE_URL`, so project-path deployments such as GitHub Pages load demos from the correct `/varuntools/demos/...` path.


### Demo runtime messages

Iframe demos may include the shared runtime helper:

```html
<script src="../demo-runtime.js" defer></script>
```

The helper posts messages to the parent page with `targetOrigin='*'` during the MVP stage so GitHub Pages, custom domains, and future CDN-hosted demos all work without origin drift.

| Message | Payload | Effect |
|---|---|---|
| `VARUN_DEMO_READY` | `{ source, type, id }` | marks the frame ready |
| `VARUN_DEMO_RESIZE` | `{ source, type, id, height }` | updates iframe height when `autoResize` is enabled |
| `VARUN_DEMO_ERROR` | `{ source, type, id, message }` | shows an error state without breaking the page |

The iframe demo should set the same id used by the manifest:

```html
<html lang="ko" data-demo-id="sample-canvas">
```
