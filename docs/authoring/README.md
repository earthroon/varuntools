# VarunTools Authoring Guidebook

> VarunTools 콘텐츠 작성자가 처음 열어야 하는 입구 문서입니다.  
> 자세한 문법 사전은 `docs/authoring/varuntools-markdown-dictionary.md`가 SSOT입니다.

## 0. 이 문서의 역할

VarunTools에는 이미 마크다운 문법, CSV 작성법, Works frontmatter, 미디어 에셋 규칙, 검색/SEO 규칙 문서가 나뉘어 있습니다.  
이 README는 그 문서들을 한 번에 찾기 위한 **작성자용 지도**입니다.

```txt
작성 입구 SSOT = docs/authoring/README.md
마크다운 문법 SSOT = docs/authoring/varuntools-markdown-dictionary.md
수동 Works 페이지 SSOT = src/content/pages/works/<slug>/index.md
CSV 기반 페이지 SSOT = src/content/pages/<category>/<slug>/page.csv
CSV 생성 결과물 = index.md
Works 노출 SSOT = frontmatter.work
```

## 1. 먼저 결정할 것

페이지를 만들기 전에 아래 둘 중 하나를 먼저 고릅니다.

| 작성 방식 | 기준 파일 | 쓰는 경우 | 주의 |
|---|---|---|---|
| 수동 Markdown | `src/content/pages/works/<slug>/index.md` | 케이스스터디, 서사형 포트폴리오, 설명 중심 페이지 | 직접 `index.md`를 편집합니다. |
| CSV Authored | `src/content/pages/<category>/<slug>/page.csv` | 갤러리, 반복 블록, 제품/작업 목록, 구조화된 페이지 | 생성된 `index.md`를 직접 고치지 않습니다. |

판단이 애매하면 이렇게 고릅니다.

```txt
문장과 흐름이 중요하다 → 수동 Markdown
반복 블록과 데이터 정리가 중요하다 → CSV
Works 카드에 노출해야 한다 → frontmatter.work 필수
```

## 2. 가장 많이 쓰는 작성 루트

### A. 수동 Works 페이지 만들기

```txt
src/content/pages/works/my-work/index.md
```

최소 구조:

```md
---
title: "My Work"
description: "작업을 한 문장으로 설명합니다."
slug: works/my-work
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
    - tool
  summary: "Works 카드와 목록에 쓰일 짧은 설명입니다."
---

# My Work

작업의 배경, 문제, 설계, 구현, 결과를 작성합니다.
```

검증:

```bash
npm run validate:content
npm run build
```

### B. CSV 기반 Works 페이지 만들기

```bash
npm run new:page -- works my-work --csv --type case-study
npm run csv:pages
npm run validate:content
npm run build
```

중요 계약:

```txt
page.csv를 편집합니다.
index.md는 생성 결과물이므로 직접 수정하지 않습니다.
```

## 3. Works에 노출되는 조건

`/works` 목록에 뜨려면 아래 조건을 만족해야 합니다.

```yaml
kind: work
status: published
visibility: public
work:
  status: published
```

숨겨지는 대표 조건:

```yaml
status: draft
visibility: private
work:
  status: draft
```

`work` 객체가 없으면 일반 페이지로 취급될 수 있습니다.  
Works 카드, 필터, 정렬, related works는 `frontmatter.work`를 기준으로 읽습니다.

## 4. 폴더 지도

```txt
docs/authoring/
  README.md                              # 작성자 입구
  varuntools-markdown-dictionary.md      # 전체 마크다운 문법 사전
  markdown-components.md                 # 커스텀 마크다운 컴포넌트
  page-frontmatter.md                    # 일반 페이지 frontmatter
  portfolio-authoring-v2.md              # 포트폴리오 CSV 작성 플로우
  portfolio-frontmatter.md               # frontmatter.work 계약
  portfolio-editorial-blocks.md          # 편집형 블록
  portfolio-copy-rhythm-guide.md         # 문장 리듬 가이드
  portfolio-links.md                     # 데모/소스/외부 링크 규칙
  csv-authoring.md                       # CSV 작성법
  media-authoring.md                     # 비디오/미디어 작성법
  image-assets.md                        # 이미지 에셋 작성법
```

콘텐츠 위치:

