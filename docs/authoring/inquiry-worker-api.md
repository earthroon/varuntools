# Inquiry Worker API Contract

Commit 116 adds the Cloudflare Worker inquiry intake contract without replacing the existing Google Form intake path.

## Scope

The Worker receives and validates inquiry payloads through a JSON endpoint:

```txt
POST /api/inquiries
Content-Type: application/json
```

This commit is an API contract commit. It does not create D1 storage, an admin review queue, notification delivery, or a public board. D1 저장 is reserved for Commit 117.

## Request

```ts
type InquiryApiRequestV1 = {
  version: 1
  submittedAt: string
  sourcePath: string
  sourceUrl?: string
  draft: InquiryDraft
  context?: {
    ref?: string
    categoryFromQuery?: string
    prefilled: boolean
  }
  clientGuard?: {
    formMountedAt?: number
    submitStartedAt?: number
    minimumSubmitDelayMs?: number
    fingerprint?: string
  }
}
```

`clientGuard` is a spam/friction hint only. It is not the security SSOT. The Worker must generate its own receive-time state in later commits when persistence or rate-limit storage is introduced.

## Response

Commit 116 validates and acknowledges receipt, but it does not persist the inquiry.

```ts
type InquiryApiResponse =
  | {
      ok: true
      inquiryId: string
      status: 'received'
      persisted: false
      message: string
    }
  | {
      ok: false
      errorCode:
        | 'VALIDATION_FAILED'
        | 'HONEYPOT_TRIGGERED'
        | 'SUBMIT_TOO_FAST'
        | 'RATE_LIMITED'
        | 'SERVER_ERROR'
      message: string
      fieldErrors?: Record<string, string>
    }
```

`persisted: false` is intentional. It prevents Commit 116 from pretending that D1 storage already exists.

## CORS

The Worker responds to preflight requests:

```txt
OPTIONS /api/inquiries
204 No Content
```

Required headers:

```txt
Access-Control-Allow-Origin: configured origin
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
Vary: Origin
```

Default allowed origins:

```txt
https://varun.tools
http://localhost:5173
http://localhost:4173
```

## Frontend adapter

The frontend keeps the Google Form adapter available. Commit 116 adds a Worker adapter behind disabled config:

```ts
export const inquiryWorkerApiConfig = {
  enabled: false,
  endpoint: '/api/inquiries',
}
```

Default behavior remains unchanged. Google Form is not deleted and remains the active/fallback intake path until the Worker-first migration in Commit 120.

## Follow-up commits

```txt
117 D1 inquiry storage and status model
118 admin inquiry review queue
119 notification and reply workflow
120 Worker-first inquiry intake migration
```
