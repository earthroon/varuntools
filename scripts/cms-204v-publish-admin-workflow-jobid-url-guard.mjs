import fs from 'node:fs'
import path from 'node:path'

const STATUS = 'PASS_CMS_204V_PUBLISH_ADMIN_WORKFLOW_JOBID_URL_PATH_SEGMENT_ENCODING_CURL_URL_MALFORMED_GUARD_AND_DEBUG_SAFE_INPUT_ECHO_SEAL'
const FAIL_STATUS = `FAIL_${STATUS}`

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd()
const workflowPath = path.join(root, '.github', 'workflows', 'publish-admin-content.yml')
const receiptPath = path.join(root, 'artifacts', 'cms', 'CMS_204V_PUBLISH_ADMIN_WORKFLOW_JOBID_URL_PATH_SEGMENT_ENCODING.json')

const exists = (filePath) => fs.existsSync(filePath)
const workflow = exists(workflowPath) ? fs.readFileSync(workflowPath, 'utf8') : ''

const rawJobCurlUrlPattern = /\$ADMIN_API_BASE\/content\/publish-jobs\/\$JOB_ID\/(claim|export|finalize)/
const encodedCurl = (suffix) => workflow.includes(`$ADMIN_API_BASE/content/publish-jobs/$JOB_ID_PATH_SEGMENT/${suffix}`)
const safeStepStart = workflow.indexOf('- name: Prepare safe publish job URL segment')
const safeStepEnd = safeStepStart >= 0 ? workflow.indexOf('- name: Dry visibility smoke seal', safeStepStart) : -1
const safeStepText = safeStepStart >= 0 && safeStepEnd > safeStepStart ? workflow.slice(safeStepStart, safeStepEnd) : ''

const checks = {
  workflow_exists: exists(workflowPath),
  workflow_dispatch_inputs_exist: workflow.includes('workflow_dispatch:') && workflow.includes('job_id:') && workflow.includes('publish_mode:'),
  validate_rejects_cms204k: workflow.includes('cms204k_*)') || workflow.includes("startsWith('cms204k_')"),
  validate_rejects_ghdisp: workflow.includes('ghdisp_*)') || workflow.includes("startsWith('ghdisp_')"),
  safe_path_segment_step_exists: workflow.includes('Prepare safe publish job URL segment'),
  encodeURIComponent_used: workflow.includes('encodeURIComponent(raw)'),
  github_env_exports_job_id_path_segment: workflow.includes('JOB_ID_PATH_SEGMENT=') && workflow.includes('GITHUB_ENV'),
  claim_uses_encoded_job_id: encodedCurl('claim'),
  export_uses_encoded_job_id: encodedCurl('export'),
  finalize_uses_encoded_job_id: encodedCurl('finalize'),
  raw_job_id_not_used_in_curl_url_path: !rawJobCurlUrlPattern.test(workflow),
  debug_safe_echo_present: workflow.includes('job_id_sha256_16') && workflow.includes('job_id_length='),
  raw_job_id_echo_absent: !workflow.includes('echo "jobId=${JOB_ID}"') && !safeStepText.includes('console.log(raw') && !safeStepText.includes('console.error(raw'),
  admin_bridge_token_not_printed: !workflow.includes('echo "$ADMIN_BRIDGE_TOKEN"') && !workflow.includes('console.log(process.env.ADMIN_BRIDGE_TOKEN)'),
  dry_visibility_smoke_path_preserved: workflow.includes('Dry visibility smoke seal') && workflow.includes("inputs.publish_mode == 'cms-dispatch-visibility-smoke'"),
  live_branch_apply_path_preserved: workflow.includes("inputs.publish_mode == 'cms-live-branch-apply'") && workflow.includes('Deploy live public site branch') && workflow.includes('Finalize live public site deploy'),
  no_secret_literal_detected: !/ADMIN_BRIDGE_TOKEN\s*[:=]\s*[A-Za-z0-9_\-]{16,}/.test(workflow.replace(/\$\{\{\s*secrets\.ADMIN_BRIDGE_TOKEN\s*\}\}/g, '')),
}

const failed = Object.entries(checks).filter(([, value]) => value !== true).map(([key]) => key)
const pass = failed.length === 0
const receipt = {
  patch_id: 'CMS-204V',
  status: pass ? STATUS : FAIL_STATUS,
  pass,
  blocked_reason_code: pass ? null : failed[0],
  blocked_reason: pass ? null : `CMS-204V guard failed: ${failed[0]}`,
  checks,
  url_path_segment_policy: {
    source: 'workflow_dispatch.inputs.job_id',
    encoded_env: 'JOB_ID_PATH_SEGMENT',
    encoder: 'encodeURIComponent',
    rejected_prefixes: ['cms204k_', 'ghdisp_'],
    allowed_pattern: '^[A-Za-z0-9._:-]+$',
    raw_log_policy: 'never print raw job_id in debug-safe input echo',
  },
}

fs.mkdirSync(path.dirname(receiptPath), { recursive: true })
fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2), 'utf8')

if (!pass) {
  console.error(`[CMS-204V] ${receipt.blocked_reason}`)
  process.exit(1)
}

console.log(STATUS)
