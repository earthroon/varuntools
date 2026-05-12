# 05. validate:generated-content

## 목적

`validate:generated-content`는 Sheet CMS가 구운 public-safe generated JSON이 Vue renderer에 들어가도 안전한지 검사하는 최종 게이트다.

이 단계는 Google Sheet나 Apps Script를 직접 읽지 않는다. 입력은 repo에 남는 산출물뿐이다.

```txt
src/content/generated/pages.generated.json
src/content/generated/assets.generated.json
src/content/generated/settings.generated.json
src/content/generated/manifest.generated.json
  ↓
validate:generated-content
  ↓
src/content/generated/validation.generated.json
```

## 핵심 계약

```txt
raw snapshot은 검증 입력이 아니다.
.sheet-cms-cache는 임시 재료다.
repo에 남는 public-safe generated JSON만 검증한다.
error가 있으면 배포를 멈춘다.
```

## 명령어

```bash
npm run validate:generated-content
npm run smoke:validate-generated-content
```

다른 위치를 검사할 때:

```bash
node scripts/sheet-cms/validate-generated-content.mjs --dir .tmp/sheet-cms/generated
```

strict mode:

```bash
node scripts/sheet-cms/validate-generated-content.mjs --strict
```

## 검사 항목

- generated JSON 파일 존재 여부
- JSON parse 가능 여부
- top-level schema
- page id / slug 중복
- slug 안전성
- block id 중복
- block kind 지원 여부
- block kind별 필수 필드
- asset 참조 유효성
- compare before/after asset 유효성
- callout type/body 유효성
- CTA URL 안전성
- public leak 금지 키
- manifest count 일치
- 이미지 alt/accessibility warning
- SEO warning

## public leak 금지 키

아래 key가 public generated JSON에 남으면 error다.

```txt
driveFileId
memo
internalMemo
privateNote
adminOnly
GOOGLE_SERVICE_ACCOUNT_JSON
GITHUB_DISPATCH_TOKEN
GOOGLE_APPLICATION_CREDENTIALS
serviceAccount
private_key
client_email
spreadsheetId
spreadsheetUrl
```

## 출력

```txt
src/content/generated/validation.generated.json
```

예시:

```json
{
  "source": "validate:generated-content",
  "status": "success",
  "checked": {
    "pages": 1,
    "blocks": 5,
    "assets": 3
  },
  "warnings": [],
  "errors": []
}
```

## 완료 기준

```txt
1. validate:generated-content 명령이 존재한다.
2. validation.generated.json이 생성된다.
3. 정상 generated JSON은 success로 통과한다.
4. memo/driveFileId/private_key 같은 public leak은 실패한다.
5. compare/image/cover asset 참조가 깨지면 실패한다.
6. manifest count가 실제 count와 다르면 실패한다.
7. CTA javascript:/data: URL은 실패한다.
8. warning만 있으면 초기에는 통과한다.
```

## 한 줄 계약

```txt
validate:generated-content는 Sheet CMS generated JSON의 마지막 문지기이며, public에 나가면 안 되는 데이터와 Vue가 렌더링할 수 없는 구조를 배포 전에 멈춘다.
```
