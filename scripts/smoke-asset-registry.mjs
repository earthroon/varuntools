import path from 'node:path'
import process from 'node:process'
import { resolveFilesystemAsset, getMediaAssetType } from './lib/asset-registry.mjs'

const projectRoot = process.cwd()
const contentFilePath = path.join(projectRoot, 'src', 'content', 'pages', 'home', 'index.md')
const cases = [
  { name: 'relative local asset found', source: './images/cover.svg', found: true, reason: 'local_asset_found' },
  { name: 'relative local asset missing', source: './images/not-found.svg', found: false, reason: 'local_asset_missing' },
  { name: 'public asset path', source: '/og-default.svg', found: true, reason: 'public_path' },
  { name: 'external url', source: 'https://example.com/image.webp', found: true, reason: 'external_url' },
  { name: 'data url', source: 'data:image/svg+xml;base64,PHN2Zy8+', found: true, reason: 'data_url' },
  { name: 'unsafe path', source: '../../../../secret.png', found: false, reason: 'unsafe_path' },
  { name: 'empty source', source: '', found: false, reason: 'empty_source' },
]

const failures = []
for (const item of cases) {
  const result = resolveFilesystemAsset({ source: item.source, contentFilePath, projectRoot })
  if (result.found !== item.found || result.reason !== item.reason) {
    failures.push(`${item.name}: expected ${item.found}/${item.reason}, got ${result.found}/${result.reason}`)
  }
}


const mediaCases = [
  { source: 'demo.mp4', type: 'video' },
  { source: 'demo.webm', type: 'video' },
  { source: 'stream.m3u8', type: 'stream' },
  { source: 'captions.vtt', type: 'subtitle' },
  { source: 'poster.svg', type: 'image' },
]

for (const item of mediaCases) {
  const type = getMediaAssetType(item.source)
  if (type !== item.type) failures.push(`media type ${item.source}: expected ${item.type}, got ${type}`)
}

if (failures.length) {
  console.error('[VARUNTOOLS][smoke-assets] FAILED')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('[VARUNTOOLS][smoke-assets] OK')
console.log(`Checked ${cases.length} asset registry cases and ${mediaCases.length} media type cases.`)
