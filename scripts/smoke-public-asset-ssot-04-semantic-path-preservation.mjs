#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const pass = 'PASS_PUBLIC_ASSET_SSOT_04_SEMANTIC_PUBLIC_PATH_PRESERVATION'
const candidateFiles = [
  'src/content/generated/publicAssetManifest.generated.json',
  'src/content/generated/publicContentProjection.generated.json',
]
const projectionDir = path.join(root, 'src', 'content', 'generated', 'vacms-pages')

function fail(code, message) {
  console.error(`FAIL_PUBLIC_ASSET_SSOT_04_SEMANTIC_PUBLIC_PATH_PRESERVATION: ${code}`)
  console.error(message)
  process.exit(1)
}

if (fs.existsSync(projectionDir)) {
  for (const name of fs.readdirSync(projectionDir).sort()) {
    if (name.endsWith('.projection.json')) candidateFiles.push(path.join('src/content/generated/vacms-pages', name))
  }
}

const files = [...new Set(candidateFiles)].filter((rel) => fs.existsSync(path.join(root, rel)))
if (files.length === 0) fail('E_PUBLIC_ASSET_SSOT_04_GENERATED_PROJECTION_MISSING', 'No generated public projection files found.')

let pathCount = 0
function walk(value, rel, key = '') {
  if (Array.isArray(value)) {
    value.forEach((item) => walk(item, rel))
    return
  }
  if (!value || typeof value !== 'object') return

  for (const [field, child] of Object.entries(value)) {
    if ((field === 'publicPath' || field === 'posterPublicPath') && child != null && String(child).trim()) {
      const semantic = String(child).trim()
      pathCount += 1
      if (!semantic.startsWith('/assets/content/')) {
        fail('E_PUBLIC_ASSET_SSOT_04_NON_SEMANTIC_PUBLIC_PATH', `${rel} ${field}=${semantic}`)
      }
      if (/^https?:\/\//i.test(semantic)) {
        fail('E_PUBLIC_ASSET_SSOT_04_ABSOLUTE_URL_IN_PROJECTION', `${rel} ${field}=${semantic}`)
      }
      if (/r2\.dev|r2\.cloudflarestorage\.com|workers\.dev/i.test(semantic)) {
        fail('E_PUBLIC_ASSET_SSOT_04_PHYSICAL_ORIGIN_IN_PROJECTION', `${rel} ${field}=${semantic}`)
      }
    }
    walk(child, rel, field)
  }
}

for (const rel of files) {
  let parsed
  try {
    parsed = JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'))
  } catch (error) {
    fail('E_PUBLIC_ASSET_SSOT_04_GENERATED_JSON_INVALID', `${rel}: ${error.message}`)
  }
  walk(parsed, rel)
}

if (pathCount === 0) fail('E_PUBLIC_ASSET_SSOT_04_NO_PROJECTED_ASSET_PATHS', 'No publicPath/posterPublicPath evidence found.')
console.log(`${pass} paths=${pathCount}`)
