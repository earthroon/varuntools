#!/usr/bin/env node
import fs from 'node:fs'
import { spawnSync } from 'node:child_process'

const workflow = fs.readFileSync('.github/workflows/publish-admin-content.yml', 'utf8')
const pagesWorkflow = fs.readFileSync('.github/workflows/pages.yml', 'utf8')
const materializer = fs.readFileSync('scripts/materialize-vacms-public-page.mjs', 'utf8')
const admitter = fs.readFileSync('scripts/admit-vacms-public-page.mjs', 'utf8')
const committer = fs.readFileSync('scripts/commit-vacms-public-page-transaction.mjs', 'utf8')
const reconciler = fs.readFileSync('scripts/cms207m-r1a-reconcile-page-identity.mjs', 'utf8')
const identityAuthority = fs.readFileSync('scripts/lib/cms207m-r1a-page-identity.mjs', 'utf8')
const snapshotAuthority = fs.readFileSync('scripts/lib/cms207m-public-snapshot-identity.mjs', 'utf8')
const focusedSnapshotSmoke = fs.readFileSync('scripts/smoke-cms207m-r3-r3-public-snapshot-identity.mjs', 'utf8')
const dispatchReceiptWriter = fs.readFileSync('scripts/write-vacms-pages-dispatch-receipt.mjs', 'utf8')
const dispatchReceiptPhysicalSmoke = fs.readFileSync('scripts/smoke-cms207m-r3-r2-r2-r1-pages-dispatch-receipt.mjs', 'utf8')
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

const dispatchStart = workflow.indexOf('      - name: Dispatch exact source commit to Pages workflow')
const dispatchEnd = workflow.indexOf('      - name: Finalize atomic public source transaction', dispatchStart)
const dispatchStep = dispatchStart >= 0 && dispatchEnd > dispatchStart
  ? workflow.slice(dispatchStart, dispatchEnd)
  : ''
const dispatchRunMarker = '        run: |\n'
const dispatchRunStart = dispatchStep.indexOf(dispatchRunMarker)
const dispatchRunRaw = dispatchRunStart >= 0
  ? dispatchStep.slice(dispatchRunStart + dispatchRunMarker.length)
  : ''
const dispatchShell = dispatchRunRaw
  .split('\n')
  .map((line) => line.startsWith('          ') ? line.slice(10) : line)
  .join('\n')
const dispatchShellSyntax = dispatchShell
  ? spawnSync('bash', ['-n'], { input: dispatchShell, encoding: 'utf8', shell: false })
  : { status: 1, stderr: 'dispatch shell not found' }

check('live transaction range found', Boolean(live))
check('Pages dispatch step found', Boolean(dispatchStep))
check('Pages dispatch shell parses with bash -n', dispatchShellSyntax.status === 0)
check('Pages dispatch has only one top-level heredoc', (dispatchStep.match(/node <<'NODE'/g) || []).length === 1)
check('Pages dispatch probe node -e remains allowed', dispatchStep.includes('SOURCE_COMMITTED="$(node -e '))
check('Pages dispatch has no inline receipt node -e writer', !dispatchStep.split('\n').some((line) => line.includes('node -e ') && line.includes('vacms-pages-dispatch-receipt.json')))
check('Pages dispatch preparation does not write dispatch receipt', !dispatchStep.includes("fs.writeFileSync('vacms-pages-dispatch-receipt.json'"))
check('Pages dispatch success branch calls physical receipt authority', dispatchStep.includes('node scripts/write-vacms-pages-dispatch-receipt.mjs dispatched'))
check('Pages dispatch skip branch calls physical receipt authority', dispatchStep.includes('node scripts/write-vacms-pages-dispatch-receipt.mjs source-not-advanced'))
check('dispatch receipt writer owns physical receipt filename', dispatchReceiptWriter.includes("const RECEIPT_FILE = path.join(ROOT, 'vacms-pages-dispatch-receipt.json')"))
check('dispatch receipt writer seals physical LF', dispatchReceiptWriter.includes('bytes[bytes.length - 1] !== 0x0A'))
check('dispatch receipt writer rejects UTF-8 BOM', dispatchReceiptWriter.includes('E_CMS207M_R3_R2_R2_R1_RECEIPT_BOM_FORBIDDEN'))
check('dispatch receipt writer validates exact source SHA', dispatchReceiptWriter.includes('/^[0-9a-f]{40}$/'))
check('dispatch receipt physical smoke covers dispatched outcome', dispatchReceiptPhysicalSmoke.includes("runWriter(root, 'dispatched')"))
check('dispatch receipt physical smoke covers source-not-advanced outcome', dispatchReceiptPhysicalSmoke.includes("runWriter(root, 'source-not-advanced')"))
check('dispatch receipt physical smoke covers malformed JSON state', dispatchReceiptPhysicalSmoke.includes('rawState:'))
check('workflow has zero direct dispatch receipt byte writers', !workflow.includes("fs.writeFileSync('vacms-pages-dispatch-receipt.json'"))
check('Finalize still reads dispatch receipt through JSON.parse', live.includes("JSON.parse(fs.readFileSync('vacms-pages-dispatch-receipt.json', 'utf8'))"))
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
const dependencyFreeImports = (source, allowedLocal = []) =>
  [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)]
    .every((match) => match[1].startsWith('node:') || allowedLocal.includes(match[1]))

