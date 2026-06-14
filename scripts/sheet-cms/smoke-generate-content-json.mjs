#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { readJson, writeJson } from './lib/write-json.mjs'

const root = process.cwd()
const tmpRoot = path.join(root, '.tmp', 'sheet-cms-generate-smoke')
const rawDir = path.join(tmpRoot, 'raw')
const outDir = path.join(tmpRoot, 'generated')
const driveManifestPath = path.join(tmpRoot, 'drive-assets.generated.json')

async function writeRaw(name, rows, headers) {
  await writeJson(path.join(rawDir, `${name}.raw.json`), {
    generatedAt: new Date().toISOString(),
    sheetName: name,
    headers,
    rows,
    warnings: [],
    errors: [],
  })
}

async function writeFixtures() {
  await fs.rm(tmpRoot, { recursive: true, force: true })
  await fs.mkdir(rawDir, { recursive: true })

  await writeRaw('pages', [
    { pageId: 'old-page', visible: 'Y', status: 'published', type: 'page', slug: 'old/page', title: 'Old Page', __rowNumber: 2 },
    { pageId: 'archived-page', visible: 'Y', status: 'archived', type: 'page', slug: 'archived/page', title: 'Archived Page', __rowNumber: 3 },
  ], ['pageId', 'visible', 'status', 'type', 'slug', 'title'])

  await writeRaw('blocks', [
    { pageId: 'old-page', blockId: 'text-01', visible: 'Y', order: '10', kind: 'text', title: '본문', body: '업데이트된 본문입니다.', __rowNumber: 2 },
    { pageId: 'old-page', blockId: 'callout-01', visible: 'Y', order: '20', kind: 'callout', title: '주의', body: '확인하세요.', calloutType: 'warning', optionsJson: '{"collapsible":true}', __rowNumber: 3 },
    { pageId: 'old-page', blockId: 'compare-01', visible: 'Y', order: '30', kind: 'compare', title: '전후', beforeAssetId: 'before_001', afterAssetId: 'after_001', caption: '전후 비교', optionsJson: '{"initial":45,"labels":true}', __rowNumber: 4 },
    { pageId: 'old-page', blockId: 'cta-01', visible: 'Y', order: '90', kind: 'cta', title: '문의', body: '문의하세요.', buttonLabel: '문의하기', buttonUrl: '/contact', optionsJson: '{"variant":"primary"}', __rowNumber: 5 },
  ], ['pageId', 'blockId', 'visible', 'order', 'kind', 'title', 'body', 'beforeAssetId', 'afterAssetId', 'caption', 'calloutType', 'buttonLabel', 'buttonUrl', 'optionsJson'])

  await writeRaw('assets', [
    { assetId: 'cover_001', visible: 'Y', driveFileId: 'should_not_leak', type: 'image', role: 'cover', alt: '커버', caption: '커버 캡션', __rowNumber: 2 },
    { assetId: 'before_001', visible: 'Y', driveFileId: 'before_should_not_leak', type: 'image', role: 'before', alt: '비포', __rowNumber: 3 },
    { assetId: 'after_001', visible: 'Y', driveFileId: 'after_should_not_leak', type: 'image', role: 'after', alt: '애프터', __rowNumber: 4 },
  ], ['assetId', 'visible', 'driveFileId', 'type', 'role', 'alt', 'caption'])

  await writeRaw('settings', [
    { key: 'siteName', value: 'VARUNTOOLS', __rowNumber: 2 },
    { key: 'commissionOpen', value: 'Y', __rowNumber: 3 },
  ], ['key', 'value'])

  await writeRaw('enums_block_types', [
    { value: 'text', label: '텍스트', renderer: 'TextBlock', public: 'Y', __rowNumber: 2 },
    { value: 'callout', label: '콜아웃', renderer: 'CalloutBlock', public: 'Y', __rowNumber: 3 },
    { value: 'compare', label: '비포애프터', renderer: 'CompareBlock', public: 'Y', __rowNumber: 4 },
    { value: 'cta', label: 'CTA', renderer: 'CtaBlock', public: 'Y', __rowNumber: 5 },
  ], ['value', 'label', 'renderer', 'public'])

  await writeRaw('enums_callout_types', [
    { value: 'warning', label: '주의', componentTone: 'warning', defaultCollapsible: 'Y', defaultOpen: 'Y', public: 'Y', __rowNumber: 2 },
  ], ['value', 'label', 'componentTone', 'defaultCollapsible', 'defaultOpen', 'public'])

  await writeJson(driveManifestPath, {
    generatedAt: new Date().toISOString(),
    source: 'fixture',
    schemaVersion: '1.0.0',
    assets: [
      { assetId: 'cover_001', src: '/assets/generated/cover_001.webp', type: 'image', role: 'cover', mimeType: 'image/webp', size: 100 },
      { assetId: 'before_001', src: '/assets/generated/before_001.jpg', type: 'image', role: 'before', mimeType: 'image/jpeg', size: 100 },
      { assetId: 'after_001', src: '/assets/generated/after_001.jpg', type: 'image', role: 'after', mimeType: 'image/jpeg', size: 100 },
    ],
    warnings: [],
    errors: [],
  })

  // Existing generated content should be preserved unless staging rows replace/delete it.
  await writeJson(path.join(outDir, 'pages.generated.json'), {
    generatedAt: new Date().toISOString(),
    source: 'existing',
    schemaVersion: '1.0.0',
    pages: [
      { id: 'keep-page', slug: 'keep/page', type: 'page', title: 'Keep Page', template: 'page', tags: [], featured: false, order: 20, blocks: [] },
      { id: 'archived-page', slug: 'archived/page', type: 'page', title: 'Archived Page', template: 'page', tags: [], featured: false, order: 30, blocks: [] },
    ],
  })
}

