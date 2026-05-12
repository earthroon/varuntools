# 07. sync:drive-assets Apps Script Gateway asset sync

## 목적

`sync:drive-assets`는 Google Drive의 원본 파일을 VarunTools 페이지 폴더 안의 정적 에셋으로 등록한다.

이 단계에서 GitHub Actions는 Google Drive API를 직접 호출하지 않는다. Drive 접근 권한은 Apps Script Gateway에 있고, Actions는 Apps Script가 넘긴 asset payload만 받아 페이지별 `images/` 또는 `media/` 폴더에 저장한다.

```txt
Google Drive root/pageId folder
  ↓
Apps Script Gateway
  ↓
GitHub Actions sync:drive-assets
  ↓
src/content/pages/{pageFolder}/{pageId}/images/{assetId}.webp
src/content/generated/drive-assets.generated.json
```

## 핵심 계약

```txt
Google Drive 원본 = Drive root/pageId 폴더
asset 연결 기준 = assets 시트
Google 접근 핸들 = Apps Script
repo 파일 위치 = src/content/pages/{pageFolder}/{pageId}/images|media
이미지 출력 = WebP
대용량 영상 = base64 payload 전송 제외
```

`public/assets/generated`는 이 구조에서 기본 출력 위치가 아니다. VarunTools 현재 콘텐츠 트리의 SSOT는 페이지 폴더다.

```txt
src/content/pages/works/editorial-showcase/index.md
src/content/pages/works/editorial-showcase/images/
src/content/pages/works/editorial-showcase/media/
```

## Drive 폴더 규칙

Drive root 아래에 `pageId`와 같은 이름의 폴더를 둔다.

```txt
My Drive
  ├─ editorial-showcase
  │   ├─ cover.png
  │   ├─ before.jpg
  │   └─ after.jpg
  └─ varuntools-showroom
      ├─ cover.png
      └─ sample-01.png
```

`assets` 시트의 `pageId`는 이 폴더명과 일치해야 한다.

## GitHub 저장 경로 규칙

기본 출력 경로:

```txt
src/content/pages/{pageFolder}/{pageId}/{assetSubdir}/{assetId}.{ext}
```

이미지:

```txt
src/content/pages/works/{pageId}/images/{assetId}.webp
```

작은 파일/PDF:

```txt
src/content/pages/works/{pageId}/media/{assetId}.pdf
```

manifest의 `src`는 페이지 기준 상대 경로로 남긴다.

```txt
./images/{assetId}.webp
./media/{assetId}.pdf
```

## page type → folder 매핑

`assets.pageId`를 `pages.pageId`와 매칭해 `pages.type`을 얻고, 그 값을 페이지 폴더로 변환한다.

초기 매핑:

```txt
work       → works
product    → products
commission → works
catalog    → works
tool       → works
lab        → lab-markdown-gallery
doc        → guide
page       → pages
```

`assets` 시트에서 `pageFolder` 또는 `categoryFolder`를 명시하면 이 값을 우선한다.

## assets 시트 권장 컬럼

```txt
pageId
assetId
visible
fileName
driveFileId
type
role
alt
caption
localPath
mimeType
assetMode
externalUrl
pageFolder
memo
```

핵심 컬럼:

| column | role |
|---|---|
| `pageId` | Drive root 아래 폴더명이며 GitHub 페이지 폴더명 |
| `assetId` | 출력 파일명 기준 |
| `fileName` | pageId 폴더 안에서 찾을 원본 파일명 |
| `driveFileId` | 예외적 직접 지정. 있으면 최우선 |
| `type` | image / file / video |
| `assetMode` | inline / external / video-large |
| `externalUrl` | video-large/external의 public URL |
| `pageFolder` | works/products 등 출력 폴더 override |

## 파일 검색 우선순위

Apps Script Gateway는 다음 순서로 파일을 찾는다.

```txt
1. driveFileId가 있으면 DriveApp.getFileById(driveFileId)
2. pageId + fileName이 있으면 Drive root/pageId/fileName 검색
3. pageId + assetId가 있으면 Drive root/pageId 폴더에서 basename 검색
4. fileName만 있으면 Drive root에서 검색
5. assetId만 있으면 Drive root에서 검색
```

운영 기본값은 2번이다.

```txt
pageId + fileName
```

## Apps Script Properties

선택값:

```txt
DRIVE_ASSET_ROOT_FOLDER_ID
```

이 값이 있으면 My Drive root 대신 해당 폴더를 asset root로 사용한다. 없으면 `DriveApp.getRootFolder()`를 사용한다.

## assetMode 정책

### inline

이미지나 작은 PDF처럼 payload로 받아 repo에 저장할 수 있는 파일.

```txt
Apps Script base64 payload
→ Actions buffer 복원
→ image면 WebP 변환
→ src/content/pages/{pageFolder}/{pageId}/images 저장
```

### video-large

대용량 영상용. payload로 받지 않는다.

```txt
base64 요청 안 함
externalUrl/embedUrl/localPath를 src로 사용
manifest에 external=true 기록
```

### external

이미 외부 CDN/R2/YouTube/Vimeo 등에 올라간 asset.

```txt
파일 다운로드 없음
src만 manifest에 기록
```

## 이미지 최적화

이미지는 원본 MIME과 상관없이 WebP로 변환한다.

```txt
Drive:  editorial-showcase/cover.png
Repo:   src/content/pages/works/editorial-showcase/images/cover_main.webp
JSON:   ./images/cover_main.webp
```

원본은 repo에 저장하지 않는다.

```txt
원본 = Google Drive
사이트용 결과물 = WebP
```

## npm scripts

```json
{
  "scripts": {
    "sync:drive-assets": "node scripts/sheet-cms/sync-appscript-assets.mjs",
    "smoke:appscript-assets": "node scripts/sheet-cms/smoke-appscript-assets.mjs"
  }
}
```

## GitHub Actions commit 대상

`publish-sheet-cms.yml`은 generated JSON과 page-owned assets를 커밋한다.

```txt
git add src/content/generated src/content/pages
```

`.sheet-cms-cache`는 임시 작업 재료라 커밋하지 않는다.

## 완료 기준

```txt
1. assets.pageId를 기준으로 Drive root/pageId 폴더에서 파일을 찾는다.
2. pages.raw.json 또는 기존 pages.generated.json으로 page type을 resolve한다.
3. work asset은 src/content/pages/works/{pageId}/images에 저장된다.
4. image asset은 WebP로 변환된다.
5. manifest src는 ./images/{assetId}.webp 형태다.
6. 대용량 영상은 base64 payload로 받지 않는다.
7. driveFileId / base64 / secret은 manifest에 남지 않는다.
8. smoke:appscript-assets가 통과한다.
```

## 한 줄 계약

```txt
work 에셋은 works 폴더 밖으로 새지 않고, pageId에 귀속된 images/media 서랍 안에 저장된다.
```
