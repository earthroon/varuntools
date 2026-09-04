import fs from 'node:fs'
import path from 'node:path'
import { normalizeSlash, parseFrontmatter, readString } from './cms207m-public-projection.mjs'
import {
  derivePublicSnapshotIdentityFromMarkdown,
  maskPageProjectionBytes,
  stripSnapshotIdentityBytes,
} from './cms207m-public-snapshot-identity.mjs'

export const CMS207M_R1A_PATCH_ID = 'CMS-207M-R1A'
export const CMS207M_R1A_PASS = 'PASS_CMS_207M_R1A_SAME_PAGE_REVISION_REPLACEMENT'

export class Cms207mR1aError extends Error {
  constructor(code, message, details = {}) {
    super(message)
    this.name = 'Cms207mR1aError'
    this.code = code
    this.details = details
  }
}

export function failR1a(code, message, details = {}) {
  throw new Cms207mR1aError(code, message, details)
}

export function isSafeVacmsPagePath(value) {
  const file = normalizeSlash(value)
  if (!file || path.isAbsolute(file)) return false
  if (!file.startsWith('src/content/pages/')) return false
  if (!file.endsWith('/index.md')) return false
  if (file.includes('..') || file.includes('\\')) return false
  return !file.split('/').some((segment) => !segment || segment.startsWith('.'))
}

export function readVacmsMarkdownIdentity(markdown, sourcePath = '') {
  const frontmatter = parseFrontmatter(markdown)
  const source = readString(frontmatter.source) || 'repository'
  const pageId = readString(frontmatter.vacmsPageId)
  const revisionId = readString(frontmatter.vacmsRevisionId) || null
  const projectionSchema = readString(frontmatter.vacmsProjectionSchema) || null

  let snapshotIdentity = null
  if (source === 'vacms' && pageId && revisionId && projectionSchema) {
    try {
      snapshotIdentity = derivePublicSnapshotIdentityFromMarkdown(markdown, sourcePath)
    } catch (error) {
      if (error && typeof error === 'object' && typeof error.code === 'string') {
        failR1a(error.code, error.message || error.code, error.details || {})
      }
      throw error
    }
  }

  return {
    path: normalizeSlash(sourcePath),
    source,
    pageId,
    revisionId,
    projectionSchema,
    slug: readString(frontmatter.slug),
    title: readString(frontmatter.title),
    publicSnapshotSchema: snapshotIdentity?.publicSnapshotSchema || null,
    publicSnapshotHash: snapshotIdentity?.publicSnapshotHash || null,
    pageProjectionHash: snapshotIdentity?.pageProjectionHash || null,
    revisionProjectionHash: snapshotIdentity?.revisionProjectionHash || null,
    snapshotIdentityEmbedded: snapshotIdentity?.snapshotIdentityEmbedded === true,
  }
}

export function scanVacmsPageIdentity(records, pageId) {
  const exactPageId = String(pageId || '').trim()
  if (!exactPageId) failR1a('E_CMS207M_R1A_PAGE_ID_MISSING', 'Incoming VACMS pageId is missing.')
  return records
    .map((record) => ({ ...record, path: normalizeSlash(record.path) }))
    .filter((record) => record.source === 'vacms' && record.pageId === exactPageId)
    .sort((a, b) => a.path.localeCompare(b.path))
}

export function validateTargetPathOwnership(targetRecord, incomingPageId, incomingPath) {
  if (!targetRecord) return
  if (targetRecord.source === 'vacms') {
    if (targetRecord.pageId === incomingPageId) return
    failR1a(
      'E_CMS207M_R1A_TARGET_PATH_OWNED_BY_OTHER_VACMS_PAGE',
      `Target path is owned by another VACMS page: ${incomingPath}`,
      { incomingPageId, ownerPageId: targetRecord.pageId || null, incomingPath },
    )
  }
  failR1a(
    'E_CMS207M_R1A_TARGET_PATH_OWNED_BY_REPOSITORY_CONTENT',
    `Target path is owned by repository-authored content: ${incomingPath}`,
    { incomingPageId, incomingPath, ownerSource: targetRecord.source || 'repository' },
  )
}

