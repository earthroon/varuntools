#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { readJson } from './lib/write-json.mjs'

const root = process.cwd()
const tmpRoot = path.join(root, '.tmp', 'sheet-cms-assets-smoke')
const rawDir = path.join(tmpRoot, 'raw')
const contentPagesDir = path.join(tmpRoot, 'content-pages')
const manifestPath = path.join(tmpRoot, 'drive-assets.generated.json')
const rawAssetsPath = path.join(rawDir, 'assets.raw.json')
const rawPagesPath = path.join(rawDir, 'pages.raw.json')
const fixturePath = path.join(tmpRoot, 'asset-payloads.json')

// Tiny SVG. Used to verify that image payloads are converted to WebP by sync-appscript-assets.
const TINY_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="red"/></svg>'

async function writeFixtures() {
  await fs.rm(tmpRoot, { recursive: true, force: true })
  await fs.mkdir(rawDir, { recursive: true })
  await fs.writeFile(rawPagesPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    sheetName: 'pages',
    headers: ['pageId', 'visible', 'status', 'type', 'slug', 'title'],
    rows: [
      { pageId: 'commission-design', visible: 'Y', status: 'published', type: 'work', slug: 'works/commission-design', title: 'Commission Design', __rowNumber: 2 },
    ],
    warnings: [],
    errors: [],
  }, null, 2))

  await fs.writeFile(rawAssetsPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    sheetName: 'assets',
    headers: ['pageId', 'assetId', 'visible', 'fileName', 'driveFileId', 'type', 'role', 'assetMode', 'externalUrl'],
    rows: [
      { pageId: 'commission-design', assetId: 'cover_001', visible: 'Y', fileName: 'cover.svg', driveFileId: '', type: 'image', role: 'cover', assetMode: 'inline', __rowNumber: 2 },
      { pageId: 'commission-design', assetId: 'video_001', visible: 'Y', fileName: '', driveFileId: '', type: 'video', role: 'inline', assetMode: 'video-large', externalUrl: 'https://cdn.example.com/video_001.mp4', __rowNumber: 3 },
      { pageId: 'commission-design', assetId: 'hidden_001', visible: 'N', fileName: 'hidden.png', driveFileId: '', type: 'image', role: 'cover', assetMode: 'inline', __rowNumber: 4 },
    ],
    warnings: [],
    errors: [],
  }, null, 2))

  await fs.writeFile(fixturePath, JSON.stringify({
    assets: [
      {
        pageId: 'commission-design',
        pageType: 'work',
        pageFolder: 'works',
        assetId: 'cover_001',
        fileName: 'cover.svg',
        mimeType: 'image/svg+xml',
        extension: 'svg',
        type: 'image',
        role: 'cover',
        base64: Buffer.from(TINY_SVG).toString('base64'),
        size: Buffer.byteLength(TINY_SVG),
      },
    ],
  }, null, 2))
}

function runSync() {
  const result = spawnSync(process.execPath, ['scripts/sheet-cms/sync-appscript-assets.mjs'], {
    cwd: root,
    stdio: 'inherit',
    env: {
      ...process.env,
      SHEET_CMS_ASSETS_RAW: rawAssetsPath,
      SHEET_CMS_PAGES_RAW: rawPagesPath,
      SHEET_CMS_ASSET_FIXTURE: fixturePath,
      SHEET_CMS_CONTENT_PAGES_DIR: contentPagesDir,
      DRIVE_ASSET_MANIFEST: manifestPath,
    },
  })
  if (result.status !== 0) throw new Error(`sync-appscript-assets exited with status ${result.status}`)
}

async function assertOutputs() {
  const manifest = await readJson(manifestPath)
  if (manifest.errors.length) throw new Error('asset manifest has errors')
  if (manifest.assets.length !== 2) throw new Error(`expected 2 assets in manifest, got ${manifest.assets.length}`)

  const cover = manifest.assets.find((asset) => asset.assetId === 'cover_001')
  if (!cover) throw new Error('cover_001 missing from manifest')
  if (cover.src !== './images/cover_001.webp') throw new Error(`cover was not converted to page-local webp src: ${cover.src}`)
  if (cover.repoPath !== `${contentPagesDir.replace(/\\/g, '/')}/works/commission-design/images/cover_001.webp`) throw new Error(`cover repoPath is wrong: ${cover.repoPath}`)
  if (cover.mimeType !== 'image/webp') throw new Error(`cover mimeType must be image/webp: ${cover.mimeType}`)
  if (cover.optimizedFrom !== 'image/svg+xml') throw new Error(`cover optimizedFrom should record source mime: ${cover.optimizedFrom}`)
  if (cover.pageFolder !== 'works') throw new Error(`cover pageFolder should be works: ${cover.pageFolder}`)

  const coverFile = path.join(contentPagesDir, 'works', 'commission-design', 'images', 'cover_001.webp')
  const stat = await fs.stat(coverFile)
  if (!stat.isFile()) throw new Error('page-owned webp asset file was not written')

  const video = manifest.assets.find((asset) => asset.assetId === 'video_001')
  if (!video) throw new Error('video_001 missing from manifest')
  if (!video.external || video.src !== 'https://cdn.example.com/video_001.mp4') {
    throw new Error('video-large asset should remain external and should not request base64 payload')
  }
}

async function main() {
  await writeFixtures()
  runSync()
  await assertOutputs()
  console.log('[smoke:appscript-assets] success')
}

main().catch((error) => {
  console.error(`[smoke:appscript-assets] failed: ${error.message}`)
  process.exit(1)
})
