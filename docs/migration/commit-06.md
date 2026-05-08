# Commit 06 — Markdown Navigation / TOC Foundation

## 목적

Markdown 콘텐츠에서 `h1`, `h2`, `h3` heading을 수집하여 페이지별 TOC를 생성하고, 스크롤 위치에 따라 active heading을 추적하는 Vue-native navigation foundation을 만든다.

이 커밋은 기존 Super/Notion의 VENOM NAV를 이식하지 않는다. 먼저 Markdown 렌더링 시점에서 heading id와 metadata를 생성하고, 새 네임스페이스 `vt-toc`를 사용해 충돌 없는 목차 기반을 세운다.

## 범위

- `MarkdownHeading` / `RenderedMarkdownPage` 타입 추가
- `slugifyHeading()` / `createUniqueHeadingId()` 추가
- `renderMarkdownPage()` 추가
- `LoadedMarkdownPage.headings` 추가
- heading HTML에 id 자동 주입
- `MarkdownToc.vue` 추가
- `useActiveHeading.ts` 추가
- MarkdownPage/HomePage/WorksPage/WiperPage에 TOC 연결
- `markdown-toc.css` 추가
- heading `scroll-margin-top` 보강

## 하지 않는 것

- 기존 VENOM NAV 직접 이식 안 함
- `wiki-nav` 클래스 재사용 안 함
- back / up / home 버튼 구현 안 함
- Super/Notion DOM heading collector 이식 안 함
- MutationObserver 기반 nav 재생성 안 함
- Lightbox / Tooltip / Pagecard legacy 기능 이식 안 함

## SSOT

```txt
heading id 생성: src/markdown/slugifyHeading.ts
heading metadata 생성: src/markdown/renderMarkdownPage.ts
TOC UI: src/components/markdown/MarkdownToc.vue
active heading state: src/composables/useActiveHeading.ts
```

## heading 규칙

- `h1`, `h2`, `h3`만 TOC 대상으로 삼는다.
- heading text에서 한글, 영문, 숫자, 공백, 하이픈을 중심으로 slug를 생성한다.
- 중복 id는 `-2`, `-3` 접미사를 붙인다.
- 빈 heading은 `section`으로 fallback한다.

## 완료 기준

- Markdown 렌더링 결과의 heading에 id가 자동 부여된다.
- `LoadedMarkdownPage.headings`가 생성된다.
- `MarkdownToc`가 headings를 렌더링한다.
- TOC 클릭 시 해당 heading으로 이동한다.
- URL hash가 `replaceState`로 갱신된다.
- 스크롤 시 active heading이 갱신된다.
- 모바일에서 TOC toggle이 작동한다.
- 기존 legacy `wiki-nav`는 여전히 보류된다.