export function classifyVacmsPageTransition({ predecessors, incomingPath, incomingRevisionId, currentContent = null }) {
  const currentPath = normalizeSlash(incomingPath)
  if (!isSafeVacmsPagePath(currentPath)) {
    failR1a('E_CMS207M_R1A_CURRENT_PATH_UNSAFE', `Incoming generatedPath is unsafe: ${currentPath}`)
  }
  if (typeof currentContent !== 'string') {
    failR1a('E_CMS207M_R3_R3_CURRENT_CONTENT_MISSING', 'Composite public snapshot classification requires current Markdown bytes.')
  }

  let incomingSnapshot
  try {
    incomingSnapshot = derivePublicSnapshotIdentityFromMarkdown(currentContent, currentPath)
  } catch (error) {
    if (error && typeof error === 'object' && typeof error.code === 'string') {
      failR1a(error.code, error.message || error.code, error.details || {})
    }
    throw error
  }

  if (predecessors.length > 1) {
    failR1a(
      'E_CMS207M_R1A_DUPLICATE_PAGE_IDENTITY_PATHS',
      'Multiple live public paths already claim the same VACMS pageId.',
      { predecessorPaths: predecessors.map((entry) => entry.path) },
    )
  }

  const withIdentity = (result, previous = null) => ({
    ...result,
    previousSnapshot: previous ? {
      publicSnapshotHash: previous.publicSnapshotHash || null,
      pageProjectionHash: previous.pageProjectionHash || null,
      revisionProjectionHash: previous.revisionProjectionHash || null,
      snapshotIdentityEmbedded: previous.snapshotIdentityEmbedded === true,
    } : null,
    incomingSnapshot: {
      publicSnapshotHash: incomingSnapshot.publicSnapshotHash,
      pageProjectionHash: incomingSnapshot.pageProjectionHash,
      revisionProjectionHash: incomingSnapshot.revisionProjectionHash,
      snapshotIdentityEmbedded: incomingSnapshot.snapshotIdentityEmbedded === true,
    },
  })

  if (predecessors.length === 0) {
    return withIdentity({
      transition: 'first_publish',
      previousRevisionId: null,
      retiredPaths: [],
    })
  }

  const previous = predecessors[0]
  if (normalizeSlash(previous.path) !== currentPath) {
    return withIdentity({
      transition: 'route_move',
      previousRevisionId: previous.revisionId || null,
      retiredPaths: [normalizeSlash(previous.path)],
    }, previous)
  }

  if ((previous.revisionId || null) !== (incomingRevisionId || null)) {
    return withIdentity({
      transition: 'in_place_revision_replacement',
      previousRevisionId: previous.revisionId || null,
      retiredPaths: [],
    }, previous)
  }

  if (!previous.revisionProjectionHash || !previous.pageProjectionHash || !previous.publicSnapshotHash) {
    failR1a(
      'E_CMS207M_R3_R3_PREVIOUS_SNAPSHOT_IDENTITY_MISSING',
      'Current predecessor cannot be classified without derived public snapshot identity.',
      { path: currentPath, revisionId: incomingRevisionId || null },
    )
  }

  if (previous.revisionProjectionHash !== incomingSnapshot.revisionProjectionHash) {
    failR1a(
      'E_CMS207M_R3_R3_SAME_REVISION_REVISION_PROJECTION_DRIFT',
      'The same VACMS revision changed revision-owned public material.',
      {
        path: currentPath,
        revisionId: incomingRevisionId || null,
        previousRevisionProjectionHash: previous.revisionProjectionHash,
        incomingRevisionProjectionHash: incomingSnapshot.revisionProjectionHash,
      },
    )
  }

  if (previous.pageProjectionHash !== incomingSnapshot.pageProjectionHash) {
    if (
      typeof previous.content !== 'string'
      || maskPageProjectionBytes(previous.content) !== maskPageProjectionBytes(currentContent)
    ) {
      failR1a(
        'E_CMS207M_R3_R3_METADATA_UPDATE_ESCAPED_PAGE_PROJECTION',
        'A same-revision metadata update changed bytes outside the page projection boundary.',
        { path: currentPath, revisionId: incomingRevisionId || null },
      )
    }
    return withIdentity({
      transition: 'metadata_projection_update',
      previousRevisionId: previous.revisionId || null,
      retiredPaths: [],
    }, previous)
  }

  if (
    previous.publicSnapshotHash === incomingSnapshot.publicSnapshotHash
    && typeof previous.content === 'string'
    && previous.content === currentContent
  ) {
    return withIdentity({
      transition: 'idempotent_noop',
      previousRevisionId: previous.revisionId || null,
      retiredPaths: [],
    }, previous)
  }

  if (
    previous.publicSnapshotHash === incomingSnapshot.publicSnapshotHash
    && previous.snapshotIdentityEmbedded !== true
    && incomingSnapshot.snapshotIdentityEmbedded === true
    && typeof previous.content === 'string'
    && stripSnapshotIdentityBytes(previous.content) === stripSnapshotIdentityBytes(currentContent)
  ) {
    return withIdentity({
      transition: 'snapshot_identity_bootstrap',
      previousRevisionId: previous.revisionId || null,
      retiredPaths: [],
    }, previous)
  }

  failR1a(
    'E_CMS207M_R3_R3_SAME_SNAPSHOT_CONTENT_DRIFT',
    'The same composite public snapshot produced different physical Markdown bytes.',
    {
      path: currentPath,
      revisionId: incomingRevisionId || null,
      previousPublicSnapshotHash: previous.publicSnapshotHash,
      incomingPublicSnapshotHash: incomingSnapshot.publicSnapshotHash,
    },
  )
}

