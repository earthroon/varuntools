
# Commit 70 — R2 Upload Tooling / Product File Publish Flow

Adds private product file staging, R2 upload planning, dry-run publish, explicit manifest sealing, and deliverable verification.

Important boundary:

```txt
r2:publish = upload only, no manifest mutation
r2:seal    = manifest mutation, explicit only
```
