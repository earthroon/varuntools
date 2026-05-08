# Inquiry Worker-first Intake

Commit 120 switches inquiry submission from legacy Google Form-first intake to Worker-first intake.

## Purpose

The inquiry form now sends submissions to the Cloudflare Worker `/api/inquiries` endpoint by default. The Worker validates the request, stores it through the D1 inquiry storage contract, connects the record to the admin queue, and keeps the notification workflow available after storage.

Google Form remains available only as an infrastructure fallback. This commit is not a Google Form removal commit.

## Submit strategy

```ts
primaryTarget: 'worker'
fallbackPolicy: 'google-form-on-worker-error'
workerEndpoint: '/api/inquiries'
allowGoogleFormFallback: true
```

## Primary path

```txt
InquiryForm.vue
→ InquiryPayloadV1
→ submitInquiry()
→ submitInquiryToWorkerApi()
→ POST /api/inquiries
→ D1 inquiries
→ admin inquiry review queue
→ notification workflow
```

## Fallback path

Google Form fallback is allowed only when the Worker path has an infrastructure failure.

Allowed fallback cases:

```txt
Worker network error
Worker 5xx / SERVER_ERROR
Worker unavailable
Worker JSON response failure
```

Blocked fallback cases:

```txt
client validation failed
Worker validation failed
honeypot triggered
submit too fast
rate limited
```

검증 실패는 fallback 대상이 아니다. 인프라 장애만 fallback 대상이다.

## Result meanings

Worker success:

```txt
target = worker
fallbackUsed = false
persisted = true
storageMode = d1
```

Google Form fallback success:

```txt
target = google-form
fallbackUsed = true
persisted = false
storageMode = google-form
```

The UI must not present these two as the same state. Worker success means the inquiry was persisted into the system. Google Form fallback means the request was sent to an emergency intake path whose no-cors response body cannot be verified by the browser.

## UI copy

Worker success:

```txt
문의가 접수되었습니다. 검토 후 필요한 경우 입력해주신 연락처로 회신드릴게요.
```

Fallback success:

```txt
문의가 예비 접수 경로로 전송되었습니다. 확인까지 시간이 조금 더 걸릴 수 있습니다.
```

## Privacy and logging

Do not log full inquiry payloads when Worker submission fails.
Do not log message body or raw email during fallback.
Do not show `storageMode` or D1-specific language to end users.
Do not expose a public customer lookup route in this commit.

## Preserved contracts

```txt
Google Form adapter remains available.
Google Form config remains available.
D1 storage remains the persistent Worker path.
Admin queue remains private.
Notification workflow remains disabled-by-default for external delivery.
```
