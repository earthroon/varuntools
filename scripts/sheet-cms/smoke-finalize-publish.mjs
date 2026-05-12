#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const tmp = path.join(root, '.tmp', 'sheet-cms-finalize-smoke')
const rawDir = path.join(tmp, 'raw')
const reportPath = path.join(tmp, 'finalize-publish.generated.json')

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`)
}

async function main() {
  await fs.rm(tmp, { recursive: true, force: true })
  await fs.mkdir(rawDir, { recursive: true })

  await writeJson(path.join(rawDir, 'pages.raw.json'), {
    rows: [
      { __rowNumber: 2, pageId: 'alpha-work', visible: 'Y', status: 'published' },
      { __rowNumber: 3, pageId: 'draft-work', visible: 'Y', status: 'draft' },
      { __rowNumber: 4, pageId: 'hidden-work', visible: 'Y', status: 'hidden' },
      { __rowNumber: 5, pageId: 'off-work', visible: 'N', status: 'published' },
    ],
  })
  await writeJson(path.join(rawDir, 'blocks.raw.json'), {
    rows: [
      { __rowNumber: 2, pageId: 'alpha-work', visible: 'Y' },
      { __rowNumber: 3, pageId: 'block-only-work', visible: 'Y' },
      { __rowNumber: 4, pageId: 'off-block-work', visible: 'N' },
    ],
  })
  await writeJson(path.join(rawDir, 'assets.raw.json'), {
    rows: [
      { __rowNumber: 2, pageId: 'alpha-work', assetId: 'cover', visible: 'Y' },
      { __rowNumber: 3, pageId: 'asset-only-work', assetId: 'cover', visible: 'Y' },
      { __rowNumber: 4, pageId: 'off-asset-work', assetId: 'cover', visible: '' },
    ],
  })

  const result = spawnSync(process.execPath, [
    'scripts/sheet-cms/finalize-publish.mjs',
    '--raw-dir', rawDir,
    '--report', reportPath,
    '--request-id', 'pub_smoke',
    '--commit-sha', 'abc123',
    '--action-run-url', 'https://github.com/earthroon/varuntools/actions/runs/1',
    '--dry-run',
  ], {
    cwd: root,
    encoding: 'utf8',
  })

  process.stdout.write(result.stdout)
  process.stderr.write(result.stderr)
  if (result.status !== 0) process.exit(result.status || 1)

  const report = JSON.parse(await fs.readFile(reportPath, 'utf8'))
  const expected = ['alpha-work', 'asset-only-work', 'block-only-work', 'hidden-work']
  const actual = report.publishedPageIds || []

  const errors = []
  for (const pageId of expected) {
    if (!actual.includes(pageId)) errors.push(`missing pageId: ${pageId}`)
  }
  for (const forbidden of ['draft-work', 'off-work', 'off-block-work', 'off-asset-work']) {
    if (actual.includes(forbidden)) errors.push(`unexpected pageId: ${forbidden}`)
  }
  if (!report.dryRun) errors.push('report should be dryRun=true')
  if (report.status !== 'success') errors.push(`unexpected status: ${report.status}`)

  console.log(`[smoke:finalize-publish] pageIds: ${actual.join(', ')}`)
  console.log(`[smoke:finalize-publish] errors: ${errors.length}`)
  for (const error of errors) console.error(`[error:smoke.finalize] ${error}`)
  if (errors.length) process.exit(1)
  console.log('[smoke:finalize-publish] success')
}

main().catch((error) => {
  console.error(`[smoke:finalize-publish] failed: ${error.message}`)
  process.exit(1)
})
