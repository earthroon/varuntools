#!/usr/bin/env node
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const RECONCILE = path.join(HERE, 'cms207m-r1a-reconcile-page-identity.mjs')
const BUILDER = path.join(HERE, 'build-public-content-projection.mjs')
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cms207m-r1a-route-'))

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
function page(revision, slug) {
  return `---\nsource: "vacms"\nvacmsPageId: "page_a"\nvacmsRevisionId: "${revision}"\nvacmsProjectionSchema: "vacms-public-projection@1"\nslug: "${slug}"\ntitle: "title"\n---\n\nbody\n`
}

try {
  const oldPath = 'src/content/pages/post/alpha/index.md'
  const newPath = 'src/content/pages/lab/alpha/index.md'
  write('config/public-content-taxonomy.json', '{}\n')
  write(oldPath, page('rev_1', 'post/alpha'))
  run('git', ['init', '-b', 'main'])
  run('git', ['config', 'user.name', 'fixture'])
  run('git', ['config', 'user.email', 'fixture@example.invalid'])
  run('git', ['add', '.'])
  run('git', ['commit', '-m', 'baseline'])

  write(newPath, page('rev_2', 'lab/alpha'))
  write('src/content/generated/vacms-pages/page_a.projection.json', JSON.stringify({
    schemaVersion: 'vacms-public-projection@1',
    page: { pageId: 'page_a', revisionId: 'rev_2' },
    assets: [],
  }, null, 2) + '\n')
  write('vacms-materialization-receipt.json', JSON.stringify({
    jobId: 'pubjob_fixture',
    pageId: 'page_a',
    revisionId: 'rev_2',
    generatedPath: newPath,
    projectionSidecarPath: 'src/content/generated/vacms-pages/page_a.projection.json',
    materializedSlug: 'lab/alpha',
  }, null, 2) + '\n')

  const output = run(process.execPath, [RECONCILE, '--workflow'])
  assert.match(output, /transition=route_move/)
  assert.equal(fs.existsSync(path.join(root, oldPath)), false)
  assert.equal(fs.existsSync(path.join(root, newPath)), true)
  const receipt = JSON.parse(fs.readFileSync(path.join(root, 'vacms-materialization-receipt.json'), 'utf8'))
  assert.equal(receipt.transition, 'route_move')
  assert.deepEqual(receipt.retiredPaths, [oldPath])
  assert.equal(receipt.predecessorRetirementCompleted, true)

  const projectionBuild = run(process.execPath, [BUILDER])
  assert.match(projectionBuild, /PASS_CMS_207M_R1_PUBLIC_CONTENT_PROJECTION_BUILD/)
  const projection = JSON.parse(fs.readFileSync(path.join(root, 'src/content/generated/publicContentProjection.generated.json'), 'utf8'))
  assert.equal(projection.entries.filter((entry) => entry.vacmsPageId === 'page_a').length, 1)
  assert.equal(projection.entries.find((entry) => entry.vacmsPageId === 'page_a')?.vacmsRevisionId, 'rev_2')

  console.log('PASS_CMS_207M_R1A_ROUTE_MOVE_DELETE_PREDECESSOR_SMOKE')
} finally {
  fs.rmSync(root, { recursive: true, force: true })
}
