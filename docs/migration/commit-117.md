# Commit 117 — D1-backed inquiry storage

Commit 117 adds D1-backed inquiry storage for the Worker-first inquiry intake path.

The contract introduces inquiries and inquiry_events tables, status/priority/event models, hashed client IP handling, and a storage adapter boundary that can return persisted: true for D1 writes or mock mode for non-D1 contexts.
