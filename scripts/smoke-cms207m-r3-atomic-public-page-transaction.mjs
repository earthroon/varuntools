#!/usr/bin/env node
import fs from 'node:fs'

const workflow = fs.readFileSync('.github/workflows/publish-admin-content.yml', 'utf8')
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

check('live transaction range found', Boolean(live))
check('live transaction has no npm ci', !live.includes('npm ci'))
check('live transaction has no npm install', !live.includes('npm install'))
check('live transaction has no full build', !live.includes('npm run build'))
check('live transaction has no whole-repo validate:content', !live.includes('npm run validate:content'))
check('live transaction has no setup-node', !live.includes('actions/setup-node'))
check('live transaction has no Pages deploy action', !live.includes('deploy-pages') && !live.includes('upload-pages-artifact'))
check('live transaction calls dependency-free admission', live.includes('node scripts/admit-vacms-public-page.mjs --workflow'))
check('live transaction calls atomic commit authority', live.includes('node scripts/commit-vacms-public-page-transaction.mjs --workflow'))
check('live transaction finalizes source publication', live.includes("result: source.sourceCommitted === true ? 'published' : 'no_changes'"))
check('materializer uses only node imports', [...materializer.matchAll(/from\s+['"]([^'"]+)['"]/g)].every((match) => match[1].startsWith('node:')))
check('admitter uses only node imports', [...admitter.matchAll(/from\s+['"]([^'"]+)['"]/g)].every((match) => match[1].startsWith('node:')))
check('committer uses only node imports', [...committer.matchAll(/from\s+['"]([^'"]+)['"]/g)].every((match) => match[1].startsWith('node:')))
check('atomic commit excludes global projection files', !committer.includes('publicContentProjection.generated.json') && !committer.includes('publicAssetManifest.generated.json') && !committer.includes('homeCollections.generated.json'))
check('atomic commit forbids git add dot', !committer.includes("['add', '.']") && !committer.includes("['add', '-A']"))
check('admission validates 2/3/4 editorial columns', admitter.includes("normalized === '4'") && admitter.includes('E_CMS51_R1_EDITORIAL_COLUMNS_COUNT_MISMATCH'))

if (failures.length) {
  console.error('CMS-207M-R3 smoke FAILED')
  for (const failure of failures) console.error('- ' + failure)
  process.exit(1)
}
console.log('PASS_CMS_207M_R3_ATOMIC_PUBLIC_PAGE_TRANSACTION_STATIC_SEAL')
