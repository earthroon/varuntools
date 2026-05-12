#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { REQUIRED_TABS } from './lib/sheet-schema.mjs'
import { readJson } from './lib/write-json.mjs'

const root = process.cwd()
const tmpRoot = path.join(root, '.tmp', 'sheet-cms-sync-smoke')
const fixtureDir = path.join(tmpRoot, 'fixtures')
const outDir = path.join(tmpRoot, 'generated', 'raw')
const manifestPath = path.join(tmpRoot, 'generated', 'sheet-sync.generated.json')

const fixtures = {
  pages: [
    ['pageId', 'visible', 'status', 'type', 'slug', 'title', 'desc', 'template', 'coverAssetId', 'tags', 'featured', 'order', 'createdAt', 'updatedAt', 'memo'],
    ['commission-design', 'Y', 'published', 'commission', 'commission/design', '디자인 커미션', '작업 의뢰 안내', 'commission', 'cover_commission', 'design,commission', 'Y', '10', '', '', 'internal note'],
    ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
  ],
  blocks: [
    ['pageId', 'blockId', 'visible', 'order', 'kind', 'title', 'body', 'assetId', 'beforeAssetId', 'afterAssetId', 'caption', 'calloutType', 'buttonLabel', 'buttonUrl', 'optionsJson', 'memo'],
    ['commission-design', 'intro-01', 'Y', '10', 'text', '작업 개요', '본문입니다.', '', '', '', '', '', '', '', '', ''],
    ['commission-design', 'warn-01', 'Y', '20', 'callout', '주의 사항', '자료를 먼저 확인해주세요.', '', '', '', '', 'warning', '', '', '{"collapsible":true}', ''],
  ],
  assets: [
    ['assetId', 'visible', 'driveFileId', 'type', 'role', 'alt', 'caption', 'localPath', 'mimeType', 'memo'],
    ['cover_commission', 'Y', 'drive_file_id_redacted', 'image', 'cover', '대표 이미지', '커버', '', '', ''],
  ],
  settings: [
    ['key', 'value', 'description'],
    ['siteName', 'VARUNTOOLS', '사이트 이름'],
    ['commissionOpen', 'Y', '커미션 활성 여부'],
  ],
  enums_block_types: [
    ['value', 'label', 'renderer', 'public', 'description'],
    ['text', '텍스트', 'TextBlock', 'Y', '일반 텍스트'],
    ['callout', '콜아웃', 'CalloutBlock', 'Y', '콜아웃'],
    ['compare', '비포애프터', 'CompareBlock', 'Y', '전후 비교'],
  ],
  enums_callout_types: [
    ['value', 'label', 'componentTone', 'defaultCollapsible', 'defaultOpen', 'public', 'description'],
    ['note', '노트', 'note', 'N', 'Y', 'Y', '일반 메모'],
    ['warning', '주의', 'warning', 'Y', 'Y', 'Y', '주의사항'],
  ],
  guide: [
    ['구분', '규칙', '예시', '비고'],
    ['노출', 'visible은 Y/N만 쓴다.', 'Y', 'Y만 public 후보'],
  ],
  publish_log: [
    ['requestedAt', 'requestedBy', 'requestId', 'eventType', 'responseCode', 'responseBody', 'actionRunUrl', 'commitSha', 'status', 'message'],
  ],
}

async function writeFixtures() {
  await fs.rm(tmpRoot, { recursive: true, force: true })
  await fs.mkdir(fixtureDir, { recursive: true })
  for (const [tabName, values] of Object.entries(fixtures)) {
    await fs.writeFile(path.join(fixtureDir, `${tabName}.values.json`), `${JSON.stringify(values, null, 2)}\n`, 'utf8')
  }
}

function runSync() {
  const result = spawnSync(process.execPath, ['scripts/sheet-cms/sync-sheets.mjs'], {
    cwd: root,
    stdio: 'inherit',
    env: {
      ...process.env,
      SHEET_CMS_FIXTURE_DIR: fixtureDir,
      SHEET_CMS_OUT_DIR: outDir,
      SHEET_CMS_MANIFEST: manifestPath,
      SHEET_CMS_STRICT: 'false',
    },
  })
  if (result.status !== 0) {
    throw new Error(`sync-sheets exited with status ${result.status}`)
  }
}

async function assertOutputs() {
  for (const tabName of REQUIRED_TABS) {
    const file = path.join(outDir, `${tabName}.raw.json`)
    const parsed = await readJson(file)
    if (parsed.sheetName !== tabName) throw new Error(`Unexpected sheetName in ${file}`)
    if (!Array.isArray(parsed.rows)) throw new Error(`rows must be an array in ${file}`)
  }

  const manifest = await readJson(manifestPath)
  if (manifest.errors.length !== 0) throw new Error('manifest has errors')
  if (manifest.tabs.length !== REQUIRED_TABS.length) throw new Error('manifest tab count mismatch')

  const pages = await readJson(path.join(outDir, 'pages.raw.json'))
  if (pages.rows.length !== 1) throw new Error('empty row should be skipped in pages fixture')
  if (pages.rows[0].pageId !== 'commission-design') throw new Error('page row was not mapped by header')
}

async function main() {
  await writeFixtures()
  runSync()
  await assertOutputs()
  console.log('[smoke:sync-sheets] success')
}

main().catch((error) => {
  console.error(`[smoke:sync-sheets] failed: ${error.message}`)
  process.exit(1)
})
