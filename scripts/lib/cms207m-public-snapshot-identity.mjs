import { createHash } from 'node:crypto'
import { parseFrontmatter, readString } from './cms207m-public-projection.mjs'

export const CMS207M_R3_R3_PUBLIC_SNAPSHOT_SCHEMA = 'vacms-public-materialization-snapshot@1'

const PAGE_PROJECTION_KEYS = Object.freeze([
  'title',
  'summary',
  'category',
  'slug',
  'vacmsSlug',
])

const TRANSPORT_IDENTITY_KEYS = new Set([
  'source',
  'vacmsPageId',
  'vacmsRevisionId',
  'vacmsProjectionSchema',
])

const SNAPSHOT_BOOKKEEPING_KEYS = new Set([
  'vacmsPublicSnapshotSchema',
  'vacmsPublicSnapshotHash',
])

function fail(code, message, details = {}) {
  const error = new Error(message)
  error.name = 'Cms207mPublicSnapshotIdentityError'
  error.code = code
  error.details = details
  throw error
}

function canonicalize(value) {
  if (value === undefined || value === null) return null
  if (Array.isArray(value)) return value.map((item) => canonicalize(item))
  if (typeof value === 'object') {
    const output = {}
    for (const key of Object.keys(value).sort()) {
      if (value[key] !== undefined) output[key] = canonicalize(value[key])
    }
    return output
  }
  return value
}

function hashCanonical(value) {
  return 'sha256:' + createHash('sha256')
    .update(JSON.stringify(canonicalize(value)), 'utf8')
    .digest('hex')
}

function normalizePath(value) {
  return String(value || '').replace(/\\/g, '/').trim()
}

function normalizeBody(value) {
  return String(value ?? '').replace(/\r\n/g, '\n')
}

function splitMarkdownDocument(markdown) {
  const source = String(markdown || '').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const opening = source.match(/^---\n[\s\S]*?\n---(?=\n|$)/)
  if (!opening) {
    fail(
      'E_CMS207M_R3_R3_SNAPSHOT_FRONTMATTER_MISSING',
      'VACMS public Markdown does not contain a canonical frontmatter envelope.',
    )
  }

  let bodyStart = opening[0].length
  if (source.slice(bodyStart, bodyStart + 2) === '\n\n') bodyStart += 2
  else if (source[bodyStart] === '\n') bodyStart += 1

  return {
    source,
    frontmatter: parseFrontmatter(source),
    body: source.slice(bodyStart),
  }
}

function pickPageProjection(frontmatter) {
  const out = {}
  for (const key of PAGE_PROJECTION_KEYS) out[key] = frontmatter?.[key] ?? null
  return out
}

function pickRevisionProjection(frontmatter, body) {
  const projectedFrontmatter = {}
  for (const key of Object.keys(frontmatter || {}).sort()) {
    if (PAGE_PROJECTION_KEYS.includes(key)) continue
    if (TRANSPORT_IDENTITY_KEYS.has(key)) continue
    if (SNAPSHOT_BOOKKEEPING_KEYS.has(key)) continue
    projectedFrontmatter[key] = frontmatter[key]
  }
  return {
    frontmatter: projectedFrontmatter,
    body: normalizeBody(body),
  }
}

