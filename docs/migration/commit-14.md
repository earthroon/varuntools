# Commit 14 — GitHub Pages / Deploy Hardening

## 목적

VARUNTOOLS Vite/Vue 앱을 GitHub Pages에 안정적으로 배포할 수 있도록 GitHub Actions workflow, Vite base 설정, custom domain, `.nojekyll`, SPA fallback, deploy 문서를 정리한다.

Commit 13에서 문서 라우팅은 `frontmatter.slug` 기준으로 정리되었다. Commit 14는 이 라우팅 구조가 GitHub Pages 정적 호스팅에서 새로고침해도 죽지 않게 배포 표면을 봉인한다.

## 핵심 변경

```txt
.github/workflows/deploy.yml
scripts/create-spa-fallback.mjs
public/CNAME
public/.nojekyll
docs/deploy/github-pages.md
package.json build:pages
vite.config.ts base: '/'
```

## SSOT

```txt
Deploy workflow SSOT
└─ .github/workflows/deploy.yml

Vite build SSOT
└─ vite.config.ts

Custom domain SSOT
└─ public/CNAME

SPA fallback SSOT
└─ scripts/create-spa-fallback.mjs
```

## GitHub Actions

Workflow 이름:

```txt
Deploy VARUNTOOLS to GitHub Pages
```

트리거:

```txt
push to main
workflow_dispatch
```

권한:

```txt
contents: read
pages: write
id-token: write
```

Build job은 `npm ci` 후 `npm run build:pages`를 실행하고, `dist`를 Pages artifact로 업로드한다. Deploy job은 `actions/deploy-pages@v4`를 사용한다.

## Vite base

커스텀 도메인 `varun.tools` 기준으로 `base: '/'`를 명시한다.

```ts
export default defineConfig({
  base: '/',
  plugins: [vue()],
})
```

프로젝트 페이지 형태인 `username.github.io/repo`로 바꿀 경우에는 `base: '/repo/'`로 수정해야 한다.

## SPA fallback

GitHub Pages는 정적 서버이므로 `/tools/wiper`를 직접 방문하거나 새로고침하면 실제 파일 경로가 없어 404가 날 수 있다.

이를 막기 위해 `npm run build:pages`가 다음 작업을 수행한다.

```txt
dist/index.html → dist/404.html
```

`404.html` 안에서 Vue 앱이 현재 path를 읽고, Vue Router가 다시 올바른 Markdown route를 렌더한다.

## public files

```txt
public/CNAME      varun.tools
public/.nojekyll  empty file
```

`CNAME`은 저장소 기준 custom domain 문서화 용도이며, GitHub Pages Settings에서도 custom domain을 수동 설정해야 한다. `.nojekyll`은 GitHub Pages의 Jekyll 처리를 우회하기 위해 둔다.

## 하지 않은 것

```txt
- SEO / OG meta 구현 안 함
- sitemap.xml 생성 안 함
- robots.txt 고도화 안 함
- content validation gate 안 함
- custom domain DNS 자동 설정 안 함
- GitHub repository settings 자동 변경 안 함
- Cloudflare Pages 대응 안 함
- Netlify/Vercel 대응 안 함
- legacy Super/Notion 기능 이식 안 함
```

## 완료 기준

```txt
- .github/workflows/deploy.yml 추가
- vite.config.ts base: '/' 명시
- scripts/create-spa-fallback.mjs 추가
- package.json에 build:pages 추가
- public/CNAME에 varun.tools 명시
- public/.nojekyll 추가
- docs/deploy/github-pages.md 작성
- README deploy 섹션 갱신
- npm run build 성공
- npm run build:pages 성공
- dist/404.html 생성 확인
```

## 다음 커밋 후보

```txt
Commit 15 — Page Meta / SEO / OG Image
```

배포 표면을 잠근 다음에는 frontmatter 기반 `document.title`, description, OG/Twitter card, canonical URL을 연결하는 것이 자연스럽다.
