# VarunTools Sheet CMS 02 — Apps Script Gateway Auth

## 목적

이 문서는 2번 재베이크 산출물이다. 기존 `GitHub Actions -> Google Sheets API / Drive API 직접 호출` 구조를 폐기하고, **Apps Script를 Google 권한 핸들러로 사용하는 gateway 구조**로 고정한다.

```txt
Google Spreadsheet = 작성 SSOT
Google Drive root/folder = 파일 원본 SSOT
Apps Script = Google 권한 핸들러 + 게시 버튼 + snapshot/assets gateway
GitHub Actions = Apps Script endpoint 호출자 + generated 산출물 커밋 담당
Vue = generated JSON 렌더러
```

## 확정 구조

```txt
GitHub Actions에는 Google API key, service account, Drive token을 심지 않는다.
Google Sheets / Drive 접근은 Apps Script 실행 권한에 귀속한다.
GitHub Actions는 Apps Script Web App URL과 shared secret만 가진다.
```

## GitHub Secrets

Repository: `earthroon/varuntools`

필수 Repository Secrets:

| Secret | 설명 |
|---|---|
| `APPS_SCRIPT_WEBAPP_URL` | 배포된 Apps Script Web App URL |
| `SHEET_CMS_SHARED_SECRET` | Apps Script와 GitHub Actions가 공유하는 호출 인증값 |

더 이상 필수가 아닌 값:

```txt
GOOGLE_SERVICE_ACCOUNT_JSON
GOOGLE_APPLICATION_CREDENTIALS
VARUNTOOLS_SHEET_ID
DRIVE_ASSET_FOLDER_ID
```

위 값들은 직접 Google API 호출 구조에서만 필요하다. Gateway 구조에서는 사용하지 않는다.

## Apps Script PropertiesService

Apps Script 프로젝트의 Script Properties에 저장한다. 시트 셀에 넣지 않는다.

| Property | 값 |
|---|---|
| `SHEET_CMS_SHARED_SECRET` | GitHub Secrets와 같은 긴 랜덤 문자열 |
| `GITHUB_DISPATCH_TOKEN` | repository_dispatch 호출용 GitHub token |
| `GITHUB_OWNER` | `earthroon` |
| `GITHUB_REPO` | `varuntools` |
| `GITHUB_EVENT_TYPE` | `publish-sheet-content` |

## Apps Script 권한

Apps Script가 담당한다.

```txt
Spreadsheet 읽기
Drive root/folder 파일 읽기
GitHub repository_dispatch 호출
publish_log 기록
```

Drive 에셋은 다음 방식으로 찾는다.

```txt
1. assets.driveFileId가 있으면 DriveApp.getFileById(driveFileId)
2. driveFileId가 없고 driveFileName/fileName이 있으면 Drive root에서 이름으로 검색
3. 둘 다 없으면 assetId 이름으로 Drive root 검색
```

초기 추천은 여전히 `driveFileId`를 쓰는 것이다. 단, 선배가 원한 root folder 기반 운영을 위해 파일명 fallback도 지원한다.

## 로컬 점검

```bash
npm run check:sheet-cms-auth
```

점검 항목:

```txt
APPS_SCRIPT_WEBAPP_URL 존재 여부
SHEET_CMS_SHARED_SECRET 존재 여부
GitHub dispatch property 참고값
직접 Google credential 사용 여부 경고
.gitignore secret 보호 패턴
```

## 보안 규칙

```txt
Google API credential은 repo에 두지 않는다.
Google API credential은 GitHub Secrets에도 두지 않는다.
GitHub Actions는 Apps Script endpoint만 호출한다.
SHEET_CMS_SHARED_SECRET은 Apps Script PropertiesService와 GitHub Secrets에만 둔다.
GITHUB_DISPATCH_TOKEN은 Apps Script PropertiesService에만 둔다.
토큰/secret은 Logger.log, workflow log, publish_log에 남기지 않는다.
```

## 한 줄 계약

```txt
2번 재베이크는 Google 접근 권한을 Apps Script에 봉인하고, GitHub Actions는 Apps Script gateway만 호출하도록 인증 경계를 재설정한다.
```