```txt
src/content/pages/
  works/<slug>/index.md                  # 수동 Works 페이지
  works/<slug>/page.csv                  # CSV Works 원본
  <category>/<slug>/index.md             # 일반 페이지
  <category>/<slug>/page.csv             # CSV 원본
```

## 5. 기본 Markdown 문법

일반 마크다운은 그대로 씁니다.

```md
# 제목 1
## 제목 2
### 제목 3

본문입니다. **강조**와 _기울임_을 사용할 수 있습니다.

- 목록
- 목록

1. 순서 목록
2. 순서 목록

[링크 텍스트](https://example.com)

![Alt text](./images/example.webp "[필수] 이미지 설명")
```

이미지 규칙:

```md
![Alt text](./images/example.webp "[필수] 이미지 설명")
```

권장:

```txt
alt = 이미지가 보이지 않아도 내용을 이해할 수 있는 설명
caption = 화면에서 보여줄 보조 설명
파일명 = 소문자, 하이픈, 의미 있는 이름
```

## 6. VarunTools 커스텀 블록 빠른 문법

상세 문법은 `markdown-components.md`와 `varuntools-markdown-dictionary.md`를 봅니다.

### Markdown Box

```md
::markdown-box
type: ssot
title: 기준
::
내용을 작성합니다.
::
```

### Section Gap

```md
::section-gap
::
```

### Before / After

```md
::before-after
before: ./images/before.webp
after: ./images/after.webp
caption: 비교 이미지
initial: 50
::
```

### Pagecard Grid

```md
::pagecard-grid
items: /tools/wiper,/lab/markdown-gallery
columns: auto
::
```

### Homepage Section

```md
::home-section
title: Featured Works
source: works
featured: true
limit: 6
layout: work-grid
::
```

## 7. Works frontmatter 치트시트

```yaml
work:
  type: case-study        # case-study | tool | visual | service | experiment 등
  status: published       # published | draft | private
  featured: true          # 홈/목록 강조 여부
  weight: 90              # 정렬 가중치. 높을수록 우선 노출
  year: 2026
  client: internal
  role:
    - Design Engineer
    - Frontend
  stack:
    - Vue
    - TypeScript
    - Cloudflare Workers
  tools:
    - Figma
    - VS Code
  tags:
    - portfolio
    - automation
  mood:
    tone: almond-paper
    density: high
  links:
    demo: /demo
    source: https://github.com/example/repo
```

필터에 직접 연결되는 값:

```txt
work.type
work.role
work.stack
work.tags
work.year
work.featured
```

## 8. 작성 전 체크리스트

새 페이지를 만들 때:

```txt
[ ] 작성 방식이 수동 Markdown인지 CSV인지 정했다.
[ ] slug가 실제 경로와 맞는다.
[ ] title과 description이 있다.
[ ] public으로 공개할 페이지인지 확인했다.
[ ] Works에 노출할 경우 frontmatter.work가 있다.
[ ] thumbnail과 cover 경로가 실제 파일과 맞는다.
[ ] 이미지 alt/caption을 작성했다.
[ ] 내부 링크가 존재하는 페이지를 가리킨다.
[ ] npm run validate:content를 통과한다.
[ ] npm run build를 통과한다.
```

## 9. 배포 전 명령

일반 검증:

```bash
npm run validate:content
npm run build
```

CSV 페이지를 수정했다면:

```bash
npm run csv:pages
npm run validate:content
npm run build
```

포트폴리오 관련 검증이 필요하면:

```bash
npm run smoke:portfolio-frontmatter
npm run smoke:csv-portfolio-blocks
npm run smoke:csv-options
```

의존성까지 다시 확인해야 할 때:

```bash
npm ci
npm run check:deps
npm run validate:content
npm run build
```

## 10. 자주 터지는 문제

### Works 목록에 안 뜸

확인할 것:

```txt
kind: work
status: published
visibility: public
work.status: published
```

그리고 `work` 객체가 있는지 확인합니다.

### CSV 페이지를 고쳤는데 반영이 안 됨

`page.csv` 수정 후 생성 명령을 다시 실행해야 합니다.

```bash
npm run csv:pages
```

생성된 `index.md`를 직접 고친 경우, 다음 생성 때 덮어써질 수 있습니다.

### 이미지가 깨짐

확인할 것:

