#!/usr/bin/env node
import fs from 'node:fs'

const workflow = fs.readFileSync('.github/workflows/publish-admin-content.yml', 'utf8')
const pagesWorkflow = fs.readFileSync('.github/workflows/pages.yml', 'utf8')
const materializer = fs.readFileSync('scripts/materialize-vacms-public-page.mjs', 'utf8')
const admitter = fs.readFileSync('scripts/admit-vacms-public-page.mjs', 'utf8')
const committer = fs.readFileSync('scripts/commit-vacms-public-page-transaction.mjs', 'utf8')
const failures = []
function check(name, condition) {
  if (condition) console.log('PASS ' + name)
  else { failures.push(name); console.error('FAIL ' + name) }
}

const start = workflow.indexOf('      - name: Admit atomic public page transaction')
const end = workflow.indexOf('      - name: Create branch and draft pull request')
const live = start >= 0 && end > start ? workflow.slice(start, end) : ''
const permissionsStart = workflow.indexOf('permissions:')
const jobsStart = workflow.indexOf('\njobs:', permissionsStart)
const permissionsBlock = permissionsStart >= 0 && jobsStart > permissionsStart ? workflow.slice(permissionsStart, jobsStart) : ''

check('live transaction range found', Boolean(live))
check('live transaction has no npm ci', !live.includes('npm ci'))
check('live transaction has no npm install', !live.includes('npm install'))
check('live transaction has no full build', !live.includes('npm run build'))
check('live transaction has no whole-repo validate:content', !live.includes('npm run validate:content'))
check('live transaction has no setup-node', !live.includes('actions/setup-node'))
check('live transaction has no Pages deploy action', !live.includes('deploy-pages') && !live.includes('upload-pages-artifact'))
check('live transaction calls dependency-free admission', live.includes('node scripts/admit-vacms-public-page.mjs --workflow'))
check('live transaction calls atomic commit authority', live.includes('node scripts/commit-vacms-public-page-transaction.mjs --workflow'))
check('publish workflow grants actions write for explicit Pages dispatch', permissionsBlock.includes('  actions: write'))
check('live transaction explicitly dispatches pages.yml', live.includes('/actions/workflows/pages.yml/dispatches'))
check('Pages dispatch is keyed by exact source commit SHA', live.includes('source_commit_sha: sha') && live.includes('dispatch.sourceCommitSha !== source.sourceCommitSha'))
check('no-change source transaction skips Pages dispatch', live.includes('source.sourceCommitted === true') && live.includes('dispatched: false') && live.includes('source_not_advanced'))
check('finalize names Pages workflow dispatch authority', live.includes("deployTarget: 'pages-workflow-dispatch'"))
check('live transaction finalizes source publication', live.includes("result: source.sourceCommitted === true ? 'published' : 'no_changes'"))
check('materializer uses only node imports', [...materializer.matchAll(/from\s+['"]([^'"]+)['"]/g)].every((match) => match[1].startsWith('node:')))
check('admitter uses only node imports', [...admitter.matchAll(/from\s+['"]([^'"]+)['"]/g)].every((match) => match[1].startsWith('node:')))
check('committer uses only node imports', [...committer.matchAll(/from\s+['"]([^'"]+)['"]/g)].every((match) => match[1].startsWith('node:')))

const identityNameConfig = "runGit(\n  ['config', '--local', 'user.name', COMMIT_IDENTITY_NAME]"
const identityEmailConfig = "runGit(\n  ['config', '--local', 'user.email', COMMIT_IDENTITY_EMAIL]"
const identityNameReadback = "['config', '--local', '--get', 'user.name']"
const identityEmailReadback = "['config', '--local', '--get', 'user.email']"
const exactGitAdd = "runGit(['add', '--', ...authorizedPaths]"

const identityNameConfigIndex = committer.indexOf(identityNameConfig)
const identityEmailConfigIndex = committer.indexOf(identityEmailConfig)
const exactGitAddIndex = committer.indexOf(exactGitAdd)

check('atomic commit owns repo-local bot identity constants', committer.includes("const COMMIT_IDENTITY_NAME = 'vacms-publish-bot'") && committer.includes("const COMMIT_IDENTITY_EMAIL = 'actions@users.noreply.github.com'"))
check('atomic commit configures repo-local git identity', identityNameConfigIndex >= 0 && identityEmailConfigIndex > identityNameConfigIndex)
check('atomic commit reads back repo-local git identity', committer.includes(identityNameReadback) && committer.includes(identityEmailReadback) && committer.includes('E_CMS207M_R3_R1_GIT_IDENTITY_READBACK_MISMATCH'))
check('atomic commit seals identity before exact staging', exactGitAddIndex > identityEmailConfigIndex)
check('atomic commit does not use global git identity', !committer.includes("['config', '--global'"))

check('atomic commit excludes global projection files', !committer.includes('publicContentProjection.generated.json') && !committer.includes('publicAssetManifest.generated.json') && !committer.includes('homeCollections.generated.json'))
check('atomic commit forbids git add dot', !committer.includes("['add', '.']") && !committer.includes("['add', '-A']"))
check('admission validates 2/3/4 editorial columns', admitter.includes("normalized === '4'") && admitter.includes('E_CMS51_R1_EDITORIAL_COLUMNS_COUNT_MISMATCH'))
check('Pages workflow retains main push entrypoint', pagesWorkflow.includes('  push:\n    branches:\n      - main'))
check('Pages workflow accepts exact source commit input', pagesWorkflow.includes('      source_commit_sha:') && pagesWorkflow.includes('DISPATCH_SOURCE_COMMIT_SHA: ${{ inputs.source_commit_sha }}'))
check('Pages workflow checks out resolved exact SHA', pagesWorkflow.includes('ref: ${{ env.PAGES_SOURCE_COMMIT_SHA }}') && pagesWorkflow.includes('ACTUAL_SHA="$(git rev-parse HEAD)"'))
check('Pages workflow verifies checkout identity', pagesWorkflow.includes('Pages checkout SHA mismatch: expected=$PAGES_SOURCE_COMMIT_SHA actual=$ACTUAL_SHA'))

if (failures.length) {
  console.error('CMS-207M-R3 smoke FAILED')
  for (const failure of failures) console.error('- ' + failure)
  process.exit(1)
}
console.log('PASS_CMS_207M_R3_ATOMIC_PUBLIC_PAGE_TRANSACTION_STATIC_SEAL')
