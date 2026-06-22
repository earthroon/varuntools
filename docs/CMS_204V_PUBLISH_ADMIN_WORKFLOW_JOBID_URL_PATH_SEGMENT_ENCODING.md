# CMS-204V

## Publish Admin Workflow JobId URL Path Segment Encoding / Curl URL Malformed Guard And Debug-Safe Input Echo Seal

### SSOT

The `VACMS Publish Admin Content` workflow accepts `workflow_dispatch.inputs.job_id` and uses it as the VACMS publish job identifier. Before CMS-204V, the value could be concatenated directly into curl URL path strings such as `/content/publish-jobs/$JOB_ID/claim`. If the input contained whitespace, a copied request id, a dispatch correlation id, a slash, quote residue, or other URL-reserved/control characters, curl could fail before reaching the Worker API with:

```txt
curl: (3) URL rejected: Malformed input to a URL function
```

CMS-204V seals the workflow boundary by validating the job id, rejecting known non-job-id prefixes, deriving a safe URL path segment with `encodeURIComponent`, and rebinding all publish job curl URLs to `JOB_ID_PATH_SEGMENT`.

### Non-goals

- No VACMS D1 schema mutation.
- No change to publish job claim/export/finalize semantics.
- No bypass of `ADMIN_BRIDGE_TOKEN`.
- No adoption of `cms204k_*` dispatch correlation ids as publish job ids.
- No adoption of `ghdisp_*` request ids as publish job ids.
- No raw `job_id` echo in debug logs added by this seal.

### Acceptance seal

```txt
PASS_CMS_204V_PUBLISH_ADMIN_WORKFLOW_JOBID_URL_PATH_SEGMENT_ENCODING_CURL_URL_MALFORMED_GUARD_AND_DEBUG_SAFE_INPUT_ECHO_SEAL
```
