# VarunTools Sheet CMS 03 — Apps Script Gateway Sync

## 목적

이 문서는 3번 재베이크 산출물이다. `sync:sheets`는 Google Sheets API를 직접 호출하지 않는다. 대신 Apps Script Web App의 `snapshot` action을 호출해서 시트 값을 받는다.

```txt
GitHub Actions
  ↓
APPS_SCRIPT_WEBAPP_URL?action=snapshot equivalent POST
  ↓
Apps Script
  ↓
Spreadsheet tabs getDataRange().getDisplayValues()
  ↓
GitHub Actions raw JSON 생성
```

## 필수 환경변수

```txt
APPS_SCRIPT_WEBAPP_URL
SHEET_CMS_SHARED_SECRET
```

## sync:sheets 출력 — 임시 cache

```txt
.sheet-cms-cache/raw/pages.raw.json
.sheet-cms-cache/raw/blocks.raw.json
.sheet-cms-cache/raw/assets.raw.json
.sheet-cms-cache/raw/settings.raw.json
.sheet-cms-cache/raw/enums_block_types.raw.json
.sheet-cms-cache/raw/enums_callout_types.raw.json
.sheet-cms-cache/raw/guide.raw.json
.sheet-cms-cache/raw/publish_log.raw.json
.sheet-cms-cache/sheet-sync.generated.json
```


중요:

```txt
raw snapshot은 repo에 커밋하지 않는다.
.sheet-cms-cache는 GitHub Actions 작업공간의 임시 재료이며 .gitignore 대상이다.
repo에 남기는 것은 generate 단계가 만든 public-safe generated JSON뿐이다.
```

## Apps Script snapshot 응답 계약

Apps Script는 아래 형태를 반환한다.

```json
{
  "ok": true,
  "source": "apps-script-gateway",
  "generatedAt": "2026-05-12T00:00:00.000Z",
  "requestId": "pub_...",
  "tabs": {
    "pages": [["pageId", "visible"], ["home", "Y"]],
    "blocks": [["pageId", "kind"], ["home", "text"]]
  }
}
```

`sync:sheets`는 이 값을 받아 기존 row-normalizer로 헤더 기반 raw JSON을 만든다.

## assets payload 응답 계약

이미지/파일은 Apps Script가 Drive root/pageId 폴더에서 가져와 base64 payload로 준다. GitHub Actions는 그 payload를 `src/content/pages/{pageFolder}/{pageId}/images|media`에 페이지 귀속 파일로 등록한다.

요청:

```json
{
  "action": "assets",
  "secret": "...",
  "assets": [
    { "assetId": "cover_001", "driveFileId": "...", "type": "image" }
  ]
}
```

응답:

```json
{
  "ok": true,
  "assets": [
    {
      "assetId": "cover_001",
      "mimeType": "image/webp",
      "extension": "webp",
      "type": "image",
      "role": "cover",
      "base64": "..."
    }
  ]
}
```

`sync:drive-assets`는 실제 명령 이름을 유지하지만 내부 구현은 Apps Script gateway를 사용한다.

```bash
npm run sync:drive-assets
```

## 추가 명령어

```bash
npm run sync:sheets
npm run sync:drive-assets
npm run smoke:sync-sheets
npm run smoke:appscript-assets
```

## 직접 Google API 호출 폐기

아래는 더 이상 사용하지 않는다.

```txt
GOOGLE_SERVICE_ACCOUNT_JSON
GOOGLE_APPLICATION_CREDENTIALS
VARUNTOOLS_SHEET_ID
DRIVE_ASSET_FOLDER_ID
Google OAuth JWT in repo scripts
```

## 한 줄 계약

```txt
3번 재베이크는 Actions가 Apps Script gateway에서 snapshot과 asset payload를 받아 raw JSON과 public assets를 등록하는 구조로 sync 경계를 바꾼다.
```
