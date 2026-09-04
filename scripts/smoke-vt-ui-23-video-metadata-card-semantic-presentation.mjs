#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
function read(rel) {
  const p = path.join(root, rel)
  if (!fs.existsSync(p)) throw new Error(`E_VT_UI23_SMOKE_FILE_MISSING:${rel}`)
  return fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n')
}
function pass(label, ok) {
  if (!ok) {
    console.error(`FAIL ${label}`)
    process.exitCode = 1
  } else {
    console.log(`PASS ${label}`)
  }
}

function cssBlock(source, selector) {
  const marker = `${selector} {`
  const start = source.indexOf(marker)
  if (start < 0) return ''
  const open = source.indexOf('{', start)
  if (open < 0) return ''

  let depth = 0
  for (let index = open; index < source.length; index += 1) {
    const ch = source[index]
    if (ch === '{') depth += 1
    if (ch === '}') {
      depth -= 1
      if (depth === 0) return source.slice(open + 1, index)
    }
  }
  return ''
}

const vue = read('src/components/markdown/VideoPlayer.vue')
const css = read('src/styles/markdown-components.css')
const mount = read('src/markdown/mountMarkdownComponents.ts')

pass('caption prop exists', vue.includes('caption?: string'))
pass('caption default exists', vue.includes("caption: '',"))
pass('metadata card conditional uses title or caption', vue.includes('v-if="props.title || props.caption"'))
pass('metadata card marker exists', vue.includes('data-vt-ui23-video-metadata-card="1"'))
pass('title semantic marker exists', vue.includes('data-vt-ui23-video-title="1"'))
pass('caption semantic marker exists', vue.includes('data-vt-ui23-video-caption="1"'))
pass('title uses text interpolation', vue.includes('{{ props.title }}'))
pass('caption uses text interpolation', vue.includes('{{ props.caption }}'))
pass('metadata uses no v-html', !/v-html\s*=/.test(vue.slice(vue.indexOf('data-vt-ui23-video-metadata-card') - 300)))
pass('mount already forwards title', mount.includes("title: el.dataset.title || ''"))
pass('mount already forwards caption', mount.includes("caption: el.dataset.caption || ''"))
pass('metadata card CSS marker exists', css.includes('VT-UI-23 — Video Metadata Card Semantic Presentation'))
const metadataCss = cssBlock(css, '.vt-video-player__caption')
const titleCss = cssBlock(css, '.vt-video-player__title')
const captionCss = cssBlock(css, '.vt-video-player__text')

pass('metadata card owns hairline border', /border:\s*1px solid var\(--vt-hair\)/.test(metadataCss))
pass('metadata card is left aligned', /text-align:\s*left/.test(metadataCss))
pass('metadata card width follows figure', /width:\s*100%/.test(metadataCss))
pass('title hierarchy exists', /font-weight:\s*780/.test(titleCss))
pass('caption hierarchy exists', /font-size:\s*0\.8rem/.test(captionCss))
pass('caption multiline remains literal', /white-space:\s*pre-wrap/.test(captionCss))
pass(
  'metadata is normal flow',
  metadataCss.length > 0 && !/position:\s*(?:absolute|fixed|sticky)/.test(metadataCss),
)
pass('scoped duplicate caption presentation retired', !vue.includes('.vt-video-player__caption {\n  margin-top: 0.65rem;'))

if (process.exitCode) process.exit(process.exitCode)
console.log('PASS VT-UI-23-VIDEO-METADATA-CARD-SEMANTIC-PRESENTATION')
