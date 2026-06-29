#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const errors = []

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8')
}

function requireFile(file) {
  if (!fs.existsSync(path.join(root, file))) errors.push(`${file} missing`)
}

function requireToken(file, token) {
  const text = read(file)
  if (!text.includes(token)) errors.push(`${file} missing token: ${token}`)
}

function rejectToken(file, token) {
  const text = read(file)
  if (text.includes(token)) errors.push(`${file} forbidden token: ${token}`)
}

const component = 'src/components/markdown/ImageSequence.vue'
const parser = 'src/markdown/imageSequenceItems.ts'
const mount = 'src/markdown/mountMarkdownComponents.ts'
const packageJson = 'package.json'

for (const file of [component, parser, mount, packageJson]) requireFile(file)
if (errors.length) {
  console.error('FAIL_VARUNTOOLS_CMS_IMAGE_SEQUENCE_PUBLIC_RENDERER')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

requireToken(component, 'defineProps')
requireToken(component, 'items: ImageSequenceItem[]')
requireToken(component, '<img')
requireToken(component, ':src="item.src"')
requireToken(component, ':alt="item.alt"')
requireToken(component, ':width="item.width"')
requireToken(component, ':height="item.height"')
requireToken(component, ':loading="loadingMode()"')
requireToken(component, 'vt-media-missing vt-image-sequence__missing')

for (const token of ['srcset', 'sizes', 'EWA', 'ewa', 'imageOptimizer', 'optimizer', 'thumbnail', 'lqip', 'blurData']) {
  rejectToken(component, token)
  rejectToken(parser, token)
}

requireToken(parser, 'export function parseImageSequenceTemplateItems')
requireToken(parser, 'JSON.parse(value || \'[]\')')
requireToken(parser, 'if (!src || !alt) return null')
requireToken(parser, 'normalizePositiveInteger(record.width)')
requireToken(parser, 'normalizePositiveInteger(record.height)')

requireToken(mount, "import ImageSequence from '@/components/markdown/ImageSequence.vue'")
requireToken(mount, "import { parseImageSequenceTemplateItems } from './imageSequenceItems'")
requireToken(mount, "root.querySelectorAll('image-sequence')")
requireToken(mount, "template[data-image-sequence-items]")
requireToken(mount, 'itemsTemplate?.textContent ||')
requireToken(mount, 'resolveContentAssetMeta(options.contentDir, item.src)')
requireToken(mount, 'mountOne(element, ImageSequence, props)')

const pkg = JSON.parse(read(packageJson))
if (pkg.scripts?.['smoke:cms-image-sequence-renderer'] !== 'node scripts/smoke-cms-image-sequence-public-renderer.mjs') {
  errors.push('package.json missing script: smoke:cms-image-sequence-renderer')
}

if (errors.length) {
  console.error('FAIL_VARUNTOOLS_CMS_IMAGE_SEQUENCE_PUBLIC_RENDERER')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log('PASS_VARUNTOOLS_CMS_IMAGE_SEQUENCE_PUBLIC_RENDERER')
