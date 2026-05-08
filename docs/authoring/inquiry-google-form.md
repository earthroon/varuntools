# Inquiry Google Form Wiring

Commit 58 connects the `/inquiry` form contract to a Google Form intake endpoint.

This is not a database, login system, or inquiry lookup feature. Google Form is the receiving inbox. The site only sends a submission request.

## 1. Create the Google Form

Create a Google Form with these questions:

| Site field | Google Form question suggestion | Required |
| --- | --- | --- |
| `nickname` | 닉네임 | yes |
| `gateCode` | 제출 확인 코드 | yes |
| `category` | 문의 유형 | yes |
| `relatedProductSlug` | 관련 상품/페이지 | no |
| `title` | 제목 | yes |
| `message` | 문의 내용 | yes |
| `email` | 이메일 | no |
| `consent` | 문의 처리를 위한 정보 이용 동의 | yes |
| `honeypot` | 웹사이트 | no |

The question labels can change. The website does not trust labels. It only trusts the `entry.xxxxx` mapping.

## 2. Find the `formResponse` action URL

The action URL should look like this:

```txt
https://docs.google.com/forms/d/e/{FORM_ID}/formResponse
```

Do not paste the public `viewform` URL into the config. `viewform` is for humans opening the form page; `formResponse` is for submission requests.

## 3. Find each `entry.xxxxx` id

Use the Google Form preview page and inspect the form fields. Each answer field has a name like:

```txt
entry.1234567890
```

Copy the correct `entry.xxxxx` values into `src/config/inquiryForm.ts`.

## 4. Configure the site

```ts
export const inquiryFormConfig = {
  enabled: true,
  actionUrl: 'https://docs.google.com/forms/d/e/{FORM_ID}/formResponse',
  fields: {
    nickname: 'entry.1111111111',
    gateCode: 'entry.2222222222',
    category: 'entry.3333333333',
    relatedProductSlug: 'entry.4444444444',
    title: 'entry.5555555555',
    message: 'entry.6666666666',
    email: 'entry.7777777777',
    consent: 'entry.8888888888',
    honeypot: '',
  },
}
```

Required mappings:

```txt
nickname
gateCode
category
title
message
consent
```

Optional mappings:

```txt
relatedProductSlug
email
honeypot
```

If `honeypot` is not present in the Google Form, leave it blank. The form still blocks filled honeypot values before sending.

## 5. Run the smoke test

```bash
npm run smoke:inquiry-google-form
```

This checks the config shape, `formResponse`/`viewform` guard, required `entry.xxxxx` mapping contract, honeypot support, and gateCode storage boundaries.

## 6. Test one real submission

After setting `enabled: true`, submit one test inquiry from `/inquiry`, then confirm that the Google Form response sheet receives it.

Google Form submission uses `fetch(..., { mode: 'no-cors' })`. The browser cannot strictly read the response body, so the UI must say:

```txt
문의 접수 요청이 완료되었습니다.
```

Do not phrase it as a fully verified database receipt.

## Safety boundary

`gateCode` is a submission friction value only.

It is not:

```txt
- a login password
- an inquiry lookup password
- an authentication token
- a security boundary
```

Do not store it in `localStorage`, `sessionStorage`, URL query strings, generated Markdown, `search-index.json`, or console output.

## Inquiry lookup

Commit 58 does not provide inquiry lookup. The form tells users:

```txt
현재 문의글 조회 기능은 제공하지 않습니다.
필요한 경우 제출 전 내용을 복사해 보관해주세요.
```

## Smoke keywords

```txt
Google Form 만들기
entry id
접수 요청 완료
```


## Commit 59 — Sheet triage workflow

Once the Google Form response Sheet is receiving inquiries, add the operating columns from:

```txt
docs/ops/inquiry-sheet-columns.csv
```

Then process rows using:

```txt
docs/ops/inquiry-response-workflow.md
```

Reply copy starts from:

```txt
docs/templates/inquiry-reply-templates.md
```

Recommended launch check:

```bash
npm run smoke:inquiry-response-workflow
```

This is still a manual Google Sheet workflow. It does not add Google Sheets API integration, Apps Script automation, Cloudflare Worker, D1, KV, automatic email, or inquiry lookup.


## Commit 115 — Intake contract hardening

Commit 115 keeps the Google Form adapter but tightens the intake contract. The UI uses “제출 확인 코드” and avoids password wording so users do not mistake `gateCode` for a login password, lookup password, authentication token, or security boundary.

Google Form still uses `fetch(..., { mode: 'no-cors' })`, so the browser cannot verify the response body. The success copy must remain request-based:

```txt
문의 접수 요청이 완료되었습니다.
```

The form now builds `InquiryPayloadV1` internally so a future Cloudflare Worker/D1 adapter can reuse the same normalized draft and context without treating Google Form as the only backend.