function runGenerate() {
  const result = spawnSync(process.execPath, ['scripts/sheet-cms/generate-content-json.mjs'], {
    cwd: root,
    stdio: 'inherit',
    env: {
      ...process.env,
      SHEET_CMS_RAW_DIR: rawDir,
      DRIVE_ASSET_MANIFEST: driveManifestPath,
      SHEET_CMS_GENERATED_OUT_DIR: outDir,
    },
  })
  if (result.status !== 0) throw new Error(`generate-content-json exited with ${result.status}`)
}

async function assertOutputs() {
  const pages = await readJson(path.join(outDir, 'pages.generated.json'))
  const ids = pages.pages.map((page) => page.id)
  if (!ids.includes('keep-page')) throw new Error('existing generated page should be preserved')
  if (!ids.includes('old-page')) throw new Error('staging page should be upserted')
  if (ids.includes('archived-page')) throw new Error('archived staging command should delete page')

  const updated = pages.pages.find((page) => page.id === 'old-page')
  if (updated.blocks.length !== 4) throw new Error('old-page should have four generated blocks')
  if (!updated.blocks.some((block) => block.kind === 'compare')) throw new Error('compare block missing')

  const assets = await readJson(path.join(outDir, 'assets.generated.json'))
  const raw = JSON.stringify(assets)
  if (raw.includes('should_not_leak')) throw new Error('driveFileId leaked into public assets')
  if (!assets.assets.some((asset) => asset.assetId === 'before_001')) throw new Error('before asset missing')

  const manifest = await readJson(path.join(outDir, 'manifest.generated.json'))
  if (manifest.errors.length) throw new Error('manifest should not have errors')
  if (manifest.lifecycle.rawRetention !== 'ephemeral-cache-only') throw new Error('raw retention contract missing')
}

async function main() {
  await writeFixtures()
  runGenerate()
  await assertOutputs()
  console.log('[smoke:generate-content-json] success')
}

main().catch((error) => {
  console.error(`[smoke:generate-content-json] failed: ${error.message}`)
  process.exit(1)
})
