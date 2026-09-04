#!/usr/bin/env node
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { derivePublicSnapshotIdentityFromMarkdown } from './lib/cms207m-public-snapshot-identity.mjs'
import { classifyVacmsPageTransition, readVacmsMarkdownIdentity } from './lib/cms207m-r1a-page-identity.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const MATERIALIZER = path.join(HERE, 'materialize-vacms-public-page.mjs')

function materializeFixture({
  generatedPath = 'src/content/pages/post/fixture/index.md',
  routePath = 'post/fixture',
  revisionId = 'rev_1',
  title = '빠르게 이해되고 오래 남는 결과',
  summary = '복잡한 과정을 반복 가능한 구조로 바꿉니다.',
  category = 'post',
  body = '한국어 본문\n두 번째 줄\n',
} = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cms207m-r3-r3-r1-'))
  try {
    const payload = {
      ok: true,
      data: {
        schemaVersion: 'vacms-publish-export-payload@r4',
        job: { id: 'pubjob_fixture', pageId: 'page_fixture', revisionId },
        page: { id: 'page_fixture', slug: 'fixture', title, summary, category },
        revision: {
          id: revisionId,
          sourceBody: body,
          compiledMarkdown: '',
          frontmatter: {
            schema: { packId: 'post', packVersion: 'cms-schema-pack-v1' },
            kind: 'post',
            visibility: 'public',
            exposure: {
              route: true, home: false, collection: 'post', search: true,
              sitemap: true, nav: false, featured: false, routeOnly: false,
            },
            publishedDate: '2026-09-04',
            series: 1,
            mood: '차분',
            relatedLinks: [],
            tags: [],
            status: 'active',
            noindex: false,
            robots: 'index,follow',
          },
        },
        snapshot: { generatedPath, routePath },
        publicProjection: {
          schemaVersion: 'vacms-public-projection@1',
          page: { pageId: 'page_fixture', revisionId },
          assets: [],
        },
      },
    }

    fs.writeFileSync(path.join(root, 'export-payload.json'), JSON.stringify(payload, null, 2) + '\n', 'utf8')
    const result = spawnSync(process.execPath, [MATERIALIZER, '--workflow'], {
      cwd: root, encoding: 'utf8', shell: false,
    })
    if (result.status !== 0) {
      throw new Error('materializer fixture failed\n' + [result.stdout, result.stderr].filter(Boolean).join('\n'))
    }
    const content = fs.readFileSync(path.join(root, generatedPath), 'utf8')
    const receipt = JSON.parse(fs.readFileSync(path.join(root, 'vacms-materialization-receipt.json'), 'utf8'))
    return { content, receipt, generatedPath, revisionId }
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
}

function record(markdown, filePath) {
  return { ...readVacmsMarkdownIdentity(markdown, filePath), content: markdown }
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

function stripSnapshotIdentity(markdown) {
  return String(markdown)
    .replace(/^vacmsPublicSnapshotSchema:.*\r?\n/m, '')
    .replace(/^vacmsPublicSnapshotHash:.*\r?\n/m, '')
}

const base = materializeFixture()
const physicalIdentity = derivePublicSnapshotIdentityFromMarkdown(base.content, base.generatedPath)

assert.equal(base.receipt.snapshotAuthority, 'materialized-markdown')
assert.equal(base.receipt.snapshotSealPhase, 'post-serialize-disk-readback')
assert.equal(base.receipt.snapshotPhysicalReadbackVerified, true)
assert.equal(base.receipt.publicSnapshotHash, physicalIdentity.publicSnapshotHash)
assert.equal(base.receipt.pageProjectionHash, physicalIdentity.pageProjectionHash)
assert.equal(base.receipt.revisionProjectionHash, physicalIdentity.revisionProjectionHash)

assert.match(base.content, /^schema: "\{\\"packId\\":\\"post\\",\\"packVersion\\":\\"cms-schema-pack-v1\\"\}"$/m)
assert.match(base.content, /^exposure: "\{\\"route\\":true,/m)
assert.match(base.content, /^relatedLinks: \[\]$/m)
assert.match(base.content, /^tags: \[\]$/m)
assert.match(base.content, /^noindex: false$/m)
assert.match(base.content, /^series: 1$/m)
assert.match(base.content, /한국어 본문/)
assert.match(base.content, /^vacmsPublicSnapshotHash: "sha256:[a-f0-9]{64}"$/m)

const legacy = stripSnapshotIdentity(base.content)
assert.equal(classify(null, base.content).transition, 'first_publish')
assert.equal(classify(base.content, base.content).transition, 'idempotent_noop')
assert.equal(classify(legacy, base.content).transition, 'snapshot_identity_bootstrap')

const titleChanged = materializeFixture({ title: '새로운 제목' })
assert.equal(classify(legacy, titleChanged.content).transition, 'metadata_projection_update')
const summaryChanged = materializeFixture({ summary: '새로운 요약입니다.' })
assert.equal(classify(legacy, summaryChanged.content).transition, 'metadata_projection_update')
assert.equal(classify(titleChanged.content, titleChanged.content).transition, 'idempotent_noop')

const revisionChanged = materializeFixture({ revisionId: 'rev_2' })
assert.equal(classify(base.content, revisionChanged.content, { incomingRevisionId: 'rev_2' }).transition, 'in_place_revision_replacement')

const routeMoved = materializeFixture({
  generatedPath: 'src/content/pages/lab/fixture/index.md',
  routePath: 'lab/fixture',
})
assert.equal(classify(base.content, routeMoved.content, {
  previousPath: 'src/content/pages/post/fixture/index.md',
  incomingPath: 'src/content/pages/lab/fixture/index.md',
  incomingRevisionId: 'rev_1',
}).transition, 'route_move')

const bodyChanged = materializeFixture({ body: '변경된 본문\n' })
assert.throws(() => classify(base.content, bodyChanged.content),
  (error) => error?.code === 'E_CMS207M_R3_R3_SAME_REVISION_REVISION_PROJECTION_DRIFT')

const representationDrift = base.content.replace('\n---\n\n', '\n# representation-only physical drift\n---\n\n')
assert.throws(() => classify(base.content, representationDrift),
  (error) => error?.code === 'E_CMS207M_R3_R3_SAME_SNAPSHOT_CONTENT_DRIFT')

const forged = base.content.replace(/vacmsPublicSnapshotHash: "sha256:[a-f0-9]{64}"/, 'vacmsPublicSnapshotHash: "sha256:forged"')
assert.throws(() => readVacmsMarkdownIdentity(forged, base.generatedPath),
  (error) => error?.code === 'E_CMS207M_R3_R3_EMBEDDED_SNAPSHOT_HASH_MISMATCH')

console.log('PASS_CMS_207M_R3_R3_R1_MATERIALIZED_REPRESENTATION_SINGLE_AUTHORITY')
