# Commit 16 — Content Validation Gate

## 목적

Markdown 콘텐츠의 frontmatter, slug, related graph, media asset, SEO field를 빌드 전에 검증한다.

Commit 16의 핵심은 조용한 보정을 막는 것이다. 없는 slug, 없는 asset, 틀린 enum은 런타임 fallback으로 덮지 않고 `validate:content` 단계에서 드러낸다.

## 추가된 파일

```txt
scripts/validate-content.mjs
src/validation/contentValidationTypes.ts
src/validation/contentValidationRules.ts
src/validation/contentValidationReport.ts
```

## package script

```json
{
  "validate:content": "node scripts/validate-content.mjs",
  "build": "npm run validate:content && vue-tsc --noEmit && vite build",
  "build:pages": "npm run build && node scripts/create-spa-fallback.mjs"
}
```

## Error 기준

```txt
- title / slug 누락
- slug 형식 오류
- slug 중복
- reserved route와 slug 충돌
- related에 존재하지 않는 slug 사용
- cover / cardCover / cardIcon / ogImage asset 누락
- layout / theme / kind / status / visibility / robots enum 오류
- tags / related 배열 형식 오류
- order number 형식 오류
- featured boolean 형식 오류
- date / updated 형식 또는 실제 날짜 오류
- canonical 형식 오류
```

## Warning 기준

```txt
- related가 자기 자신을 가리킴
- related가 hidden / archived page를 가리킴
- draft page가 robots: index,follow를 명시함
- SEO 필드가 존재하지만 빈 문자열임
```

## Reserved route

```txt
works
404
```

`home`은 content slug로 허용한다. `/` route로 렌더링되지만 content SSOT는 `slug: home`을 유지한다.

## Works 문서 처리

`/works`는 collection app page이므로 reserved route다. 기존 `src/content/pages/works/index.md`는 설명 문서 역할로 남기되 slug를 `docs/works`로 이동했다.

## 하지 않는 것

```txt
- auto-fix 없음
- 외부 URL HTTP 검사 없음
- 이미지 용량/크기 검사 없음
- sitemap 생성 없음
- OG 이미지 자동 생성 없음
- Markdown 본문 lint 없음
```

## 완료 기준

```txt
npm run validate:content 성공
npm run build 성공
npm run build:pages 성공
```