export function assertCurrentPageIdentityParity({ records, pageId, incomingPath, incomingRevisionId, sidecar }) {
  const currentPath = normalizeSlash(incomingPath)
  const matching = scanVacmsPageIdentity(records, pageId)
  if (matching.length !== 1) {
    failR1a(
      'E_CMS207M_R1A_CURRENT_SNAPSHOT_PARITY_FAILED',
      `Expected exactly one current public Markdown for pageId ${pageId}; got ${matching.length}.`,
      { matchingPaths: matching.map((entry) => entry.path) },
    )
  }
  const current = matching[0]
  const projectedPageId = readString(sidecar?.page?.pageId)
  const projectedRevisionId = readString(sidecar?.page?.revisionId)
  if (
    current.path !== currentPath
    || current.revisionId !== incomingRevisionId
    || projectedPageId !== pageId
    || projectedRevisionId !== incomingRevisionId
  ) {
    failR1a(
      'E_CMS207M_R1A_CURRENT_SNAPSHOT_PARITY_FAILED',
      'Current Markdown, generatedPath, and projection sidecar do not agree on page/revision identity.',
      {
        pageId,
        incomingRevisionId,
        incomingPath: currentPath,
        currentPath: current.path,
        currentRevisionId: current.revisionId,
        projectedPageId,
        projectedRevisionId,
      },
    )
  }
  return current
}

export function collectWorktreeMarkdownRecords(rootDir) {
  const contentRoot = path.join(rootDir, 'src', 'content', 'pages')
  const records = []
  if (!fs.existsSync(contentRoot)) return records
  const stack = [contentRoot]
  while (stack.length) {
    const current = stack.pop()
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) stack.push(full)
      else if (entry.isFile() && entry.name === 'index.md') {
        const rel = normalizeSlash(path.relative(rootDir, full))
        const content = fs.readFileSync(full, 'utf8')
        records.push({ ...readVacmsMarkdownIdentity(content, rel), content })
      }
    }
  }
  return records.sort((a, b) => a.path.localeCompare(b.path))
}