```txt
경로가 현재 index.md 기준 상대경로인지
파일명이 대소문자까지 정확한지
public 경로와 src/content 상대경로를 섞지 않았는지
```

### GitHub Pages에서 링크가 404 남

확인할 것:

```txt
vite.config.ts의 base
Vue Router의 BASE_URL
링크가 생짜 href인지 RouterLink인지
배포 주소가 / 인지 /varuntools/ 인지
```

### 검색/SEO에 안 잡힘

확인할 것:

```txt
noindex: true 여부
draft/private 상태 여부
description 존재 여부
search index 생성 여부
```

관련 문서:

```txt
docs/authoring/page-search.md
docs/authoring/page-search-visibility.md
docs/authoring/portfolio-seo.md
docs/authoring/sitemap-search-visibility.md
```

## 11. 문서별로 언제 볼까

| 상황 | 볼 문서 |
|---|---|
| 전체 문법을 보고 싶다 | `varuntools-markdown-dictionary.md` |
| 커스텀 블록만 빠르게 보고 싶다 | `markdown-components.md` |
| frontmatter가 헷갈린다 | `page-frontmatter.md`, `portfolio-frontmatter.md` |
| Works 페이지를 CSV로 만들고 싶다 | `portfolio-authoring-v2.md`, `csv-authoring.md` |
| 이미지/비디오가 깨진다 | `image-assets.md`, `media-authoring.md` |
| 필터/태그가 이상하다 | `work-taxonomy-filter.md`, `portfolio-tags.md` |
| Works 목록 노출이 이상하다 | `works-collection.md`, `portfolio-frontmatter.md` |
| 검색/SEO가 이상하다 | `page-search.md`, `portfolio-seo.md` |
| 배포 전 점검이 필요하다 | `launch-checklist.md`, `launch-validation.md` |

## 12. 권장 작성 순서

서사형 Works 기준:

```txt
1. slug 정하기
2. src/content/pages/works/<slug>/index.md 생성
3. frontmatter 먼저 작성
4. thumbnail / cover 파일 배치
5. 본문 작성
6. markdown-box / before-after / gallery 등 필요한 블록 추가
7. validate:content 실행
8. build 실행
9. Git commit / push
```

CSV Works 기준:

```txt
1. npm run new:page -- works <slug> --csv --type <type>
2. page.csv 작성
3. asset 교체
4. npm run csv:pages
5. validate:content 실행
6. build 실행
7. Git commit / push
```

## 13. Git 반영 루틴

```bash
git status
npm run build
git add -A
git commit -m "docs: update authoring guidebook"
git pull --rebase origin main
git push origin main
```

커밋 전에 `.bak`, `node_modules`, `dist`가 의도 없이 들어가지 않았는지 확인합니다.

```bash
git status
```

## 14. 작성 철학

VarunTools 문서는 단순히 페이지를 채우는 글이 아닙니다.  
각 페이지는 다음 세 층을 동시에 가져야 합니다.

```txt
감각: 왜 이 작업이 필요한가
구조: 어떤 문제를 어떤 방식으로 풀었는가
기술: 실제로 무엇이 작동하는가
```

문장은 멋있기만 하면 부족하고, 구조는 정확하기만 하면 건조합니다.  
VarunTools의 작성 규칙은 둘을 같이 묶기 위한 최소한의 레일입니다.

## 15. Easy Markdown Wrapper

Easy Markdown은 기존 `::directive` 문법을 없애는 기능이 아니라, 작성자가 `@summary`, `@problem`, `@image`, `@gallery` 같은 더 짧은 문법으로 Works/page 초안을 작성하고 빌드 전에 정식 `index.md`로 컴파일하기 위한 작성자용 래퍼입니다.

```txt
work.easy.md / page.easy.md
→ npm run easy:compile
→ index.md
→ npm run build
```

문서 위치:

```txt
로드맵 SSOT = docs/authoring/easy-markdown-roadmap.md
문법 매핑 SSOT = docs/authoring/easy-markdown-syntax.md
```

읽는 순서:

```txt
1. easy-markdown-roadmap.md
2. easy-markdown-syntax.md
3. src/content/templates/easy/*.easy.md
```

지원 명령:

```powershell
npm run easy:list
npm run easy:compile
npm run easy:check
npm run smoke:easy
```

