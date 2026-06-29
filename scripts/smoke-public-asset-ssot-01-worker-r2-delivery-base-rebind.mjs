import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const assetRegistryPath = path.join(root, 'src', 'content', 'assetRegistry.ts')
const passToken = 'PASS_PUBLIC_ASSET_SSOT_01_WORKER_R2_DELIVERY_BASE_REBIND'

function fail(message) {
  console.error('FAIL_PUBLIC_ASSET_SSOT_01_WORKER_R2_DELIVERY_BASE_REBIND')
  console.error(message)
  process.exit(1)
}

function readText(file) {
  try {
    return fs.readFileSync(file, 'utf8')
  } catch (error) {
    fail(`Missing required file: ${path.relative(root, file)} (${error.message})`)
  }
}

const registry = readText(assetRegistryPath)

if (!registry.includes("'https://varuntools-admin-api.ragoon703.workers.dev'")) {
  fail('src/content/assetRegistry.ts does not use VACMS Worker origin as fallback content asset base.')
}

if (registry.includes('https://varunasset.work')) {
  fail('src/content/assetRegistry.ts still contains stale varunasset.work fallback.')
}

if (!registry.includes('VITE_ASSET_PUBLIC_BASE_URL') || !registry.includes('VITE_CONTENT_ASSET_PUBLIC_BASE_URL')) {
  fail('Environment override chain for content asset public base was removed.')
}

if (!registry.includes('function isRuntimeContentAssetPath') || !registry.includes('/^\\/assets\\/content\\//i')) {
  fail('Runtime /assets/content path detector is missing.')
}

if (!registry.includes('function resolveRuntimeContentAssetUrl') || !registry.includes('CONTENT_ASSET_PUBLIC_BASE_URL')) {
  fail('Runtime content asset URL resolver is missing or no longer bound to base URL.')
}

const ignoredDirs = new Set(['.git', 'node_modules', 'dist'])
const ignoredFiles = new Set(['smoke-public-asset-ssot-01-worker-r2-delivery-base-rebind.mjs'])
const allowedExt = new Set(['.ts', '.tsx', '.js', '.jsx', '.vue', '.mjs', '.cjs', '.json', '.md', '.html', '.css', '.scss'])
const forbiddenTokens = ['example-poster.jpg', '/media/example-poster']

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full, out)
      continue
    }
    if (!entry.isFile()) continue
    if (ignoredFiles.has(entry.name)) continue
    if (!allowedExt.has(path.extname(entry.name))) continue
    out.push(full)
  }
  return out
}

const sourceHits = []
for (const file of walk(path.join(root, 'src'))) {
  const text = fs.readFileSync(file, 'utf8')
  for (const token of forbiddenTokens) {
    if (text.includes(token)) {
      sourceHits.push(`${path.relative(root, file)} :: ${token}`)
    }
  }
}

if (sourceHits.length > 0) {
  fail(`Static ghost poster fallback found in source:\n${sourceHits.join('\n')}`)
}

const videoPlayerPath = path.join(root, 'src', 'components', 'markdown', 'VideoPlayer.vue')
if (fs.existsSync(videoPlayerPath)) {
  const videoPlayer = readText(videoPlayerPath)
  if (!videoPlayer.includes('resolvedPoster || undefined')) {
    fail('VideoPlayer.vue must keep poster missing non-blocking behavior: resolvedPoster || undefined')
  }
}

const varunVideoPath = path.join(root, 'src', 'components', 'markdown', 'VarunVideo.vue')
if (fs.existsSync(varunVideoPath)) {
  const varunVideo = readText(varunVideoPath)
  if (!varunVideo.includes('posterFound ? poster : undefined')) {
    fail('VarunVideo.vue must keep poster missing non-blocking behavior: posterFound ? poster : undefined')
  }
}

console.log(passToken)
