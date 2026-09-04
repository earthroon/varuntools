#!/usr/bin/env node
import assert from 'node:assert/strict'
import {
  CMS207M_R3_R3_PUBLIC_SNAPSHOT_SCHEMA,
  derivePublicSnapshotIdentityFromParts,
} from './lib/cms207m-public-snapshot-identity.mjs'
import {
  classifyVacmsPageTransition,
  readVacmsMarkdownIdentity,
} from './lib/cms207m-r1a-page-identity.mjs'

function serialize({
  path = 'src/content/pages/post/fixture/index.md',
  revisionId = 'rev_1',
  title = 'Title A',
  summary = 'Summary A',
  category = 'post',
  slug = 'post/fixture',
  body = 'body\n',
  embedded = true,
  extra = {},
}) {
  const frontmatter = {
    kind: 'post',
    visibility: 'public',
    category,
    title,
    summary,
    slug,
    source: 'vacms',
    vacmsSlug: 'fixture',
    vacmsPageId: 'page_fixture',
    vacmsRevisionId: revisionId,
    vacmsProjectionSchema: 'vacms-public-projection@1',
    ...extra,
  }

  if (embedded) {
    const identity = derivePublicSnapshotIdentityFromParts({
      frontmatter,
      body,
      generatedPath: path,
    })
    frontmatter.vacmsPublicSnapshotSchema = CMS207M_R3_R3_PUBLIC_SNAPSHOT_SCHEMA
    frontmatter.vacmsPublicSnapshotHash = identity.publicSnapshotHash
  }

  const yaml = Object.entries(frontmatter)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join('\n')

  return `---\n${yaml}\n---\n\n${body}`
}

function record(markdown, path) {
  return {
    ...readVacmsMarkdownIdentity(markdown, path),
    content: markdown,
  }
}

function classify(previousMarkdown, incomingMarkdown, {
  previousPath = 'src/content/pages/post/fixture/index.md',
  incomingPath = previousPath,
  incomingRevisionId = 'rev_1',
} = {}) {
  return classifyVacmsPageTransition({
    predecessors: previousMarkdown ? [record(previousMarkdown, previousPath)] : [],
    incomingPath,
    incomingRevisionId,
    currentContent: incomingMarkdown,
  })
}

const baseLegacy = serialize({ embedded: false })
const baseEmbedded = serialize({ embedded: true })

assert.equal(classify(null, baseEmbedded).transition, 'first_publish')
assert.equal(classify(baseEmbedded, baseEmbedded).transition, 'idempotent_noop')
assert.equal(classify(baseLegacy, baseEmbedded).transition, 'snapshot_identity_bootstrap')

assert.equal(
  classify(baseLegacy, serialize({ title: 'Title B', embedded: true })).transition,
  'metadata_projection_update',
)

assert.equal(
  classify(baseLegacy, serialize({ summary: 'Summary B', embedded: true })).transition,
  'metadata_projection_update',
)

assert.equal(
  classify(baseLegacy, serialize({ category: 'case-study', embedded: true })).transition,
  'metadata_projection_update',
)

assert.equal(
  classify(
    baseLegacy,
    serialize({
      path: 'src/content/pages/lab/fixture/index.md',
      slug: 'lab/fixture',
      embedded: true,
    }),
    {
      previousPath: 'src/content/pages/post/fixture/index.md',
      incomingPath: 'src/content/pages/lab/fixture/index.md',
      incomingRevisionId: 'rev_1',
    },
  ).transition,
  'route_move',
)

assert.equal(
  classify(
    baseEmbedded,
    serialize({ revisionId: 'rev_2', embedded: true }),
    { incomingRevisionId: 'rev_2' },
  ).transition,
  'in_place_revision_replacement',
)

assert.throws(
  () => classify(baseEmbedded, serialize({ body: 'different body\n', embedded: true })),
  (error) => error?.code === 'E_CMS207M_R3_R3_SAME_REVISION_REVISION_PROJECTION_DRIFT',
)

assert.throws(
  () => classify(
    baseEmbedded,
    serialize({ title: 'Title B', body: 'different body\n', embedded: true }),
  ),
  (error) => error?.code === 'E_CMS207M_R3_R3_SAME_REVISION_REVISION_PROJECTION_DRIFT',
)

const forged = baseEmbedded.replace(
  /vacmsPublicSnapshotHash: "[^"]+"/,
  'vacmsPublicSnapshotHash: "sha256:forged"',
)

assert.throws(
  () => readVacmsMarkdownIdentity(forged, 'src/content/pages/post/fixture/index.md'),
  (error) => error?.code === 'E_CMS207M_R3_R3_EMBEDDED_SNAPSHOT_HASH_MISMATCH',
)

console.log('PASS_CMS_207M_R3_R3_PUBLIC_MATERIALIZATION_COMPOSITE_SNAPSHOT_IDENTITY')
