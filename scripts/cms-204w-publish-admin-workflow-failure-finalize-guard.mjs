import fs from 'node:fs'
import path from 'node:path'

const STATUS = 'PASS_CMS_204W_PUBLISH_ADMIN_WORKFLOW_FAILURE_FINALIZE_CLAIMED_JOB_ERROR_RECEIPT_AND_ALWAYS_ARTIFACT_SEAL'
const FAIL_STATUS = `FAIL_${STATUS}`

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd()
const workflowPath = path.join(root, '.github', 'workflows', 'publish-admin-content.yml')
const receiptPath = path.join(root, 'artifacts', 'cms', 'CMS_204W_PUBLISH_ADMIN_WORKFLOW_FAILURE_FINALIZE.json')

const exists = (filePath) => fs.existsSync(filePath)
const workflow = exists(workflowPath) ? fs.readFileSync(workflowPath, 'utf8') : ''
const failureStepStart = workflow.indexOf('- name: Finalize VACMS publish failure')
const uploadStepStart = workflow.indexOf('- name: Upload VACMS publish receipts')
const failureStepText = failureStepStart >= 0 && uploadStepStart > failureStepStart ? workflow.slice(failureStepStart, uploadStepStart) : ''
const uploadStepText = uploadStepStart >= 0 ? workflow.slice(uploadStepStart) : ''
const rawFailureFinalizeUrl = /curl[\s\S]*\$ADMIN_API_BASE\/content\/publish-jobs\/\$JOB_ID\/finalize/.test(failureStepText)

const checks = {
  workflow_exists: exists(workflowPath),
  cms204v_job_id_path_segment_preserved: workflow.includes('Prepare safe publish job URL segment') && workflow.includes('JOB_ID_PATH_SEGMENT') && workflow.includes('$ADMIN_API_BASE/content/publish-jobs/$JOB_ID_PATH_SEGMENT/claim') && workflow.includes('$ADMIN_API_BASE/content/publish-jobs/$JOB_ID_PATH_SEGMENT/export') && workflow.includes('$ADMIN_API_BASE/content/publish-jobs/$JOB_ID_PATH_SEGMENT/finalize'),
  failure_finalize_step_exists: failureStepStart >= 0,
  failure_finalize_uses_failure_condition: failureStepText.includes('${{ failure()') || failureStepText.includes('failure()'),
  failure_finalize_skips_smoke_mode: failureStepText.includes("inputs.publish_mode != 'cms-dispatch-visibility-smoke'"),
  failure_finalize_checks_claim_marker: failureStepText.includes('vacms-claimed.txt') && failureStepText.includes('CLAIMED'),
  failure_finalize_checks_success_finalize_marker: failureStepText.includes('vacms-success-finalized.txt') && failureStepText.includes('SUCCESS_FINALIZED'),
  failure_finalize_uses_JOB_ID_PATH_SEGMENT: failureStepText.includes('$ADMIN_API_BASE/content/publish-jobs/$JOB_ID_PATH_SEGMENT/finalize'),
  failure_receipt_written: failureStepText.includes('vacms-failure-receipt.json') && failureStepText.includes('FAIL_CMS_204W_PUBLISH_ADMIN_WORKFLOW_FAILURE_FINALIZE_RUNTIME_FAILURE_RECEIPT'),
  failure_finalize_json_written: failureStepText.includes('vacms-failure-finalize.json') && failureStepText.includes("result: 'bridge_failed'"),
  failure_receipts_uploaded: uploadStepText.includes('vacms-failure-receipt.json') && uploadStepText.includes('vacms-failure-finalize.json') && uploadStepText.includes('failure-finalize-result.json') && uploadStepText.includes('vacms-last-success-stage.txt') && uploadStepText.includes('vacms-claimed.txt') && uploadStepText.includes('vacms-success-finalized.txt'),
  success_path_preserved: workflow.includes('Finalize live public site deploy') && workflow.includes('vacms-live-deploy-receipt.json') && workflow.includes('vacms-live-finalize.json') && workflow.includes("result: 'bridge_live_deployed'") && workflow.includes('echo "true" > vacms-success-finalized.txt'),
  dry_visibility_smoke_path_preserved: workflow.includes('Dry visibility smoke seal') && workflow.includes("inputs.publish_mode == 'cms-dispatch-visibility-smoke'"),
  admin_bridge_token_not_printed: !workflow.includes('echo "$ADMIN_BRIDGE_TOKEN"') && !workflow.includes('console.log(process.env.ADMIN_BRIDGE_TOKEN)'),
  raw_JOB_ID_not_used_in_failure_finalize_url: !rawFailureFinalizeUrl,
  no_secret_literal_detected: !/ADMIN_BRIDGE_TOKEN\s*[:=]\s*[A-Za-z0-9_\-]{16,}/.test(workflow.replace(/\$\{\{\s*secrets\.ADMIN_BRIDGE_TOKEN\s*\}\}/g, '')),
}

const failed = Object.entries(checks).filter(([, value]) => value !== true).map(([key]) => key)
const pass = failed.length === 0
const receipt = {
  patch_id: 'CMS-204W',
  status: pass ? STATUS : FAIL_STATUS,
  pass,
  blocked_reason_code: pass ? null : failed[0],
  blocked_reason: pass ? null : `CMS-204W guard failed: ${failed[0]}`,
  checks,
  failure_finalize_policy: {
    claim_required: true,
    skip_if_success_finalized: true,
    finalize_result: 'bridge_failed',
    artifact_files: [
      'vacms-failure-receipt.json',
      'vacms-failure-finalize.json',
      'failure-finalize-result.json',
      'vacms-last-success-stage.txt',
      'vacms-claimed.txt',
      'vacms-success-finalized.txt',
      'vacms-failure-finalized.txt',
      'vacms-failure-stage.txt',
    ],
  },
}

fs.mkdirSync(path.dirname(receiptPath), { recursive: true })
fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2), 'utf8')

if (!pass) {
  console.error(`[CMS-204W] ${receipt.blocked_reason}`)
  process.exit(1)
}

console.log(STATUS)
