# BAKE REPORT — Commit 117

## Seal

Commit 117 seals the D1 저장소와 상태 모델 커밋 for VARUNTOOLS inquiry intake.

## Scope

- D1-backed inquiry storage contract
- inquiries / inquiry_events schema
- status, priority, and event model
- hashed IP storage via requestIpHash / sha256Hex
- persisted: true and storageMode: d1 response contract
- fail-closed SERVER_ERROR on storage failure

## Non-goals

- No admin inquiry UI adoption before Commit 118
- No Google Form fallback removal
- No raw IP persistence
