# CMS-204W Publish Admin Workflow Failure Finalize

## Scope

CMS-204W seals the failure path for `VACMS Publish Admin Content` after CMS-204V job id URL path segment encoding.

## Contract

- Preserve CMS-204V `JOB_ID_PATH_SEGMENT` URL usage.
- Initialize publish workflow marker files for non-smoke runs.
- Mark claim/export/materialize/build/deploy/success finalize stages.
- Add `Finalize VACMS publish failure` for `failure() && publish_mode != cms-dispatch-visibility-smoke`.
- Skip failure finalize when claim did not happen.
- Skip failure finalize when success finalize already happened.
- Use `bridge_failed` for claimed job runtime failure finalization.
- Upload failure receipts and marker files as part of `vacms-publish-<job_id>` artifact.

## PASS

`PASS_CMS_204W_PUBLISH_ADMIN_WORKFLOW_FAILURE_FINALIZE_CLAIMED_JOB_ERROR_RECEIPT_AND_ALWAYS_ARTIFACT_SEAL`
