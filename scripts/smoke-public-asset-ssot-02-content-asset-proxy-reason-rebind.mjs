import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const assetRegistryPath = path.join(root, 'src', 'content', 'assetRegistry.ts')
const passToken = 'PASS_PUBLIC_ASSET_SSOT_02_CONTENT_ASSET_PROXY_REASON_REBIND'

function fail(message, details = []) {
  console.error('FAIL_PUBLIC_ASSET_SSOT_02_CONTENT_ASSET_PROXY_REASON_REBIND')
  console.error(message)
  for (const detail of details) console.error(detail)
  process.exit(1)
}

if (!fs.existsSync(assetRegistryPath)) {
  fail(`Missing file: ${path.relative(root, assetRegistryPath)}`)
}

const source = fs.readFileSync(assetRegistryPath, 'utf8')

const requiredTokens = [
  "| 'content_asset'",
  "| 'content_asset_proxy'",
  "'https://varuntools-admin-api.ragoon703.workers.dev'",
  'function isRuntimeContentAssetPath',
  'function resolveRuntimeContentAssetUrl',
]

const missing = requiredTokens.filter((token) => !source.includes(token))
if (missing.length > 0) {
  fail('Required content asset proxy tokens are missing:', missing)
}

if (source.includes('https://varunasset.work')) {
  fail('Legacy asset base remains in assetRegistry.ts: https://varunasset.work')
}

const branchMatch = source.match(/if \(isRuntimeContentAssetPath\(source\)\) \{[\s\S]*?\n\s*\}\n\s*\n\s*return \{/)
if (!branchMatch) {
  fail('Could not locate /assets/content runtime content asset branch.')
}

const branch = branchMatch[0]
const branchRequired = [
  "kind: 'content_asset'",
  "reason: 'content_asset_proxy'",
  'url: resolveRuntimeContentAssetUrl(source)',
]
const branchMissing = branchRequired.filter((token) => !branch.includes(token))
if (branchMissing.length > 0) {
  fail('Runtime content asset branch is missing required semantics:', branchMissing)
}

const branchForbidden = [
  "kind: 'external'",
  "reason: 'external_url'",
  "warning: 'external_url'",
]
const branchHits = branchForbidden.filter((token) => branch.includes(token))
if (branchHits.length > 0) {
  fail('/assets/content branch still uses external-url semantics:', branchHits)
}

const sourceRoot = path.join(root, 'src')
const forbiddenGhosts = ['example-poster.jpg', '/media/example-poster']
const ghostHits = []

function walk(dir) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full)
      continue
    }
    if (!entry.isFile()) continue
    if (!/\.(ts|tsx|js|jsx|vue|md|json|html|css)$/i.test(entry.name)) continue
    const text = fs.readFileSync(full, 'utf8')
    for (const token of forbiddenGhosts) {
      if (text.includes(token)) {
        ghostHits.push(`${path.relative(root, full)} :: ${token}`)
      }
    }
  }
}

walk(sourceRoot)
if (ghostHits.length > 0) {
  fail('Static ghost poster fallback found in src:', ghostHits)
}

console.log(passToken)
