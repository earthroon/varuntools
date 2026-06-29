#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const failures = []

function read(relativePath) {
  const target = path.resolve(root, relativePath)
  if (!fs.existsSync(target)) {
    failures.push(`${relativePath} missing`)
    return ''
  }
  return fs.readFileSync(target, 'utf8')
}

function expectIncludes(relativePath, token) {
  const source = read(relativePath)
  if (!source.includes(token)) failures.push(`${relativePath} missing token: ${token}`)
}

function expectNotIncludes(relativePath, token) {
  const source = read(relativePath)
  if (source.includes(token)) failures.push(`${relativePath} forbidden token: ${token}`)
}

const directiveTypes = 'src/markdown/directiveTypes.ts'
const renderer = 'src/markdown/directives/imageSequenceDirective.ts'
const directiveIndex = 'src/markdown/directives/index.ts'
const mount = 'src/markdown/mountMarkdownComponents.ts'
const component = 'src/components/markdown/ImageSequence.vue'
const pkgPath = 'package.json'

expectIncludes(directiveTypes, "| 'image-sequence'")
expectIncludes(directiveTypes, "'image-sequence',")
expectIncludes(renderer, 'export function renderImageSequenceDirective')
expectIncludes(renderer, '<image-sequence')
expectIncludes(renderer, 'data-image-sequence-items')
expectIncludes(renderer, ".split(/^---\\s*$/mu)")
expectIncludes(renderer, "if (!item.src)")
expectIncludes(renderer, "if (!item.alt)")
expectIncludes(renderer, 'assetId')
expectIncludes(renderer, 'src')
expectIncludes(renderer, 'width')
expectIncludes(renderer, 'height')
expectIncludes(renderer, 'filename')
expectIncludes(renderer, 'mimeType')
expectIncludes(renderer, 'escapeHtml(JSON.stringify(items))')
expectIncludes(directiveIndex, "import { renderImageSequenceDirective } from './imageSequenceDirective'")
expectIncludes(directiveIndex, "case 'image-sequence':")
expectIncludes(directiveIndex, 'return renderImageSequenceDirective(directive)')

if (fs.existsSync(path.resolve(root, component))) failures.push(`${component} must not exist in VT-CMS-01`)
expectNotIncludes(mount, "import ImageSequence")
expectNotIncludes(mount, "querySelectorAll('image-sequence')")
expectNotIncludes(mount, 'querySelectorAll("image-sequence")')

for (const token of ['srcset', 'sizes', 'imageOptimizer', 'optimizer', 'thumbnail', 'blurData', 'lqip', 'EWA', 'ewa']) {
  expectNotIncludes(renderer, token)
}

const pkg = JSON.parse(read(pkgPath) || '{}')
if (pkg.scripts?.['smoke:cms-image-sequence-directive'] !== 'node scripts/smoke-cms-image-sequence-directive-contract.mjs') {
  failures.push('package.json missing smoke:cms-image-sequence-directive script')
}

if (failures.length) {
  console.error('FAIL_VARUNTOOLS_CMS_IMAGE_SEQUENCE_DIRECTIVE_CONTRACT')
  for (const failure of failures) console.error('- ' + failure)
  process.exit(1)
}

console.log('PASS_VARUNTOOLS_CMS_IMAGE_SEQUENCE_DIRECTIVE_CONTRACT')
