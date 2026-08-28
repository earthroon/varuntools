#!/usr/bin/env node
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const RECONCILE = path.join(HERE, 'cms207m-r1a-reconcile-page-identity.mjs')
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cms207m-r1a-inplace-'))

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', shell: false })
  if (result.status !== 0) throw new Error([result.stdout, result.stderr].filter(Boolean).join('\n'))
  return result.stdout
}
function write(rel, content) {
  const file = path.join(root, rel)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, content, 'utf8')
}
function page(revision, title) {
  return `---\nsource: "vacms"\nvacmsPageId: "page_a"\nvacmsRevisionId: "${revision}"\nvacmsProjectionSchema: "vacms-public-projection@1"\nslug: "post/alpha"\ntitle: "${title}"\n---\n\nbody\n`
}

try {
  write('src/content/pages/post/alpha/index.md', page('rev_1', 'old title'))
  run('git', ['init', '-b', 'main'])
  run('git', ['config', 'user.name', 'fixture'])
  run('git', ['config', 'user.email', 'fixture@example.invalid'])
  run('git', ['add', '.'])
  run('git', ['commit', '-m', 'baseline'])

  write('src/content/pages/post/alpha/index.md', page('rev_2', 'new title'))
  write('src/content/generated/vacms-pages/page_a.projection.json', JSON.stringify({
    schemaVersion: 'vacms-public-projection@1',
    page: { pageId: 'page_a', revisionId: 'rev_2' },
    assets: [],
  }, null, 2) + '\n')
  write('vacms-materialization-receipt.json', JSON.stringify({
    jobId: 'pubjob_fixture',
    pageId: 'page_a',
    revisionId: 'rev_2',
    generatedPath: 'src/content/pages/post/alpha/index.md',
    projectionSidecarPath: 'src/content/generated/vacms-pages/page_a.projection.json',
    materializedSlug: 'post/alpha',
  }, null, 2) + '\n')

  const output = run(process.execPath, [RECONCILE, '--workflow'])
  assert.match(output, /PASS_CMS_207M_R1A_SAME_PAGE_REVISION_REPLACEMENT/)
  const receipt = JSON.parse(fs.readFileSync(path.join(root, 'vacms-materialization-receipt.json'), 'utf8'))
  assert.equal(receipt.transition, 'in_place_revision_replacement')
  assert.equal(receipt.previousRevisionId, 'rev_1')
  assert.equal(receipt.incomingRevisionId, 'rev_2')
  assert.deepEqual(receipt.retiredPaths, [])
  assert.equal(receipt.currentSnapshotParity, true)
  assert.match(fs.readFileSync(path.join(root, 'src/content/pages/post/alpha/index.md'), 'utf8'), /new title/)

  console.log('PASS_CMS_207M_R1A_IN_PLACE_PUBLIC_SNAPSHOT_UPDATE_SMOKE')
} finally {
  fs.rmSync(root, { recursive: true, force: true })
}
