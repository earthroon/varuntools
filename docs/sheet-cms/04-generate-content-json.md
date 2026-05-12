# 04. generate:content-json

## 목적

`generate:content-json`은 Apps Script Gateway에서 받은 임시 raw snapshot과 asset manifest를 읽어 Vue가 렌더링할 public-safe typed JSON으로 굽는다.

이 단계부터 Sheet CMS는 **영구 CMS DB**가 아니라 **임시 작성/발행 콘솔**로 취급한다.

```txt
Google Sheet = staging console / publish queue
.sheet-cms-cache/raw = Actions 작업공간 임시 재료
src/content/generated = repo에 남는 published generated store
Vue = generated JSON renderer
```

## 핵심 계약

```txt
1. raw snapshot은 repo에 커밋하지 않는다.
2. raw snapshot은 .sheet-cms-cache 아래의 임시 입력이다.
3. repo에 남는 것은 public-safe generated JSON과 public assets뿐이다.
4. Sheet rows는 발행 명령으로 취급한다.
5. 기존 published generated JSON은 새 sheet snapshot과 병합된다.
```

## 왜 raw를 커밋하지 않는가

스프레드시트는 작성 콘솔일 뿐이다. 시트에 있는 값이 그대로 repo에 raw JSON으로 누적되면, CMS 입력면이 public repo 안에 찌꺼기처럼 남는다.

따라서 다음 파일은 커밋 대상이 아니다.

```txt
.sheet-cms-cache/raw/*.raw.json
.sheet-cms-cache/sheet-sync.generated.json
.sheet-cms-cache/drive-assets.generated.json
```

커밋 대상은 다음이다.

```txt
src/content/generated/pages.generated.json
src/content/generated/assets.generated.json
src/content/generated/settings.generated.json
src/content/generated/manifest.generated.json
src/content/pages/{pageFolder}/{pageId}/images/**
src/content/pages/{pageFolder}/{pageId}/media/**
```

## staging-console lifecycle

`generate:content-json`은 기존 generated JSON을 base로 읽고, 이번 시트 snapshot을 patch처럼 적용한다.

```txt
base generated JSON
+ current sheet staging rows
= next generated JSON
```

이 덕분에 발행 후 시트를 비우거나 정리해도 기존 사이트 콘텐츠는 사라지지 않는다.

## page 처리 규칙

```txt
visible=Y + status=published
→ page upsert

visible=Y + status=archived 또는 hidden
→ 기존 generated page 삭제

visible=N 또는 공란
→ 이번 발행에서 무시

status=draft
→ 이번 발행에서 무시
```

## blocks 처리 규칙

```txt
page row가 있는 published page
→ 해당 page의 blocks를 이번 snapshot 기준으로 교체

page row 없이 blocks만 있는 기존 page
→ 기존 page metadata는 유지하고 blocks만 교체

public page가 없는 pageId의 block
→ 무시
```

## assets 처리 규칙

```txt
visible=Y asset
→ drive-assets.generated.json의 src와 raw asset metadata를 병합해 upsert

visible=N 또는 공란
→ 이번 발행에서 무시
```

asset 삭제는 초기 구현 범위에서 제외한다. 필요하면 별도 `assetStatus=archived` 또는 cleanup action을 추가한다.

## 공란 비활성 규칙

```txt
calloutType 공란 → callout 생성 안 함
before/after 둘 다 공란 → compare 생성 안 함
buttonLabel/buttonUrl 중 하나라도 공란 → CTA 생성 안 함
coverAssetId 공란 → cover 없음
caption 공란 → caption 없음
```

## public leak 금지

public generated JSON에는 다음 key가 남으면 안 된다.

```txt
driveFileId
memo
internalMemo
privateNote
adminOnly
private_key
client_email
serviceAccount
spreadsheetId
```

## 명령어

```bash
npm run generate:content-json
npm run smoke:generate-content-json
```

## 기본 입력/출력

입력:

```txt
.sheet-cms-cache/raw/*.raw.json
.sheet-cms-cache/drive-assets.generated.json
```

출력:

```txt
src/content/generated/pages.generated.json
src/content/generated/assets.generated.json
src/content/generated/settings.generated.json
src/content/generated/manifest.generated.json
```

## 완료 기준

```txt
1. raw snapshot을 repo에 남기지 않는다.
2. 기존 generated JSON을 base로 유지한다.
3. visible=Y + published page를 upsert한다.
4. visible=Y + archived/hidden page를 삭제한다.
5. callout/compare/image/cta/faq/text block을 typed JSON으로 변환한다.
6. driveFileId/memo/private 필드를 public JSON에 남기지 않는다.
7. manifest에 lifecycle.rawRetention = ephemeral-cache-only가 기록된다.
```
