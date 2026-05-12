# 06. publish-sheet-cms GitHub Actions workflow

## 목적

`publish-sheet-cms.yml`은 Apps Script Gateway에서 sheet snapshot과 Drive asset payload를 받아 public-safe generated files로 굽고, 검증과 빌드를 통과한 산출물만 repository에 커밋하는 자동 출판 파이프라인이다.

```txt
Apps Script repository_dispatch 또는 GitHub workflow_dispatch
  ↓
publish-sheet-cms.yml
  ↓
sync:sheets
  ↓
sync:drive-assets
  ↓
generate:content-json
  ↓
validate:generated-content
  ↓
typecheck
  ↓
build
  ↓
generated commit
```

## 핵심 계약

```txt
Google API key / service account / Drive token은 repo와 GitHub Actions에 두지 않는다.
Google 접근 권한은 Apps Script에 봉인한다.
GitHub Actions는 APPS_SCRIPT_WEBAPP_URL과 SHEET_CMS_SHARED_SECRET만 사용한다.
.sheet-cms-cache는 임시 재료이며 commit하지 않는다.
repo에 남기는 것은 public-safe generated 산출물뿐이다.
```

## workflow 파일

```txt
.github/workflows/publish-sheet-cms.yml
```

## trigger

```yaml
on:
  repository_dispatch:
    types: [publish-sheet-content]
  workflow_dispatch:
```

초기에는 `push` trigger를 넣지 않는다. 이 workflow는 generated files를 직접 commit/push하므로, push trigger를 넣으면 자기 커밋으로 재실행될 수 있다.

## GitHub Secrets

필수:

```txt
APPS_SCRIPT_WEBAPP_URL
SHEET_CMS_SHARED_SECRET
```

불필요/금지:

```txt
GOOGLE_SERVICE_ACCOUNT_JSON
GOOGLE_APPLICATION_CREDENTIALS
VARUNTOOLS_SHEET_ID
DRIVE_ASSET_FOLDER_ID
```

## 실행 순서

1. `npm run check:sheet-cms-auth`
2. `npm run sync:sheets`
3. `npm run sync:drive-assets`
4. `npm run generate:content-json`
5. `npm run validate:generated-content`
6. `npm run --if-present typecheck`
7. `npm run build`
8. generated files commit

## commit 대상

```txt
src/content/generated
src/content/pages/generated
src/content/pages/{pageFolder}/{pageId}/images
src/content/pages/{pageFolder}/{pageId}/media
```

`.sheet-cms-cache`는 commit 대상이 아니다.

## build 전/후 정책

```txt
sync/generate/validate/build 성공
→ generated commit

실패
→ commit 없음
```

빌드가 깨지는 generated 산출물은 repo에 남기지 않는다.

## deploy 관계

초기 추천은 역할 분리다.

```txt
publish-sheet-cms.yml
= Sheet CMS generated files commit

pages.yml
= main push를 받아 GitHub Pages deploy
```

즉, publish workflow가 generated commit을 push하면 기존 `pages.yml`이 배포를 맡는다.

## 중복 실행 방지

```yaml
concurrency:
  group: sheet-cms-publish
  cancel-in-progress: true
```

Apps Script 쪽 LockService와 GitHub Actions concurrency로 중복 게시를 이중 방어한다.

## 완료 기준

```txt
1. repository_dispatch로 실행 가능하다.
2. workflow_dispatch로 수동 실행 가능하다.
3. Google direct credential을 사용하지 않는다.
4. Apps Script gateway secrets만 사용한다.
5. .sheet-cms-cache를 commit하지 않는다.
6. generated public-safe 산출물만 commit한다.
7. validate 또는 build 실패 시 commit하지 않는다.
8. generated 변경이 없으면 정상 종료한다.
9. 자기 커밋으로 무한 재실행되지 않는다.
```

## 한 줄 계약

```txt
6번 베이크는 Apps Script Gateway에서 받은 임시 snapshot/assets를 public-safe generated files로 굽고, 검증과 빌드를 통과한 결과만 repo에 남기는 GitHub Actions 출판 파이프라인이다.
```

---

## Finalize step

After `Build` and `Commit generated content`, the workflow calls:

```bash
npm run finalize:sheet-cms
```

This step calls Apps Script action `finalize` with:

```txt
requestId
status=success
commitSha
actionRunUrl
publishedPageIds
```

The published page IDs are collected from `.sheet-cms-cache/raw/pages.raw.json`, `blocks.raw.json`, and `assets.raw.json`. This cache is not committed.

Apps Script then updates `publish_log`, archives matching staged rows to `published_archive`, and clears the original staged rows. If any earlier step fails, finalize is not called and the staging rows remain in the sheet for correction.
