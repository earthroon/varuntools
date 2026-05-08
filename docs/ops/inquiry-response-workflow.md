# Inquiry Response Workflow

Commit 59 fixes the operations language for inquiries received through Google Form and handled in the linked Google Sheet.

This document is an operations guide, not a public policy page and not an admin application. It does not add inquiry lookup, Cloudflare Worker, D1, KV, Google Sheets API integration, Apps Script automation, automatic email sending, login, or a site admin dashboard.

## Scope

```txt
Visitor inquiry
→ Google Form response
→ Google Sheet row
→ manual triage
→ reply / wait / close / archive
```

## Status values

Use these values in the `opsStatus` column.

| Status | Meaning | Typical next action |
| --- | --- | --- |
| `new` | The row is newly received and has not been checked. | Review category, message, and reply need. |
| `triaged` | The row has been reviewed and classified. | Decide whether a reply is needed. |
| `needs-reply` | The inquiry needs a reply. | Reply through email or another available channel. |
| `replied` | A reply has been sent. | Record `repliedAt` and a short `publicReplySummary`. |
| `waiting-user` | More information was requested and the user has not answered yet. | Wait or close later. |
| `closed` | The inquiry is finished. | Record `closedAt`. |
| `spam` | The inquiry is spam, abusive, automated, or unusable. | Do not reply; keep only minimal notes. |
| `archived` | The inquiry is kept for long-term reference. | Move out of the active response queue. |

Default for a newly received row: `new`.

## Priority values

Use these values in the `opsPriority` column.

| Priority | Use when |
| --- | --- |
| `low` | Feedback, light general messages, non-urgent notes. |
| `normal` | Ordinary product questions, simple commission inquiries. |
| `high` | Purchase-adjacent questions, scheduled commissions, serious collaboration proposals. |
| `urgent` | Payment, delivery, download, rights, privacy, data, or serious support issues. |

Default priority: `normal`.

## Reply need values

Use these values in the `replyNeed` column.

| Reply need | Use when |
| --- | --- |
| `not-needed` | The inquiry only needs a record. |
| `optional` | A reply is nice but not mandatory. |
| `required` | Purchase, commission, support, privacy, or problem reports need a reply. |

Email is optional on the public form. If `replyNeed` is `required` but no email exists, check whether the message includes another channel. If no channel is available, set `replyChannel` to `unavailable` and do not mark the row as `replied`.

## Reply channel values

```txt
email
external
unavailable
none
```

## Category workflows

### product

1. Check `relatedProductSlug` if present.
2. Check product status: `available`, `coming-soon`, `sold-out`, or hidden/draft state.
3. Check the product page, price visibility, delivery note, refund note, and digital download note.
4. Set `replyNeed` to `required` for purchase-adjacent questions.
5. Include product and policy links when replying.
6. Do not promise stock, delivery, refund, or discount terms before confirming them.

### commission

1. Check scope, deadline, intended use, budget, and deliverables.
2. If anything essential is missing, use the additional-information template.
3. Do not confirm acceptance, price, or schedule before review.
4. Set `opsPriority` to `high` when the deadline is close or the request is commercially important.

### support

1. Classify whether the issue concerns payment, download, delivery, rights, privacy, or a site error.
2. Use `urgent` for payment, privacy, rights, or data issues.
3. Avoid copying sensitive data into `internalMemo` unless necessary.
4. Close only after the action is finished or no reply channel exists.

### collaboration

1. Identify the proposer and purpose.
2. Review project scope, schedule, and outbound links carefully.
3. Set `replyNeed` to `optional` or `required` depending on relevance.
4. Do not commit to collaboration until manually reviewed.

### general

1. Decide whether the message is informational, feedback, or a request.
2. Use `not-needed` for simple notes.
3. Use `archived` for useful long-term feedback.
4. Use `spam` for automated or abusive entries.

## Daily operating rhythm

```txt
1. Filter opsStatus = new.
2. Fill opsPriority and replyNeed.
3. If replyNeed = required, choose replyChannel.
4. Assign owner if more than one operator exists.
5. Reply or request more information.
6. Record repliedAt / publicReplySummary / nextAction.
7. Move completed rows to closed, spam, or archived.
```

## Privacy and security boundary

The public form uses `gateCode` as a submission friction value only.

```txt
gateCode is not a login password.
gateCode is not an inquiry lookup password.
gateCode is not an authentication token.
gateCode is not a security boundary.
gateCode must not be used for user verification.
```

If the Google Form receives `gateCode`, operators must not treat it as proof of identity. Do not ask users to enter personal account passwords. Do not copy `gateCode` into public replies or long-term notes.

Avoid storing unnecessary sensitive personal data in `internalMemo`. Use the minimum information needed to process the inquiry.

## Explicit non-goals

Commit 59 does not implement:

```txt
Cloudflare Worker
D1
KV
Google Sheets API
Apps Script automation
automatic email sending
inquiry lookup
user authentication
admin dashboard
gateCode-based verification
```

Those belong to later commits with a real backend and security boundary.


## Commit 115 intake note

The site-facing UI calls `gateCode` a confirmation code, not a password. The field is still a submission friction value only. It must not be used for login, lookup, authentication, or user verification. Query prefill values such as `category` and `ref` are hints only and should be checked during triage.
