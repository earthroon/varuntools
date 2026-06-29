#!/usr/bin/env node
import fs from 'node:fs'

const checks = []
const failures = []

function read(path) {
  return fs.existsSync(path) ? fs.readFileSync(path, 'utf8') : ''
}

function check(label, ok) {
  checks.push(label)
  if (!ok) failures.push(label)
}

const directiveTypes = read('src/markdown/directiveTypes.ts')
const directiveIndex = read('src/markdown/directives/index.ts')
const imageSequenceDirective = read('src/markdown/directives/imageSequenceDirective.ts')
const packageJson = JSON.parse(read('package.json') || '{}')

check("src/markdown/directiveTypes.ts contains 'image-sequence'", directiveTypes.includes("'image-sequence'"))
check("KNOWN_DIRECTIVES contains 'image-sequence'", /KNOWN_DIRECTIVES[\s\S]*'image-sequence'/u.test(directiveTypes))

check('src/markdown/directives/imageSequenceDirective.ts exists', fs.existsSync('src/markdown/directives/imageSequenceDirective.ts'))
check('imageSequenceDirective exports renderImageSequenceDirective', imageSequenceDirective.includes('export function renderImageSequenceDirective'))
check('imageSequenceDirective serializes <image-sequence', imageSequenceDirective.includes('<image-sequence'))
check('imageSequenceDirective serializes data-image-sequence-items', imageSequenceDirective.includes('data-image-sequence-items'))
check('imageSequenceDirective parses item separator', imageSequenceDirective.includes('---'))
check('imageSequenceDirective requires item.src', imageSequenceDirective.includes('if (!item.src)'))
check('imageSequenceDirective requires item.alt', imageSequenceDirective.includes('if (!item.alt)'))
check('imageSequenceDirective preserves assetId', imageSequenceDirective.includes('assetId: item.assetId'))
check('imageSequenceDirective preserves src', imageSequenceDirective.includes('src: item.src'))
check('imageSequenceDirective preserves width', imageSequenceDirective.includes('width: item.width'))
check('imageSequenceDirective preserves height', imageSequenceDirective.includes('height: item.height'))
check('imageSequenceDirective preserves filename', imageSequenceDirective.includes('filename: item.filename'))
check('imageSequenceDirective preserves mimeType', imageSequenceDirective.includes('mimeType: item.mimeType'))
check('imageSequenceDirective escapes JSON payload', imageSequenceDirective.includes('escapeHtml(JSON.stringify(items))'))

check('directives/index.ts imports renderImageSequenceDirective', directiveIndex.includes('renderImageSequenceDirective'))
check("directives/index.ts has case 'image-sequence'", directiveIndex.includes("case 'image-sequence'"))

const forbiddenRendererTokens = [
  'srcset',
  'sizes',
  'imageOptimizer',
  'optimizer',
  'transform',
  'thumbnail',
  'blurData',
  'lqip',
  'EWA',
  'ewa',
]

for (const token of forbiddenRendererTokens) {
  check('imageSequenceDirective.ts no image optimization token: ' + token, !imageSequenceDirective.includes(token))
}

check('package.json has smoke:cms-image-sequence-directive', Boolean(packageJson.scripts?.['smoke:cms-image-sequence-directive']))

if (failures.length) {
  console.error('FAIL_VARUNTOOLS_CMS_IMAGE_SEQUENCE_DIRECTIVE_CONTRACT')
  for (const failure of failures) console.error('- ' + failure)
  process.exit(1)
}

console.log('PASS_VARUNTOOLS_CMS_IMAGE_SEQUENCE_DIRECTIVE_CONTRACT')

