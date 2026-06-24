#!/usr/bin/env node
import fs from 'node:fs'

function fail(message) {
  console.error('[CMS206B_R2_PUBLIC_CARD_SOURCE_MARKDOWN_ROUTE_FAIL]', message)
  process.exit(1)
}

const source = fs.readFileSync('src/composables/usePublicContentCollection.ts', 'utf8')
if (!source.includes('export type PublicContentCardEntry')) fail('PublicContentCardEntry type missing')
if (!source.includes('pages: LoadedMarkdownPage[]')) fail('usePublicContentCollection must take LoadedMarkdownPage[]')
if (!source.includes("'/' + page.slug")) fail('href must be based on markdown page slug')
if (source.includes('getGeneratedWorkCardEntries')) fail('public content collection must not use generated work entries')
if (source.includes('loadGeneratedPages')) fail('public content collection must not use generated pages')
console.log('CMS206B_R2_PUBLIC_CARD_SOURCE_MARKDOWN_ROUTE_PASS')
