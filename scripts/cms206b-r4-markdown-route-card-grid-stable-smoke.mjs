#!/usr/bin/env node
import fs from 'node:fs'

function fail(message) {
  console.error('[CMS206B_R4_MARKDOWN_ROUTE_CARD_GRID_STABLE_FAIL]', message)
  process.exit(1)
}

const grid = fs.readFileSync('src/components/content/ContentCollectionGrid.vue', 'utf8')

if (!grid.includes('import WorkCard')) fail('ContentCollectionGrid must import WorkCard')
if (!grid.includes('PublicContentCardEntry[]')) fail('ContentCollectionGrid must accept PublicContentCardEntry[]')
if (!grid.includes(':href="entry.href"')) fail('ContentCollectionGrid must pass entry.href to WorkCard')
if (grid.includes('class="vt-work-card"')) fail('ContentCollectionGrid must not reimplement vt-work-card markup')
console.log('CMS206B_R4_MARKDOWN_ROUTE_CARD_GRID_STABLE_PASS')
