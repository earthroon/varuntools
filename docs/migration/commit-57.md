# Commit 57 Migration — Inquiry Form UI / Google Form Intake Gate

## Added

- `/inquiry` content page
- `::inquiry-form` Markdown directive
- `InquiryForm.vue` UI component
- `src/types/inquiry.ts`
- `src/utils/inquiryValidation.ts`
- `src/utils/inquirySubmit.ts`
- `src/config/inquiryForm.ts`
- `npm run smoke:inquiry-form`

## Behavior

The inquiry form requires nickname, submission gate code, category, title, message, and consent. Email is optional.

Google Form submission is configuration gated. If `src/config/inquiryForm.ts` is not fully configured, the form stays in mock mode and shows a preview-mode success message.

## Boundary

The field shown to users as a submission password is internally named `gateCode`. It is a friction field only. It is not stored as an account password, hash, or lookup credential in Commit 57.

## Verification

```bash
npm run smoke:inquiry-form
npm run validate:content
npm run typecheck
node node_modules/vite/bin/vite.js build
```
