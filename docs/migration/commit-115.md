# Commit 115 Migration — Inquiry intake contract hardening

## Commit

```txt
refactor(inquiry): harden existing inquiry intake contract
```

## Scope

Commit 115 keeps the existing private Google Form inquiry intake and hardens the contract before a future Worker/D1 backend.

## Changed

```txt
- validateInquiryDraft now accepts InquiryValidationOptions.
- InquiryForm passes requireNickname / requireGateCode / requireEmail into validation.
- User-facing gateCode label is now “제출 확인 코드”.
- query prefill supports category/type and ref/product/relatedProductSlug.
- client submit guard adds minimum delay, duplicate fingerprint, and honeypot blocking.
- InquiryUiState and InquiryPayloadV1 contracts were added.
- Google Form no-cors success copy remains request-based.
- check:launch now includes inquiry smoke scripts.
```

## SSOT

```txt
src/content/pages/inquiry/index.md
InquiryForm directive props
InquiryDraft
Google Form config
```

## Not included

```txt
Cloudflare Worker API
D1/KV storage
public inquiry board
admin inquiry queue
automatic email sending
inquiry lookup password
```

## Verification

```bash
npm run smoke:inquiry-intake-contract
npm run smoke:inquiry-form
npm run smoke:inquiry-google-form
npm run smoke:inquiry-response-workflow
```
