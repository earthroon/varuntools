#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'

const REQUIRED_FILES = [
  'src/types/generatedContent.ts',
  'src/lib/generated-content/loadGeneratedPages.ts',
  'src/lib/generated-content/findGeneratedPage.ts',
  'src/lib/generated-content/generatedRoutes.ts',
  'src/lib/generated-content/resolveGeneratedAssetSrc.ts',
  'src/lib/generated-content/generatedWorkEntries.ts',
  'src/pages/GeneratedPageView.vue',
  'src/components/generated/GeneratedPageRenderer.vue',
  'src/components/generated/GeneratedBlockRenderer.vue',
  'src/components/generated/GeneratedPageHero.vue',
  'src/components/generated/blockRendererRegistry.ts',
  'src/components/generated/blocks/TextBlock.vue',
  'src/components/generated/blocks/CalloutBlock.vue',
  'src/components/generated/blocks/CompareBlock.vue',
  'src/components/generated/blocks/ImageBlock.vue',
  'src/components/generated/blocks/CtaBlock.vue',
  'src/components/generated/blocks/FaqBlock.vue',
  'src/styles/generated-content.css',
  'src/content/generated/pages.generated.json',
]

const REQUIRED_KINDS = ['text', 'callout', 'compare', 'image', 'cta', 'faq']
const errors = []
const warnings = []

async function exists(file) {
  try {
    await fs.access(file)
    return true
  } catch {
    return false
  }
}

async function read(file) {
  return fs.readFile(file, 'utf8')
}

for (const file of REQUIRED_FILES) {
  if (!(await exists(file))) errors.push(`missing file: ${file}`)
}

if (!errors.length) {
  const registry = await read('src/components/generated/blockRendererRegistry.ts')
  for (const kind of REQUIRED_KINDS) {
    if (!registry.includes(`${kind}:`)) errors.push(`block renderer registry missing kind: ${kind}`)
  }

  const router = await read('src/router/index.ts')
  if (!router.includes('generatedRoutes')) errors.push('router does not include generatedRoutes')

  const main = await read('src/main.ts')
  if (!main.includes("./styles/generated-content.css")) errors.push('main.ts does not import generated-content.css')

  const blockRenderer = await read('src/components/generated/GeneratedBlockRenderer.vue')
  if (!blockRenderer.includes(':page="page"')) errors.push('GeneratedBlockRenderer does not pass page context to block components')

  const compare = await read('src/components/generated/blocks/CompareBlock.vue')
  if (!compare.includes('type="range"')) errors.push('CompareBlock must expose keyboard-accessible range input')
  if (!compare.includes('resolveGeneratedAssetSrc')) errors.push('CompareBlock must resolve page-owned asset src')

  const textBlock = await read('src/components/generated/blocks/TextBlock.vue')
  if (textBlock.includes('v-html')) errors.push('TextBlock must not render body with v-html')

  const callout = await read('src/components/generated/blocks/CalloutBlock.vue')
  if (callout.includes('v-html')) errors.push('CalloutBlock must not render body with v-html')

  const image = await read('src/components/generated/blocks/ImageBlock.vue')
  if (!image.includes('loading="lazy"')) errors.push('ImageBlock must use lazy loading')

  const useWorks = await read('src/composables/useWorksCollection.ts')
  if (!useWorks.includes('getGeneratedWorkCardEntries')) warnings.push('Works collection is not including generated work entries')

  const pagesFile = JSON.parse(await read('src/content/generated/pages.generated.json'))
  if (!Array.isArray(pagesFile.pages)) errors.push('pages.generated.json pages must be an array')
  for (const page of pagesFile.pages || []) {
    if (!page.id || !page.slug) errors.push(`generated page missing id/slug: ${JSON.stringify(page)}`)
    for (const block of page.blocks || []) {
      if (!REQUIRED_KINDS.includes(block.kind)) errors.push(`unsupported generated block kind in placeholder data: ${block.kind}`)
    }
  }
}

if (warnings.length) {
  for (const warning of warnings) console.warn(`[warning] ${warning}`)
}

if (errors.length) {
  for (const error of errors) console.error(`[error] ${error}`)
  process.exit(1)
}

console.log('[smoke:generated-renderer] success')
