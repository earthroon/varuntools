#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const PATCH_ID = 'CMS-D1-017A-R2Z-R1W-R4A-F1-R1'
const PASS = 'PASS_CMS_D1_017A_R2Z_R1W_R4A_F1_R1_DRY_VISIBILITY_WORKFLOW_EARLY_EXIT_GATE_SKIP_CLAIM_EXPORT_MATERIALIZE_PR_FINALIZE_ON_SMOKE_MODE_NO_VACMS_MUTATION_NO_PR'
const SMOKE = "inputs.publish_mode != 'cms-dispatch-visibility-smoke'"
const DRY = "inputs.publish_mode == 'cms-dispatch-visibility-smoke'"
const DEFAULT_WORKFLOW = '.github/workflows/publish-admin-content.yml'
const DEFAULT_ARTIFACT = 'artifacts/CMS_D1_017A_R2Z_R1W_R4A_F1_R1_DRY_VISIBILITY_WORKFLOW_EARLY_EXIT_GATE.json'

function fail(code, message, details = {}) {
  const out = {
    ok: false,
    patchId: PATCH_ID,
    code,
    message,
    details,
    forbiddenMutations: {
      claim: false,
      export: false,
      materialize: false,
      commit: false,
      branch: false,
      pr: false,
      publishedFinalize: false,
    },
  }
  console.log(JSON.stringify(out, null, 2))
  process.exitCode = 1
}

function parseArgs(argv) {
  const args = { repo: process.cwd(), workflow: DEFAULT_WORKFLOW, artifact: DEFAULT_ARTIFACT }
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i]
    const next = argv[i + 1]
    if (key === '--repo') { args.repo = next; i += 1; continue }
    if (key === '--workflow') { args.workflow = next; i += 1; continue }
    if (key === '--artifact') { args.artifact = next; i += 1; continue }
    fail('R4A_F1_R1_ARG_PARSE_FAILED', `Unknown argument: ${key}`)
    return null
  }
  return args
}

function blockForStep(text, name) {
  const marker = `- name: ${name}`
  const idx = text.indexOf(marker)
  if (idx < 0) return null
  const rest = text.slice(idx + marker.length)
  const next = rest.search(/\n\s{6}- name: /)
  return text.slice(idx, next < 0 ? text.length : idx + marker.length + next)
}

function hasGate(block) {
  return typeof block === 'string' && block.includes(SMOKE)
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args) return
  const workflowPath = path.resolve(args.repo, args.workflow)
  if (!fs.existsSync(workflowPath)) {
    fail('R4A_F1_R1_WORKFLOW_FILE_MISSING', 'workflow file is missing', { workflowPath })
    return
  }
  const text = fs.readFileSync(workflowPath, 'utf8')
  const checks = []
  const add = (name, ok, code, detail = {}) => checks.push({ name, ok, code: ok ? null : code, ...detail })

  add('workflow dispatch input publish_mode exists', text.includes('publish_mode:'), 'R4A_F1_R1_WORKFLOW_INPUT_MISSING')
  add('dry visibility smoke seal step exists', text.includes('- name: Dry visibility smoke seal') && text.includes(DRY), 'R4A_F1_R1_DRY_VISIBILITY_GATE_MISSING')
  add('dry visibility artifact upload exists', text.includes('- name: Upload dry visibility smoke artifact') && text.includes('dry-visibility-result.json') && text.includes(DRY), 'R4A_F1_R1_DRY_ARTIFACT_MISSING')

  const gatedSteps = [
    ['Checkout public repository', 'R4A_F1_R1_CHECKOUT_STEP_NOT_GATED'],
    ['Claim VACMS publish job', 'R4A_F1_R1_CLAIM_STEP_NOT_GATED'],
    ['Export VACMS publish payload', 'R4A_F1_R1_EXPORT_STEP_NOT_GATED'],
    ['Materialize content file', 'R4A_F1_R1_MATERIALIZE_STEP_NOT_GATED'],
    ['Create branch and draft pull request', 'R4A_F1_R1_PR_STEP_NOT_GATED'],
    ['Upload VACMS publish receipts', 'R4A_F1_R1_PUBLISH_RECEIPTS_UPLOAD_NOT_GATED'],
  ]
  for (const [name, code] of gatedSteps) {
    const block = blockForStep(text, name)
    add(`${name} gated`, hasGate(block), code, { step: name })
  }

  const dangerousPatterns = [
    ['claim curl only in gated step', 'content/publish-jobs/$JOB_ID/claim', 'Claim VACMS publish job', 'R4A_F1_R1_CLAIM_CALL_OUTSIDE_GATED_STEP'],
    ['export curl only in gated step', 'content/publish-jobs/$JOB_ID/export', 'Export VACMS publish payload', 'R4A_F1_R1_EXPORT_CALL_OUTSIDE_GATED_STEP'],
    ['finalize curl only in gated step', 'content/publish-jobs/$JOB_ID/finalize', 'Create branch and draft pull request', 'R4A_F1_R1_FINALIZE_CALL_OUTSIDE_GATED_STEP'],
    ['git push only in gated step', 'git push origin', 'Create branch and draft pull request', 'R4A_F1_R1_COMMIT_OR_BRANCH_CALL_OUTSIDE_GATED_STEP'],
    ['gh pr create only in gated step', 'gh pr create', 'Create branch and draft pull request', 'R4A_F1_R1_PR_CALL_OUTSIDE_GATED_STEP'],
  ]
  for (const [name, needle, step, code] of dangerousPatterns) {
    const indices = []
    let offset = 0
    while (true) {
      const found = text.indexOf(needle, offset)
      if (found < 0) break
      indices.push(found)
      offset = found + needle.length
    }
    const block = blockForStep(text, step)
    const start = block ? text.indexOf(block) : -1
    const end = start >= 0 ? start + block.length : -1
    const ok = indices.every((idx) => start >= 0 && idx >= start && idx <= end && hasGate(block))
    add(name, ok, code, { occurrences: indices.length, step })
  }

  const failed = checks.filter((c) => !c.ok)
  const artifact = {
    ok: failed.length === 0,
    patchId: PATCH_ID,
    previousPatchId: 'CMS-D1-017A-R2Z-R1W-R4A-F1',
    status: failed.length === 0 ? PASS : 'FAIL_CMS_D1_017A_R2Z_R1W_R4A_F1_R1_DRY_VISIBILITY_WORKFLOW_EARLY_EXIT_GATE_STATIC_SMOKE',
    scope: 'dry visibility workflow early exit gate static smoke',
    workflowPath: args.workflow,
    checks,
    forbiddenMutations: {
      claim: false,
      export: false,
      materialize: false,
      commit: false,
      branch: false,
      pr: false,
      publishedFinalize: false,
      failureFinalize: false,
    },
    noWorkflowDispatch: true,
    noGitHubWrite: true,
    noVACMSMutation: true,
    nextPatch: 'CMS-D1-017A-R2Z-R1W-R4A-R1',
  }
  const artifactPath = path.resolve(args.repo, args.artifact)
  fs.mkdirSync(path.dirname(artifactPath), { recursive: true })
  fs.writeFileSync(artifactPath, JSON.stringify(artifact, null, 2))
  console.log(artifact.status)
  console.log(JSON.stringify(artifact, null, 2))
  if (failed.length) process.exitCode = 1
}

main()
