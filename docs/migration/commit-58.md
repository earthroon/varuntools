# Commit 58 Migration — Inquiry Google Form Wiring / Receipt UX

## Summary

Commit 58 keeps the Commit 57 inquiry form UI and strengthens the actual intake wiring layer.

Added:

```txt
scripts/smoke-inquiry-google-form.mjs
docs/authoring/inquiry-google-form.md
docs/migration/commit-58.md
BAKE_REPORT_COMMIT_58.md
```

Updated:

```txt
src/config/inquiryForm.ts
src/types/inquiry.ts
src/utils/inquirySubmit.ts
src/utils/inquiryValidation.ts
src/components/InquiryForm.vue
package.json
scripts/check-launch.mjs
docs/authoring/inquiry.md
docs/authoring/launch-checklist.md
```

## Behavior change

- `inquiryFormConfig` now validates `formResponse` URLs and `entry.xxxxx` mappings.
- `viewform` URLs are treated as invalid for submission wiring.
- `honeypot` is supported as an optional mapping and blocks suspicious submissions before Google Form submission.
- The form displays whether it is in preview/mock mode or connected Google Form mode.
- The success copy says “접수 요청 완료” instead of claiming a fully verified receipt.
- The UI explicitly states that inquiry lookup is not available.

## SSOT

```txt
Inquiry field SSOT: src/types/inquiry.ts
Validation SSOT: src/utils/inquiryValidation.ts
Submit adapter SSOT: src/utils/inquirySubmit.ts
Google Form config SSOT: src/config/inquiryForm.ts
Rendered UI SSOT: src/components/InquiryForm.vue
Receiving inbox SSOT: Google Form response sheet
```

## Verification

```bash
npm run smoke:inquiry-form
npm run smoke:inquiry-google-form
npm run validate:content
npm run typecheck
npm run build
```
