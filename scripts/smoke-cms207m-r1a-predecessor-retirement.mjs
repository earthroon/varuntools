#!/usr/bin/env node
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const COMMIT_SCRIPT = path.join(HERE, 'commit-vacms-materialized-source.mjs')
const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'cms207m-r1a-commit-'))
const root = path.join(sandbox, 'work')
const remote = path.join(sandbox, 'remote.git')
fs.mkdirSync(root, { recursive: true })

function run(cwd, command, args) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', shell: false })
  if (result.status !== 0) throw new Error([result.stdout, result.stderr].filter(Boolean).join('\n'))
  return String(result.stdout || '')
}
function write(rel, content) {
  const file = path.join(root, rel)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, content, 'utf8')
}
function page(revision, slug) {
  return `---\nsource: "vacms"\nvacmsPageId: "page_a"\nvacmsRevisionId: "${revision}"\nvacmsProjectionSchema: "vacms-public-projection@1"\nslug: "${slug}"\ntitle: "title"\n---\n\nbody\n`
}

try {
  run(sandbox, 'git', ['init', '--bare', remote])
  run(root, 'git', ['init', '-b', 'main'])
  run(root, 'git', ['config', 'user.name', 'fixture'])
  run(root, 'git', ['config', 'user.email', 'fixture@example.invalid'])
  run(root, 'git', ['remote', 'add', 'origin', remote])

  const oldPath = 'src/content/pages/post/alpha/index.md'
  const newPath = 'src/content/pages/lab/alpha/index.md'
  write(oldPath, page('rev_1', 'post/alpha'))
  run(root, 'git', ['add', '.'])
  run(root, 'git', ['commit', '-m', 'baseline'])
  run(root, 'git', ['push', '-u', 'origin', 'main'])

  fs.rmSync(path.join(root, oldPath))
  write(newPath, page('rev_2', 'lab/alpha'))
  write('src/content/generated/vacms-pages/page_a.projection.json', JSON.stringify({
    schemaVersion: 'vacms-public-projection@1',
    page: { pageId: 'page_a', revisionId: 'rev_2' },
    assets: [],
  }, null, 2) + '\n')
  write('src/content/generated/publicContentProjection.generated.json', '{}\n')
  write('src/content/generated/publicAssetManifest.generated.json', '{}\n')
  write('src/content/generated/homeCollections.generated.json', '{}\n')
  write('vacms-materialization-receipt.json', JSON.stringify({
    jobId: 'pubjob_fixture',
    pageId: 'page_a',
    revisionId: 'rev_2',
    incomingRevisionId: 'rev_2',
    previousRevisionId: 'rev_1',
    generatedPath: newPath,
    projectionSidecarPath: 'src/content/generated/vacms-pages/page_a.projection.json',
    materializedSlug: 'lab/alpha',
    samePageRevisionPatchId: 'CMS-207M-R1A',
    transition: 'route_move',
    retiredPaths: [oldPath],
    contentHash: 'fixture',
  }, null, 2) + '\n')

  const output = run(root, process.execPath, [COMMIT_SCRIPT, '--workflow'])
  assert.match(output, /PASS_CMS_207A_R1_VACMS_PUBLISH_INCREMENTAL_SOURCE_COMMIT_RUNTIME_RECEIPT_DIRTY_ALLOWED_SEAL/)
  const status = run(root, 'git', ['show', '--format=', '--no-renames', '--name-status', 'HEAD'])
  assert.match(status, new RegExp(`D\\s+${oldPath.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}`))
  assert.match(status, new RegExp(`A\\s+${newPath.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}`))
  const remoteNew = run(root, 'git', ['--git-dir', remote, 'show', `main:${newPath}`])
  assert.match(remoteNew, /rev_2/)
  const remoteOld = spawnSync('git', ['--git-dir', remote, 'cat-file', '-e', `main:${oldPath}`], { cwd: root, encoding: 'utf8', shell: false })
  assert.notEqual(remoteOld.status, 0)
  const receipt = JSON.parse(fs.readFileSync(path.join(root, 'vacms-source-commit-receipt.json'), 'utf8'))
  assert.deepEqual(receipt.retiredPredecessorPaths, [oldPath])
  assert.equal(receipt.pageTransition, 'route_move')

  console.log('PASS_CMS_207M_R1A_DELETE_AND_COMMIT_PREDECESSOR_SMOKE')
} finally {
  fs.rmSync(sandbox, { recursive: true, force: true })
}
