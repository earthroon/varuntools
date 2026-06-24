#!/usr/bin/env node
import fs from 'node:fs'

function fail(message) {
  console.error('[CMS206B_R2_NO_INDEX_SELF_CARD_FAIL]', message)
  process.exit(1)
}

const taxonomy = JSON.parse(fs.readFileSync('config/public-content-taxonomy.json', 'utf8'))
const source = fs.readFileSync('src/composables/usePublicContentCollection.ts', 'utf8')
const required = ['home', 'index', 'works', 'products', 'products/categories', 'post', 'lab', 'tools']
for (const slug of required) {
  if (!taxonomy.collectionIndexSlugs.includes(slug)) fail('collectionIndexSlugs missing ' + slug)
}
if (!source.includes('collectionIndexSlugs')) fail('usePublicContentCollection must read collectionIndexSlugs')
if (!source.includes('!indexSlugs.value.has')) fail('usePublicContentCollection must exclude collection index slugs')
console.log('CMS206B_R2_NO_INDEX_SELF_CARD_PASS')
