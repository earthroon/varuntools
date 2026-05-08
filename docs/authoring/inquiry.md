# Inquiry Authoring

Commit 57 adds a public inquiry page and a Markdown-mounted inquiry form.

```md
::inquiry-form
title: 문의하기
intro: 닉네임과 제출 확인용 코드를 입력한 뒤 문의를 남겨주세요.
requireNickname: true
requireGateCode: true
requireEmail: false
submitLabel: 문의 남기기
::
```

## Field contract

| Field | Required | Notes |
| --- | --- | --- |
| `nickname` | yes | 2-24 characters. Anonymous inquiries are not accepted. |
| `gateCode` | yes | 4-40 characters. This is a submission friction code, not an account password. |
| `category` | yes | `product`, `commission`, `support`, `collaboration`, or `general`. |
| `relatedProductSlug` | no | Optional product/page slug or label. |
| `title` | yes | 2-80 characters. |
| `message` | yes | 10-2000 characters. |
| `email` | no | Optional. Needed only when a direct reply is expected. |
| `consent` | yes | Required before submit. |

## Google Form mapping

The mapping lives in `src/config/inquiryForm.ts`.

```ts
export const inquiryFormConfig = {
  enabled: false,
  actionUrl: '',
  fields: {
    nickname: '',
    gateCode: '',
    category: '',
    relatedProductSlug: '',
    title: '',
    message: '',
    email: '',
    consent: '',
  },
}
```

When `enabled`, `actionUrl`, and the required `entry.xxxxx` field IDs are filled, the form submits with `fetch(..., { mode: 'no-cors' })`. Because `no-cors` cannot confirm the response body, the UI says the inquiry was requested, not definitively stored.

When the Google Form config is incomplete, the form uses mock mode and does not send data anywhere.

## Safety boundary

`gateCode` is not a login password, not a lookup key, and not an authentication value in Commit 57. Do not save it in local storage, session storage, public JSON, Markdown, or generated content files.

Future commits may add a real backend boundary with Cloudflare Worker, D1/KV, Turnstile, and hashed lookup credentials.

## Commit 58 — Google Form wiring

Commit 58 keeps the front-end form and connects the submission adapter to a stricter Google Form wiring contract.

The active intake settings remain in:

```txt
src/config/inquiryForm.ts
```

Additional config rules:

```txt
- `actionUrl` must be a Google Form `formResponse` URL.
- `viewform` URLs are not valid submission endpoints.
- Required mappings must use the `entry.xxxxx` format.
- Optional mappings may be blank.
- `honeypot` may be blank if the Google Form does not include that field.
```

Run:

```bash
npm run smoke:inquiry-google-form
```

The UI intentionally says “문의 접수 요청이 완료되었습니다.” Google Form uses `no-cors`, so the browser cannot strictly verify the response body.

The inquiry page also tells users that the site does not currently provide inquiry lookup. If they need a copy, they should keep the content before submission.


## Commit 59 — Inquiry response workflow

After Google Form receives inquiries, operators should triage responses in the linked Google Sheet using:

```txt
docs/ops/inquiry-response-workflow.md
docs/ops/inquiry-sheet-columns.csv
docs/templates/inquiry-reply-templates.md
```

Run:

```bash
npm run smoke:inquiry-response-workflow
```

The workflow keeps `gateCode` as a submission friction value only. It must not be used for login, inquiry lookup, authentication, or user verification.


## Commit 115 — Intake contract hardening

Commit 115 does not turn inquiry into a public board. It keeps the existing private Google Form intake and hardens the contract before a future Worker/D1 backend.

### Validation options

`::inquiry-form` props now map into `InquiryValidationOptions`:

```txt
requireNickname
requireGateCode
requireEmail
```

This means a directive can intentionally relax nickname or confirmation-code requirements without fighting a hardcoded validator. The default `/inquiry` page still uses:

```txt
requireNickname: true
requireGateCode: true
requireEmail: false
```

### Confirmation code boundary

`gateCode` remains the internal/legacy field name. In user-facing UI it is described as “제출 확인 코드”. It is not a login password, not an inquiry lookup password, not an authentication token, and not user verification.

### Query prefill

The page can receive context through query parameters:

```txt
/inquiry?category=product&ref=products/dummy-catalog
/inquiry?type=commission&ref=/works/varuntools-showroom
```

Supported hints:

```txt
category or type
ref, relatedProductSlug, or product
```

Query values are hints only. They are always validation targets and are not trusted as server-side truth.

### Submit guard

Client-side guard rails now include:

```txt
minimum submit delay: 1500ms
duplicate payload fingerprint guard
honeypot guard
```

These are only client-side friction. A future Cloudflare Worker API must repeat validation server-side.

### Versioned payload

`InquiryPayloadV1` records normalized draft data, source path, source URL, and optional prefill context. Google Form remains the current adapter, but Worker/D1 can reuse this payload contract later.

Run:

```bash
npm run smoke:inquiry-intake-contract
```