## 16. Easy Markdown Templates

Easy Markdown 템플릿은 아래 위치에 있습니다.

```txt
src/content/templates/easy/work.easy.md
src/content/templates/easy/page.easy.md
src/content/templates/easy/case-study.easy.md
```

권장 사용:

```powershell
npm run new:work:easy -- my-work --title "My Work"
npm run easy:check
npm run build
```

수동으로 템플릿을 복사해도 되지만, 기본 루틴은 `new:work:easy` / `new:page:easy` 명령을 사용합니다.

## 17. Easy Markdown Scaffolding

새 Easy Markdown 페이지는 명령으로 생성합니다.

```powershell
npm run new:work:easy -- varuntools --title "VARUNTOOLS"
npm run new:work:easy -- varuntools-case --title "VARUNTOOLS Case" --template case-study
npm run new:page:easy -- guide markdown-guide --title "Markdown Guide"
```

생성 후 작성할 파일:

```txt
src/content/pages/works/<slug>/work.easy.md
src/content/pages/<section>/<slug>/page.easy.md
```

직접 수정하지 말 것:

```txt
index.md
```

`index.md`는 `work.easy.md` 또는 `page.easy.md`에서 생성되는 파일입니다. 생성물에는 `GENERATED FROM ...` marker와 `SOURCE HASH`가 들어가며, `npm run easy:check`가 stale 여부를 검사합니다.


## Micro Markdown

Micro Markdown is the shortest authoring layer. Use it when you want to write fast shorthand and let VarunTools expand it into Easy Markdown and then `index.md`.

```txt
work.micro.md
→ work.easy.md
→ index.md
```

Typical commands:

```powershell
npm run micro:compile
npm run micro:check
npm run smoke:micro
```

Example:

```md
@H1_바룬의 이야기
@DESC_작업이 계속 쌓여도 무너지지 않도록 만든 개인 출판 엔진.
@PUBLIC
@V=./videos/out.webm|출력 데모 영상
@BA=./images/before.webp|./images/after.webp|50|전후 비교
@SSOT_작성 기준|collapse=true
이 문서의 원본은 work.micro.md입니다.

@GAL_작업 화면|columns=2,variant=framed
@ITEM=./images/list.webp|Works 목록|label=01
@ITEM=./images/detail.webp|상세 페이지|label=02

@COLS_2|gap=md,collapse=mobile
@COL_문제
문제 설명입니다.

@COL_해결
해결 설명입니다.
```

Additional shorthand groups now include gallery, metric, tool stack, related works, editorial title, columns, section gap, and section break commands.

Edit this:

```txt
work.micro.md
```

Generated files:

```txt
work.easy.md
index.md
```

Do not edit generated files directly.

## Micro Markdown Scaffolding

새 Micro Markdown 페이지는 명령으로 생성합니다.

```powershell
npm run new:work:micro -- barun-story --title "바룬의 이야기"
npm run new:work:micro -- barun-case --title "Barun Case" --template case-study
npm run new:page:micro -- guide markdown-guide --title "Markdown Guide"
```

생성 후 직접 작성할 파일:

```txt
src/content/pages/works/<slug>/work.micro.md
src/content/pages/<section>/<slug>/page.micro.md
```

생성물:

```txt
work.easy.md / page.easy.md
index.md
```

`work.easy.md`, `page.easy.md`, `index.md`는 생성물입니다. Micro 원본을 수정한 뒤 아래 루틴으로 확인합니다.

```powershell
npm run micro:compile
npm run micro:check
npm run easy:check
npm run build
```

## Build Pipeline for Authoring Sources

`npm run build` now compiles authoring sources before Vite builds the site.

```txt
work.micro.md / page.micro.md
→ work.easy.md / page.easy.md
→ index.md
→ dist
```

Use these commands when you want to inspect the authoring pipeline directly:

```powershell
npm run content:compile
npm run content:check
npm run build
```

Responsibility split:

```txt
micro:check     = Micro Markdown → Easy Markdown stale check
easy:check      = Easy Markdown → index.md stale check
validate:content = frontmatter / content registry validation
```

SSOT rule:

```txt
Micro source pages: work.micro.md / page.micro.md
Easy source pages:  work.easy.md / page.easy.md
Generated pages:    index.md
```
