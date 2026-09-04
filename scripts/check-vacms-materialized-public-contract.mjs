#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import process from 'node:process'

const PASS = 'PASS_CMS_207M_R2_PUBLIC_MATERIALIZATION_CONTRACT_AUTHORITY_CLOSURE'
const CANDIDATE_PASS = 'PASS_CMS_207M_R2_MATERIALIZED_CANDIDATE_CONTRACT'
const ADMISSION = 'vacms-materialization-admission.json'
const MATERIALIZATION = 'vacms-materialization-receipt.json'
const EXPORT_PAYLOAD = 'export-payload.json'
const TAXONOMY = path.join('config', 'public-content-taxonomy.json')

function writeReceipt(value) {
  fs.writeFileSync(ADMISSION, JSON.stringify(value, null, 2) + '\n', 'utf8')
}

function fail(code, message, extra = {}) {
  writeReceipt({
    ok: false,
    status: 'FAIL_' + PASS,
    code,
    message,
    candidateContractPassed: false,
    wholeRepoValidationPassed: false,
    mainMutationAllowed: false,
    ...extra,
    generatedAt: new Date().toISOString(),
  })
  console.error(code + ': ' + message)
  process.exit(1)
}

function readJson(file) {
  if (!fs.existsSync(file)) fail('E_CMS207M_R2_REQUIRED_INPUT_MISSING', file)

  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (error) {
    fail('E_CMS207M_R2_REQUIRED_INPUT_INVALID_JSON', file, {
      detail: error instanceof Error ? error.message : String(error),
    })
  }
}

if (process.argv.includes('--authorize')) {
  const receipt = readJson(ADMISSION)

  if (
    receipt.ok !== true
    || receipt.status !== CANDIDATE_PASS
    || receipt.candidateContractPassed !== true
    || receipt.mainMutationAllowed !== false
  ) {
    fail(
      'E_CMS207M_R2_AUTHORIZE_WITHOUT_CANDIDATE_PASS',
      'cannot authorize source mutation without a passing candidate contract',
    )
  }

  writeReceipt({
    ...receipt,
    status: PASS,
    wholeRepoValidationPassed: true,
    mainMutationAllowed: true,
    authorizedAt: new Date().toISOString(),
  })

  console.log(PASS)
  process.exit(0)
}

const materialization = readJson(MATERIALIZATION)
const exported = readJson(EXPORT_PAYLOAD)
const taxonomy = readJson(TAXONOMY)

const generatedPath = String(materialization.generatedPath || '')
if (!/^src\/content\/pages\/.+\/index\.md$/.test(generatedPath)) {
  fail('E_CMS207M_R2_GENERATED_PATH_UNSAFE', generatedPath || 'missing')
}

if (!fs.existsSync(generatedPath)) {
  fail('E_CMS207M_R2_MATERIALIZED_SOURCE_MISSING', generatedPath)
}

const raw = fs.readFileSync(generatedPath, 'utf8')
const parsed = matter(raw)
const frontmatter =
  parsed.data && typeof parsed.data === 'object' && !Array.isArray(parsed.data)
    ? parsed.data
    : {}

const publicKinds = new Set(
  Array.isArray(taxonomy.publicKinds) ? taxonomy.publicKinds : [],
)
const publicCategories = new Set(
  Array.isArray(taxonomy.publicCategories) ? taxonomy.publicCategories : [],
)

if (
  typeof frontmatter.kind !== 'string'
  || !publicKinds.has(frontmatter.kind)
) {
  fail(
    'E_CMS207M_R2_TAXONOMY_KIND_DRIFT',
    'kind is outside taxonomy.publicKinds',
    { generatedPath, kind: frontmatter.kind },
  )
}

if (
  typeof frontmatter.category !== 'string'
  || !publicCategories.has(frontmatter.category)
) {
  fail(
    'E_CMS207M_R2_TAXONOMY_CATEGORY_DRIFT',
    'category is outside taxonomy.publicCategories',
    { generatedPath, category: frontmatter.category },
  )
}

if (frontmatter.source !== 'vacms') {
  fail(
    'E_CMS207M_R2_SOURCE_AUTHORITY_MISSING',
    'materialized source must be vacms',
    { generatedPath, source: frontmatter.source },
  )
}

if (
  typeof frontmatter.vacmsPageId !== 'string'
  || !frontmatter.vacmsPageId
) {
  fail(
    'E_CMS207M_R2_PAGE_ID_MISSING',
    'vacmsPageId missing',
    { generatedPath },
  )
}

if (
  typeof frontmatter.vacmsRevisionId !== 'string'
  || !frontmatter.vacmsRevisionId
) {
  fail(
    'E_CMS207M_R2_REVISION_ID_MISSING',
    'vacmsRevisionId missing',
    { generatedPath },
  )
}

if (frontmatter.vacmsProjectionSchema !== 'vacms-public-projection@1') {
  fail(
    'E_CMS207M_R2_PROJECTION_SCHEMA_DRIFT',
    'unexpected vacmsProjectionSchema',
    { generatedPath, value: frontmatter.vacmsProjectionSchema },
  )
}

const exportedFrontmatter = exported?.data?.revision?.frontmatter
const expected =
  exportedFrontmatter
  && typeof exportedFrontmatter === 'object'
  && !Array.isArray(exportedFrontmatter)
    ? exportedFrontmatter
    : {}

for (const [key, expectedValue] of Object.entries(expected)) {
  if (typeof expectedValue === 'boolean') {
    if (
      typeof frontmatter[key] !== 'boolean'
      || frontmatter[key] !== expectedValue
    ) {
      fail(
        'E_CMS207M_R2_BOOLEAN_TYPE_LOSS',
        key + ' lost boolean identity',
        {
          generatedPath,
          field: key,
          expectedValue,
          actualType: typeof frontmatter[key],
          actualValue: frontmatter[key],
        },
      )
    }
  }

  if (
    typeof expectedValue === 'number'
    && Number.isFinite(expectedValue)
  ) {
    if (
      typeof frontmatter[key] !== 'number'
      || frontmatter[key] !== expectedValue
    ) {
      fail(
        'E_CMS207M_R2_NUMBER_TYPE_LOSS',
        key + ' lost numeric identity',
        {
          generatedPath,
          field: key,
          expectedValue,
          actualType: typeof frontmatter[key],
          actualValue: frontmatter[key],
        },
      )
    }
  }
}

const stat = fs.statSync(generatedPath)

writeReceipt({
  ok: true,
  status: CANDIDATE_PASS,
  generatedPath,
  contentHash: materialization.contentHash || null,
  candidateByteLength: stat.size,
  pageId: materialization.pageId || null,
  revisionId: materialization.revisionId || null,
  kind: frontmatter.kind,
  category: frontmatter.category,
  vacmsPageId: frontmatter.vacmsPageId,
  vacmsRevisionId: frontmatter.vacmsRevisionId,
  taxonomyKindAccepted: true,
  taxonomyCategoryAccepted: true,
  primitiveTypesPreserved: true,
  candidateContractPassed: true,
  wholeRepoValidationPassed: false,
  mainMutationAllowed: false,
  generatedAt: new Date().toISOString(),
})

console.log(CANDIDATE_PASS)
