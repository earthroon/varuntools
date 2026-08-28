#!/usr/bin/env node
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const BUILDER = path.join(HERE, 'build-public-content-projection.mjs')
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cms207m-r1a-parity-'))

function write(rel, content) {
  const file = path.join(root, rel)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, content, 'utf8')
}
function page(slug) {
  return `---\nsource: "vacms"\nvacmsPageId: "page_a"\nvacmsRevisionId: "rev_2"\nvacmsProjectionSchema: "vacms-public-projection@1"\nslug: "${slug}"\ntitle: "title"\ncategory: "post"\nstatus: "active"\nvisibility: "public"\n---\n\nbody\n`
}

try {
  write('config/public-content-taxonomy.json', '{}\n')
  write('src/content/generated/vacms-pages/page_a.projection.json', JSON.stringify({
    schemaVersion: 'vacms-public-projection@1',
    page: {
      pageId: 'page_a',
      revisionId: 'rev_2',
      timing: { revisionCreatedAt: '2026-08-29T00:00:00Z' },
    },
    assets: [],
  }, null, 2) + '\n')
  write('src/content/pages/post/alpha/index.md', page('post/alpha'))
  write('src/content/pages/post/duplicate/index.md', page('post/duplicate'))

  const blocked = spawnSync(process.execPath, [BUILDER], { cwd: root, encoding: 'utf8', shell: false })
  assert.notEqual(blocked.status, 0)
  assert.match(`${blocked.stdout}\n${blocked.stderr}`, /E_CMS207M_R1A_DUPLICATE_PAGE_IDENTITY_PATHS/)

  fs.rmSync(path.join(root, 'src/content/pages/post/duplicate'), { recursive: true, force: true })
  const pass = spawnSync(process.execPath, [BUILDER], { cwd: root, encoding: 'utf8', shell: false })
  if (pass.status !== 0) throw new Error([pass.stdout, pass.stderr].filter(Boolean).join('\n'))
  assert.match(pass.stdout, /PASS_CMS_207M_R1_PUBLIC_CONTENT_PROJECTION_BUILD/)
  const projection = JSON.parse(fs.readFileSync(path.join(root, 'src/content/generated/publicContentProjection.generated.json'), 'utf8'))
  assert.equal(projection.entries.filter((entry) => entry.vacmsPageId === 'page_a').length, 1)

  console.log('PASS_CMS_207M_R1A_CURRENT_SNAPSHOT_PARITY_SMOKE')
} finally {
  fs.rmSync(root, { recursive: true, force: true })
}