function deriveParsedMaterializedIdentity({
  frontmatter,
  body,
  generatedPath,
}) {
  const pageId = readString(frontmatter?.vacmsPageId)
  const revisionId = readString(frontmatter?.vacmsRevisionId)
  const source = readString(frontmatter?.source)
  const projectionSchema = readString(frontmatter?.vacmsProjectionSchema)
  const normalizedGeneratedPath = normalizePath(generatedPath)

  if (!pageId) {
    fail('E_CMS207M_R3_R3_SNAPSHOT_PAGE_ID_MISSING', 'vacmsPageId is required for public snapshot identity.')
  }
  if (!revisionId) {
    fail('E_CMS207M_R3_R3_SNAPSHOT_REVISION_ID_MISSING', 'vacmsRevisionId is required for public snapshot identity.')
  }
  if (source !== 'vacms') {
    fail('E_CMS207M_R3_R3_SNAPSHOT_SOURCE_INVALID', 'public snapshot source must be vacms.')
  }
  if (projectionSchema !== 'vacms-public-projection@1') {
    fail('E_CMS207M_R3_R3_SNAPSHOT_PROJECTION_SCHEMA_INVALID', 'vacmsProjectionSchema is invalid.')
  }
  if (!normalizedGeneratedPath) {
    fail('E_CMS207M_R3_R3_SNAPSHOT_PATH_MISSING', 'generatedPath is required for public snapshot identity.')
  }

  const pageProjection = pickPageProjection(frontmatter)
  const revisionProjection = pickRevisionProjection(frontmatter, body)
  const pageProjectionHash = hashCanonical(pageProjection)
  const revisionProjectionHash = hashCanonical(revisionProjection)
  const publicSnapshotHash = hashCanonical({
    schema: CMS207M_R3_R3_PUBLIC_SNAPSHOT_SCHEMA,
    pageId,
    revisionId,
    generatedPath: normalizedGeneratedPath,
    source,
    projectionSchema,
    pageProjectionHash,
    revisionProjectionHash,
  })

  return {
    publicSnapshotSchema: CMS207M_R3_R3_PUBLIC_SNAPSHOT_SCHEMA,
    publicSnapshotHash,
    pageProjectionHash,
    revisionProjectionHash,
    pageProjection,
    revisionProjection,
  }
}

export function derivePublicSnapshotIdentityFromMarkdown(markdown, generatedPath, {
  validateEmbedded = true,
} = {}) {
  const document = splitMarkdownDocument(markdown)
  const derived = deriveParsedMaterializedIdentity({
    frontmatter: document.frontmatter,
    body: document.body,
    generatedPath,
  })

  const embeddedSchema = readString(document.frontmatter?.vacmsPublicSnapshotSchema)
  const embeddedHash = readString(document.frontmatter?.vacmsPublicSnapshotHash)
  const snapshotIdentityEmbedded = Boolean(embeddedSchema || embeddedHash)

  if (validateEmbedded && snapshotIdentityEmbedded) {
    if (
      embeddedSchema !== CMS207M_R3_R3_PUBLIC_SNAPSHOT_SCHEMA
      || !embeddedHash
    ) {
      fail(
        'E_CMS207M_R3_R3_SNAPSHOT_SCHEMA_MISMATCH',
        'Embedded public snapshot identity is incomplete or uses an unknown schema.',
        { embeddedSchema, embeddedHashPresent: Boolean(embeddedHash) },
      )
    }

    if (embeddedHash !== derived.publicSnapshotHash) {
      fail(
        'E_CMS207M_R3_R3_EMBEDDED_SNAPSHOT_HASH_MISMATCH',
        'Embedded public snapshot hash does not match the materialized Markdown semantics.',
        { embeddedHash, derivedHash: derived.publicSnapshotHash },
      )
    }
  }

  return {
    ...derived,
    frontmatter: document.frontmatter,
    body: document.body,
    snapshotIdentityEmbedded,
    embeddedPublicSnapshotSchema: embeddedSchema || null,
    embeddedPublicSnapshotHash: embeddedHash || null,
  }
}

function rewriteFrontmatterLines(markdown, transform) {
  const source = String(markdown || '').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const opening = source.match(/^---\n[\s\S]*?\n---(?=\n|$)/)
  if (!opening) return source

  const frontmatterText = opening[0].slice(4, -4)
  const suffix = source.slice(opening[0].length)
  const nextLines = []

  for (const line of frontmatterText.split('\n')) {
    const match = line.match(/^([A-Za-z0-9_.-]+):(.*)$/)
    if (!match) {
      nextLines.push(line)
      continue
    }

    const transformed = transform(match[1], line)
    if (transformed !== null) nextLines.push(transformed)
  }

  return '---\n' + nextLines.join('\n') + '\n---' + suffix
}

export function maskPageProjectionBytes(markdown) {
  return rewriteFrontmatterLines(markdown, (key, line) => {
    if (SNAPSHOT_BOOKKEEPING_KEYS.has(key)) return null
    if (PAGE_PROJECTION_KEYS.includes(key)) return `${key}: __VACMS_PAGE_PROJECTION__`
    return line
  })
}

export function stripSnapshotIdentityBytes(markdown) {
  return rewriteFrontmatterLines(markdown, (key, line) => {
    if (SNAPSHOT_BOOKKEEPING_KEYS.has(key)) return null
    return line
  })
}

export function isPageProjectionKey(key) {
  return PAGE_PROJECTION_KEYS.includes(String(key || ''))
}
