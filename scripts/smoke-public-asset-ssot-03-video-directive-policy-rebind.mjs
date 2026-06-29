import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const failures = []

function fail(message) {
  failures.push(message)
}

function readText(relativePath) {
  const fullPath = path.join(root, relativePath)
  if (!fs.existsSync(fullPath)) {
    fail(`Missing file: ${relativePath}`)
    return ''
  }
  return fs.readFileSync(fullPath, 'utf8')
}

function walkFiles(dir, result = []) {
  if (!fs.existsSync(dir)) return result

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      walkFiles(fullPath, result)
      continue
    }

    if (entry.isFile()) result.push(fullPath)
  }

  return result
}

function toRelative(fullPath) {
  return path.relative(root, fullPath).replace(/\\/g, '/')
}

function assertIncludes(source, token, label) {
  if (!source.includes(token)) fail(`${label} missing token: ${token}`)
}

const videoDirective = readText('src/markdown/directives/videoPlayerDirective.ts')
const mediaAssetTypes = readText('src/markdown/mediaAssetTypes.ts')
const assetRegistry = readText('src/content/assetRegistry.ts')
const videoPlayer = readText('src/components/markdown/VideoPlayer.vue')

assertIncludes(videoDirective, 'sanitizeVideoAttrs', 'videoPlayerDirective.ts')
assertIncludes(videoDirective, 'isGhostPoster', 'videoPlayerDirective.ts')
assertIncludes(videoDirective, 'next.autoplay', 'videoPlayerDirective.ts')
assertIncludes(videoDirective, 'false', 'videoPlayerDirective.ts autoplay gate')

assertIncludes(mediaAssetTypes, 'content_asset', 'mediaAssetTypes.ts')
assertIncludes(assetRegistry, 'content_asset_proxy', 'assetRegistry.ts')
assertIncludes(assetRegistry, 'content_asset', 'assetRegistry.ts')

assertIncludes(videoPlayer, 'resolvedPoster || undefined', 'VideoPlayer.vue')
assertIncludes(videoPlayer, 'safeAutoplay', 'VideoPlayer.vue')

// Forbidden authoring tokens are checked only in authored content.
// Do not scan policy code, smoke scripts, docs, or APPLY reports.
// Policy code is allowed to mention forbidden tokens because it must detect them.
const authoredContentRoot = path.join(root, 'src/content/pages')
const authoredExtensions = new Set(['.md', '.mdx', '.json', '.yml', '.yaml'])
const forbiddenAuthoringTokens = [
  'example-poster.jpg',
  '/media/example-poster',
  'varunasset.work',
]

for (const fullPath of walkFiles(authoredContentRoot)) {
  const ext = path.extname(fullPath).toLowerCase()
  if (!authoredExtensions.has(ext)) continue

  const relativePath = toRelative(fullPath)
  const text = fs.readFileSync(fullPath, 'utf8')

  for (const token of forbiddenAuthoringTokens) {
    if (text.includes(token)) {
      fail(`Forbidden authoring token found: ${relativePath} :: ${token}`)
    }
  }
}

// Optional dist check.
// If dist exists, only check built content-facing artifacts for legacy delivery origin.
// Do not fail on policy-code literals bundled from sanitizer logic.
const distRoot = path.join(root, 'dist')
if (fs.existsSync(distRoot)) {
  for (const fullPath of walkFiles(distRoot)) {
    const ext = path.extname(fullPath).toLowerCase()
    if (!['.html', '.json'].includes(ext)) continue

    const relativePath = toRelative(fullPath)
    const text = fs.readFileSync(fullPath, 'utf8')

    if (text.includes('varunasset.work')) {
      fail(`Forbidden delivery origin found in dist: ${relativePath} :: varunasset.work`)
    }
  }
}

if (failures.length) {
  console.error('FAIL_PUBLIC_ASSET_SSOT_03_VIDEO_DIRECTIVE_POLICY_REBIND')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('PASS_PUBLIC_ASSET_SSOT_03_VIDEO_DIRECTIVE_POLICY_REBIND')
