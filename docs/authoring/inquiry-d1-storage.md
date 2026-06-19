# Inquiry D1 Storage Contract

Commit 117 seals the inquiry Worker storage boundary.

- Validated inquiries are stored through D1 when INQUIRY_STORAGE_MODE=d1.
- A successful D1 write returns persisted: true and storageMode: d1.
- Mock storage remains available for local or degraded execution.

## Privacy and logging rules

The Worker stores ip_hash rather than a raw IP address. The stored payload_json is the normalized request payload used for audit and operator review.
