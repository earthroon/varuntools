#!/usr/bin/env node
import fs from 'node:fs'

const validator = fs.readFileSync('scripts/validate-content.mjs', 'utf8')
const workflow = fs.readFileSync('.github/workflows/publish-admin-content.yml', 'utf8')
const wrapper = fs.readFileSync('scripts/commit-vacms-materialized-source-r2.mjs', 'utf8')
const checker = fs.readFileSync('scripts/check-vacms-materialized-public-contract.mjs', 'utf8')
const taxonomy = JSON.parse(fs.readFileSync('config/public-content-taxonomy.json', 'utf8'))

const failures = []
let passed = 0

function check(label, ok) {
  if (ok) {
    passed += 1
    console.log('PASS ' + label)
  } else {
    failures.push(label)
    console.error('FAIL ' + label)
  }
}

function occurrences(source, token) {
  return source.split(token).length - 1
}

check(
  'taxonomy contains post',
  Array.isArray(taxonomy.publicKinds) && taxonomy.publicKinds.includes('post'),
)

check(
  'validator loads canonical taxonomy',
  validator.includes("config', 'public-content-taxonomy.json"),
)

check(
  'validator kind authority comes from taxonomy',
  validator.includes('const VALID_KINDS = new Set(publicTaxonomy.publicKinds)'),
)

check(
  'legacy kind shadow retired',
  !validator.includes(
    "const VALID_KINDS = new Set(['page', 'work', 'tool', 'lab', 'doc', 'product'])",
  ),
)

const booleanIndex = workflow.indexOf(
  "if (typeof value === 'boolean') return value ? 'true' : 'false'",
)
const numberIndex = workflow.indexOf("if (typeof value === 'number') {")
const objectIndex = workflow.indexOf(
  "if (typeof value === 'object') return JSON.stringify(JSON.stringify(value))",
)
const stringIndex = workflow.indexOf('return JSON.stringify(String(value))')

check('boolean scalar branch exists', booleanIndex >= 0)
check('number scalar branch exists', numberIndex >= 0)
check(
  'typed scalar branches precede fallbacks',
  booleanIndex >= 0
    && numberIndex > booleanIndex
    && objectIndex > numberIndex
    && stringIndex > objectIndex,
)

const setupIndex = workflow.indexOf('Setup Node for live branch apply')
const installIndex = workflow.indexOf(
  'Install public site dependencies for live branch apply',
)
const admissionIndex = workflow.indexOf(
  'Pre-commit VACMS materialized public contract admission',
)
const commitIndex = workflow.indexOf('Commit materialized source back to main')
const registryIndex = workflow.indexOf('Build VACMS live markdown registry source')
const buildIndex = workflow.indexOf('Validate and build live branch apply content')

check(
  'dependency setup singular',
  occurrences(workflow, 'Setup Node for live branch apply') === 1
    && occurrences(
      workflow,
      'Install public site dependencies for live branch apply',
    ) === 1,
)

check(
  'precommit physical order',
  setupIndex >= 0
    && installIndex > setupIndex
    && admissionIndex > installIndex
    && commitIndex > admissionIndex
    && registryIndex > commitIndex
    && buildIndex > registryIndex,
)

check(
  'candidate checker precedes whole validation',
  workflow.indexOf(
    'node scripts/check-vacms-materialized-public-contract.mjs --workflow',
  ) < workflow.indexOf('npm run validate:content'),
)

check(
  'authorization follows whole validation',
  workflow.indexOf(
    'node scripts/check-vacms-materialized-public-contract.mjs --authorize',
  ) > workflow.indexOf('npm run validate:content'),
)

check(
  'workflow uses R2 commit wrapper',
  workflow.includes(
    'node scripts/commit-vacms-materialized-source-r2.mjs --workflow',
  ),
)

check(
  'legacy CMS-204AS delegate signature remains visible',
  workflow.includes(
    'node scripts/commit-vacms-materialized-source.mjs --workflow',
  ),
)

check(
  'wrapper requires full authorization',
  wrapper.includes('wholeRepoValidationPassed !== true')
    && wrapper.includes('E_CMS207M_R2_COMMIT_WITHOUT_ADMISSION'),
)

check(
  'wrapper binds candidate identity without new checksum work',
  wrapper.includes('E_CMS207M_R2_ADMISSION_CANDIDATE_SIZE_MISMATCH')
    && wrapper.includes('E_CMS207M_R2_ADMISSION_PAGE_ID_MISMATCH')
    && wrapper.includes('E_CMS207M_R2_ADMISSION_REVISION_ID_MISMATCH')
    && !wrapper.includes("createHash("),
)

check(
  'wrapper delegates legacy source commit without shell',
  wrapper.includes(
    "['scripts/commit-vacms-materialized-source.mjs', '--workflow']",
  ) && wrapper.includes('shell: false'),
)

check(
  'checker validates taxonomy and primitive identity',
  checker.includes('taxonomy.publicKinds')
    && checker.includes('taxonomy.publicCategories')
    && checker.includes('E_CMS207M_R2_BOOLEAN_TYPE_LOSS')
    && checker.includes('E_CMS207M_R2_NUMBER_TYPE_LOSS')
    && !checker.includes('createHash('),
)

if (failures.length) {
  console.error(
    'CMS-207M-R2 STATIC SEAL FAILED '
      + passed
      + '/'
      + (passed + failures.length)
      + ': '
      + failures.join(', '),
  )
  process.exit(1)
}

console.log(
  'PASS_CMS_207M_R2_CONTRACT_AUTHORITY_STATIC_SEAL '
    + passed
    + '/'
    + passed,
)
