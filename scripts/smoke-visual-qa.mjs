#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const pagePath = path.join(root, 'src/content/pages/lab-markdown-gallery/index.md')
const md = fs.readFileSync(pagePath, 'utf8')

const checks = [
  ['Captioned Image section', /##\s+1\.\s+Captioned Image/.test(md)],
  ['caption chip samples', md.includes('[필수]') && md.includes('[선택]') && md.includes('[기타]')],
  ['Captioned Image Frame section', md.includes('Captioned Image Frame Contract') && md.includes('Required Badge') && md.includes('Optional Badge') && md.includes('Misc Badge')],
  ['Before After section', /##\s+2\.\s+Before \/ After/.test(md) && md.includes('::before-after')],
  ['Pagecard Grid section', /##\s+3\.\s+Pagecard Grid/.test(md) && md.includes('::pagecard-grid')],
  ['Markdown Box section', /##\s+4\.\s+Markdown Box/.test(md) && md.includes('type: ssot')],
  ['Image Card section', /##\s+5\.\s+Image Card/.test(md) && md.includes('::image-card')],
  ['Section Gap section', /##\s+6\.\s+Section Gap/.test(md) && md.includes('::section-gap')],
  ['Asset Registry Policy section', /##\s+7\.\s+Asset Registry Policy/.test(md)],
  ['Legacy Migration Preview section', /##\s+8\.\s+Legacy Migration Preview/.test(md)],
  ['Boundary Rule section', /##\s+9\.\s+Boundary Rule/.test(md)],
  ['Mobile Density Check section', /##\s+10\.\s+Mobile Density Check/.test(md)],
  ['Accessibility Check section', /##\s+11\.\s+Accessibility Check/.test(md)],
  ['Video Player section', /##\s+13\.\s+Video Player/.test(md) && md.includes('::video-player')],
  ['Section Scoped Lightbox section', /##\s+14\.\s+Section Scoped Lightbox/.test(md) && md.includes('Gallery A-1') && md.includes('Gallery B-1')],
  ['no intentional missing asset sample in content', !md.includes('not-found.svg')],
]

const failed = checks.filter(([, ok]) => !ok)
if (failed.length) {
  for (const [name] of failed) console.error(`[visual-qa] missing: ${name}`)
  process.exit(1)
}

console.log(`[visual-qa] OK — ${checks.length} checks`)
