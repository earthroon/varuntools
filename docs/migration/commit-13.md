# Commit 13 — Router / Slug Resolution Cleanup

## 목적

Markdown 문서 경로를 `frontmatter.slug` 기준으로 통합하고, 앱이 직접 소유하는 경로를 reserved route로 분리한다.

Commit 12에서 Markdown 문서 렌더링은 `MarkdownDocumentView.vue`로 통합되었다. Commit 13은 그 다음 단계로 라우터 특수 케이스를 줄이고, 문서 페이지가 `/:slug+` 경로에서 동일한 규칙으로 렌더되게 만든다.

## 핵심 변경

```txt
문서 페이지
└─ frontmatter.slug 기준으로 /:slug+에서 렌더

앱 페이지
├─ /
├─ /works
└─ /404
```

`/tools/wiper` 특수 route는 제거했다. 이제 `tools/wiper`는 Markdown frontmatter slug로 해석되고, 범용 `MarkdownPage.vue`를 통해 렌더된다.

## SSOT

```txt
reserved route SSOT
└─ src/router/reservedRoutes.ts

route manifest SSOT
└─ src/router/routeManifest.ts

slug normalize SSOT
└─ src/markdown/pageLookup.ts

Markdown page SSOT
└─ src/content/pages/**/index.md frontmatter.slug
```

## 변경 파일

```txt
src/router/reservedRoutes.ts       추가
src/router/routeManifest.ts        추가
src/composables/useRouteManifest.ts 추가
src/markdown/pageLookup.ts         보강
src/router/index.ts                /tools/wiper 제거, /404 추가
src/pages/NotFoundPage.vue         추가
src/pages/WiperPage.vue            제거
src/pages/HomePage.vue             useRouteManifest 사용
src/pages/MarkdownPage.vue         useRouteManifest 사용
src/pages/WorksPage.vue            useRouteManifest 사용
src/styles/markdown-document.css   not-found link 스타일 보강
```

## reserved route

```txt
/      → HomePage.vue
/works → WorksPage.vue
/404   → NotFoundPage.vue
```

`works`, `404`는 Markdown slug로 사용하면 reserved slug conflict로 간주한다. Commit 13에서는 개발 환경에서 경고만 출력하고, build fail은 후속 content validation gate에서 처리한다.

## slug 규칙

```txt
- 앞뒤 slash 제거
- 중복 slash는 하나로 축소
- 빈 값은 fallback 사용
- 대소문자 자동 보정 없음
- 유사 slug 추측 없음
- 없는 slug는 null
```

## Not Found 정책

```txt
없는 slug
└─ MarkdownDocumentView의 공통 not-found UI 표시

/404 직접 접근
└─ NotFoundPage.vue 표시

강제 redirect
└─ 하지 않음
```

GitHub Pages의 실제 404 fallback 처리는 Commit 14 배포 하드닝에서 다룬다.

## 하지 않은 것

```txt
- GitHub Pages deploy workflow 추가 안 함
- SPA fallback/404.html 생성 안 함
- sitemap 생성 안 함
- SEO meta 관리 안 함
- content validation build fail 안 함
- redirect system 안 함
- legacy Super/Notion route adapter 안 함
```

## 완료 기준

```txt
- reservedRoutes.ts 추가
- routeManifest.ts 추가
- pageLookup.ts normalize 강화
- useRouteManifest.ts 추가
- router/index.ts에서 /tools/wiper route 제거
- NotFoundPage.vue 추가
- WiperPage.vue 제거
- HomePage / MarkdownPage / WorksPage가 useRouteManifest 사용
- markdown-document.css에 not-found link 스타일 추가
- npm run build 통과
```
