#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const workflowPath = path.join(root, '.github/workflows/publish-sheet-cms.yml')

function fail(errors, code, message) {
  errors.push({ code, message })
}

function assertIncludes(text, needle, errors, code, message) {
  if (!text.includes(needle)) fail(errors, code, message || `Missing: ${needle}`)
}

function assertNotIncludes(text, needle, errors, code, message) {
  if (text.includes(needle)) fail(errors, code, message || `Forbidden: ${needle}`)
}

function main() {
  const errors = []
  const warnings = []

  if (!fs.existsSync(workflowPath)) {
    fail(errors, 'workflow.missing', 'Missing .github/workflows/publish-sheet-cms.yml')
  }

  const text = fs.existsSync(workflowPath) ? fs.readFileSync(workflowPath, 'utf8') : ''

  assertIncludes(text, 'repository_dispatch:', errors, 'trigger.repositoryDispatch')
  assertIncludes(text, 'types: [publish-sheet-content]', errors, 'trigger.eventType')
  assertIncludes(text, 'workflow_dispatch:', errors, 'trigger.workflowDispatch')
  assertIncludes(text, 'contents: write', errors, 'permissions.contentsWrite')
  assertIncludes(text, 'concurrency:', errors, 'concurrency.missing')
  assertIncludes(text, 'cancel-in-progress: true', errors, 'concurrency.cancel')

  assertIncludes(text, 'APPS_SCRIPT_WEBAPP_URL', errors, 'secret.gatewayUrl')
  assertIncludes(text, 'SHEET_CMS_SHARED_SECRET', errors, 'secret.sharedSecret')

  for (const forbidden of [
    'GOOGLE_SERVICE_ACCOUNT_JSON',
    'GOOGLE_APPLICATION_CREDENTIALS',
    'VARUNTOOLS_SHEET_ID',
    'DRIVE_ASSET_FOLDER_ID',
    'google-service-account.json',
  ]) {
    assertNotIncludes(text, forbidden, errors, `forbidden.${forbidden}`, `Workflow must not use direct Google credential contract: ${forbidden}`)
  }

  for (const script of [
    'npm run check:sheet-cms-auth',
    'npm run sync:sheets',
    'npm run sync:drive-assets',
    'npm run generate:content-json',
    'npm run validate:generated-content',
    'npm run build',
    'npm run finalize:sheet-cms',
  ]) {
    assertIncludes(text, script, errors, `step.${script}`, `Workflow missing step: ${script}`)
  }

  assertIncludes(text, 'src/content/generated', errors, 'commit.generatedContent')
  assertIncludes(text, 'src/content/pages', errors, 'commit.pageOwnedAssets')
  assertIncludes(text, 'id: commit_generated', errors, 'commit.outputs', 'Commit step must expose commit_sha for finalize.')
  assertIncludes(text, 'Finalize Sheet CMS publish', errors, 'finalize.step', 'Workflow must call Apps Script finalize after successful commit path.')
  assertIncludes(text, 'SHEET_CMS_COMMIT_SHA', errors, 'finalize.commitSha')
  assertIncludes(text, 'SHEET_CMS_ACTION_RUN_URL', errors, 'finalize.actionRunUrl')
  assertNotIncludes(text, 'public/assets/generated', errors, 'commit.publicAssetsLegacy', 'Workflow must not commit legacy public/assets/generated for Sheet CMS assets.')
  assertNotIncludes(text, 'git add .', errors, 'commit.gitAddDot', 'Workflow must not use git add .')
  assertNotIncludes(text, '.sheet-cms-cache', errors, 'commit.cacheLeak', 'Workflow must not reference .sheet-cms-cache as a commit target.')

  const pagesWorkflowPath = path.join(root, '.github/workflows/pages.yml')
  if (!fs.existsSync(pagesWorkflowPath)) {
    warnings.push({ code: 'pagesWorkflow.missing', message: 'pages.yml not found. Confirm deploy is handled elsewhere.' })
  }

  console.log('[smoke:publish-workflow] workflow:', workflowPath)
  console.log(`[smoke:publish-workflow] warnings: ${warnings.length}`)
  console.log(`[smoke:publish-workflow] errors: ${errors.length}`)

  for (const warning of warnings) console.warn(`[warning:${warning.code}] ${warning.message}`)
  for (const error of errors) console.error(`[error:${error.code}] ${error.message}`)

  if (errors.length) process.exit(1)
  console.log('[smoke:publish-workflow] success')
}

main()
