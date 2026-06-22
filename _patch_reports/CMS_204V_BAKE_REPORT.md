# CMS-204V Bake Report

## Patch

`CMS-204V — Publish Admin Workflow JobId URL Path Segment Encoding / Curl URL Malformed Guard And Debug-Safe Input Echo Seal`

## Target

`earthroon/varuntools`

## Target files

- `.github/workflows/publish-admin-content.yml`
- `scripts/cms-204v-publish-admin-workflow-jobid-url-guard.mjs`
- `docs/CMS_204V_PUBLISH_ADMIN_WORKFLOW_JOBID_URL_PATH_SEGMENT_ENCODING.md`
- `_patch_reports/CMS_204V_BAKE_REPORT.md`
- `artifacts/cms/CMS_204V_PUBLISH_ADMIN_WORKFLOW_JOBID_URL_PATH_SEGMENT_ENCODING.json`

## Implemented seal

- Adds non-smoke `Prepare safe publish job URL segment` step.
- Rejects empty job ids, `cms204k_*`, `ghdisp_*`, control characters, whitespace, path separators, quotes, and URL-reserved characters.
- Computes `JOB_ID_PATH_SEGMENT` with `encodeURIComponent`.
- Uses `JOB_ID_PATH_SEGMENT` for claim/export/finalize curl URL paths.
- Converts dry visibility step-summary `jobId` output to debug-safe length/hash form.
- Writes a PASS/FAIL JSON receipt under `artifacts/cms/`.

## Local apply

```powershell
.\CMS_204V_APPLY_LOCAL.ps1 "D:\11124\dd\varuntools"
```
