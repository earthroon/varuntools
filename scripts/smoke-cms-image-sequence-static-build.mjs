#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const failures = []

function read(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : ''
}

function check(label, ok) {
  if (!ok) failures.push(label)
}

function collectFiles(dir, exts, limit = 2500) {
  const out = []
  if (!fs.existsSync(dir)) return out

  const stack = [dir]
  while (stack.length && out.length < limit) {
    const current = stack.pop()
    const entries = fs.readdirSync(current, { withFileTypes: true })
    for (const entry of entries) {
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) {
        stack.push(full)
        continue
      }
      if (entry.isFile() && exts.includes(path.extname(entry.name).toLowerCase())) {
        out.push(full)
      }
    }
  }
  return out
}

const distDir = 'dist'
const receiptPath = path.join('node_modules', '.cache', 'varuntools', 'vt-cms-04', 'cms-image-sequence-e2e-render.html')
const receipt = read(receiptPath)
const packageJson = JSON.parse(read('package.json') || '{}')

check('dist exists after npm run build', fs.existsSync(distDir) && fs.statSync(distDir).isDirectory())

const builtFiles = collectFiles(distDir, ['.html', '.js', '.mjs', '.css'])
check('dist contains built html/js/css assets', builtFiles.length > 0)
check('e2e render receipt exists', fs.existsSync(receiptPath))
check('e2e render receipt contains image-sequence', receipt.includes('<image-sequence'))
check('e2e render receipt contains data-image-sequence-items', receipt.includes('data-image-sequence-items'))
check('e2e render receipt contains /assets/content/', receipt.includes('/assets/content/'))

const builtText = builtFiles
  .slice(0, 200)
  .map((filePath) => read(filePath))
  .join('\n')

check('dist readback text is available', builtText.length > 0)

if (builtText.includes('data-image-sequence-items') || builtText.includes('<image-sequence')) {
  check('dist image sequence contract has /assets/content when present', builtText.includes('/assets/content/'))
}

const forbiddenReceiptTokens = [
  'srcset',
  'sizes',
  '<picture',
  '<source',
  'canvas',
  'ImageBitmap',
  'createImageBitmap',
  'OffscreenCanvas',
  'imageOptimizer',
  'optimizer',
  'transform',
  'thumbnail',
  'blurData',
  'lqip',
  'EWA',
  'ewa',
  'webgpu',
  'wgpu',
  'database',
  'bucket',
  'listObjects',
  'getObject',
  'prepare(',
  'SELECT',
  'cms-admin',
]

for (const token of forbiddenReceiptTokens) {
  check('e2e receipt forbidden token absent: ' + token, !receipt.includes(token))
}

check('package.json has smoke:cms-image-sequence-static', Boolean(packageJson.scripts?.['smoke:cms-image-sequence-static']))

if (failures.length) {
  console.error('FAIL_VARUNTOOLS_CMS_IMAGE_SEQUENCE_STATIC_BUILD')
  for (const failure of failures) console.error('- ' + failure)
  process.exit(1)
}

console.log('PASS_VARUNTOOLS_CMS_IMAGE_SEQUENCE_STATIC_BUILD')
