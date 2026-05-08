# Commit 03 — Markdown Custom Element Vue Mount Bridge

## 목적

Commit 02에서 생성된 Markdown directive custom element placeholder를 실제 Vue 컴포넌트로 마운트한다.

```txt
Commit 02
Markdown directive parser → custom element HTML

Commit 03
custom element HTML → Vue component mount bridge
```

## 범위

- `<varun-video>`를 `VarunVideo.vue`로 마운트
- `<before-after-wiper>`를 `BeforeAfterWiper.vue`로 마운트
- `<image-card>`를 `ImageCard.vue`로 마운트
- `<callout-box>`를 `CalloutBox.vue`로 마운트
- Markdown root 안의 custom element를 스캔하는 bridge 추가
- route/page 변경 시 기존 mounted app cleanup
- `data-*` attribute를 props로 변환
- `contentDir` 기준 asset URL resolver 추가
- 실제 markdown component CSS 추가

## 보류

- VENOM NAV 이식 안 함
- Lightbox 이식 안 함
- Tooltip Caption 이식 안 함
- Pagecard Grid legacy parser 이식 안 함
- Featured Works legacy parser 이식 안 함
- Super/Notion `[전]` / `[후]` DOM parser 이식 안 함
- Markdown AST 기반 Vue renderer 전환 안 함

## SSOT

```txt
콘텐츠 SSOT:
src/content/pages/**/index.md

Directive HTML SSOT:
src/markdown/directivePlugin.ts
src/markdown/directives/*

Vue Mount Bridge SSOT:
src/markdown/mountMarkdownComponents.ts

Asset Resolver SSOT:
src/markdown/resolveContentAssets.ts
```

## 변경 파일

```txt
src/markdown/types.ts
src/markdown/loadMarkdownPages.ts
src/markdown/resolveContentAssets.ts
src/markdown/mountMarkdownComponents.ts
src/markdown/useMarkdownComponentMount.ts
src/pages/MarkdownPage.vue
src/pages/HomePage.vue
src/pages/WorksPage.vue
src/pages/WiperPage.vue
src/components/markdown/VarunVideo.vue
src/components/markdown/BeforeAfterWiper.vue
src/components/markdown/ImageCard.vue
src/components/markdown/CalloutBox.vue
src/styles/markdown-components.css
src/main.ts
docs/migration/commit-03.md
```

## 구현 기준

### `LoadedMarkdownPage.contentDir`

`slug`와 실제 콘텐츠 폴더가 다를 수 있으므로 `contentDir`을 별도 저장한다.

예:

```txt
src/content/pages/wiper/index.md
frontmatter slug: tools/wiper
contentDir: wiper
```

이 기준으로 `./images/before.svg`는 다음 파일에 귀속된다.

```txt
src/content/pages/wiper/images/before.svg
```

### Asset resolve 정책

```txt
http/https URL → 그대로 유지
data: URL → 그대로 유지
/public absolute path → 그대로 유지
./images, ./media → contentDir 기준으로 Vite asset URL resolve
못 찾은 파일 → 원본 src 유지
```

조용한 보정은 하지 않는다.

### Mount 정책

```txt
MarkdownPage / HomePage / WorksPage / WiperPage
→ v-html 렌더 완료 후 bridge 실행
→ route/page 변경 전 cleanup
→ 같은 custom element 중복 mount 방지: data-vt-mounted="1"
```

## 완료 기준

```txt
- npm run dev 성공
- npm run build 성공
- <varun-video>가 VarunVideo.vue로 mount
- <before-after-wiper>가 BeforeAfterWiper.vue로 mount
- <image-card>가 ImageCard.vue로 mount
- <callout-box>가 CalloutBox.vue로 mount
- /tools/wiper에서 before-after slider가 표시됨
- route/page 변경 시 cleanup이 수행됨
- legacy Super/Notion DOM parser는 여전히 보류됨
```

## 후속 커밋 후보

```txt
Commit 04 — VARUNTOOLS Showroom Theme Stabilization
- 기존 showroom override CSS를 토큰 기반으로 승격
- markdown-components.css 톤 통일
- 모바일 타이포 QA
- !important 제거 후보 분리
```