check('materializer remains dependency-free with snapshot identity SSOT', dependencyFreeImports(materializer, ['./lib/cms207m-public-snapshot-identity.mjs']))
check('admitter remains dependency-free with snapshot identity SSOT', dependencyFreeImports(admitter, ['./lib/cms207m-public-snapshot-identity.mjs']))
check('committer uses only node imports', dependencyFreeImports(committer))
check('materializer imports snapshot identity SSOT', materializer.includes("from './lib/cms207m-public-snapshot-identity.mjs'"))
check('R1A imports snapshot identity SSOT', identityAuthority.includes("from './cms207m-public-snapshot-identity.mjs'"))
check('admission imports snapshot identity SSOT', admitter.includes("from './lib/cms207m-public-snapshot-identity.mjs'"))
check('snapshot schema is emitted into materialized Markdown', materializer.includes('vacmsPublicSnapshotSchema') && materializer.includes('vacmsPublicSnapshotHash'))
check('same-revision revision projection drift remains hard-failed', identityAuthority.includes('E_CMS207M_R3_R3_SAME_REVISION_REVISION_PROJECTION_DRIFT'))
check('metadata-only public projection transition exists', identityAuthority.includes("transition: 'metadata_projection_update'"))
check('reconcile records incoming public snapshot authority', reconciler.includes('incomingPublicSnapshotHash') && reconciler.includes('incomingPageProjectionHash') && reconciler.includes('incomingRevisionProjectionHash'))
check('snapshot authority uses node crypto only', dependencyFreeImports(snapshotAuthority, ['./cms207m-public-projection.mjs']))
check('materializer rejects pre-serialization snapshot authority', !materializer.includes('derivePublicSnapshotIdentityFromParts'))
check('snapshot authority does not export pre-serialization entrypoint', !snapshotAuthority.includes('export function derivePublicSnapshotIdentityFromParts'))
check('focused snapshot smoke rejects pre-serialization authority', !focusedSnapshotSmoke.includes('derivePublicSnapshotIdentityFromParts'))
check('materializer uses materialized Markdown snapshot authority', materializer.includes('derivePublicSnapshotIdentityFromMarkdown'))
check('R1A uses materialized Markdown snapshot authority', identityAuthority.includes('derivePublicSnapshotIdentityFromMarkdown'))
check('admission uses materialized Markdown snapshot authority', admitter.includes('derivePublicSnapshotIdentityFromMarkdown'))
check('materializer seals physical disk readback authority', materializer.includes("snapshotAuthority: 'materialized-markdown'") && materializer.includes("snapshotSealPhase: 'post-serialize-disk-readback'") && materializer.includes('snapshotPhysicalReadbackVerified: true'))

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
