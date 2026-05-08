# Commit 120 Migration — Worker-first Inquiry Intake

## Commit

```txt
refactor(inquiry): switch to Worker-first inquiry intake
```

## 기준

Commit 119 notification and reply workflow is preserved.

## 변경

```txt
Worker submit adapter promoted to primary intake path
Google Form adapter preserved as fallback
Submit strategy added
Fallback policy added
Worker success response mapped to persisted: true
Google Form fallback response mapped to persisted: false
Submit UI copy updated
Admin queue connection documented
smoke:inquiry-worker-first-intake added
```

## Config migration

Before:

```ts
inquiryWorkerApiConfig.enabled = false
```

After:

```ts
inquiryWorkerApiConfig.enabled = true
```

The new submit strategy is:

```ts
primaryTarget: 'worker'
fallbackPolicy: 'google-form-on-worker-error'
workerEndpoint: '/api/inquiries'
allowGoogleFormFallback: true
```

## Fallback rules

Google Form fallback is allowed only for Worker infrastructure failure.

It is not used for:

```txt
VALIDATION_FAILED
HONEYPOT_TRIGGERED
SUBMIT_TOO_FAST
RATE_LIMITED
```

Google Form 삭제 커밋이 아니다. Google Form remains the emergency intake path.

## Operational notes

Production still needs the real Cloudflare route, D1 database ID, and admin Access boundary to be configured outside this repository bake.
