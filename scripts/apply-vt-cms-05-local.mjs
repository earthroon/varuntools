#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

function fail(message) {
  console.error('FAIL_VT_CMS_05_APPLY_OVERLAY')
  console.error('- ' + message)
  process.exit(1)
}

function read(rel) {
  const p = path.join(root, rel)
  if (!fs.existsSync(p)) fail(rel + ' not found')
  return fs.readFileSync(p, 'utf8')
}

function write(rel, text) {
  const p = path.join(root, rel)
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, text, 'utf8')
}

function ensurePackageScript(name, command) {
  const rel = 'package.json'
  const raw = read(rel)
  const json = JSON.parse(raw)
  json.scripts = json.scripts || {}
  json.scripts[name] = command
  write(rel, JSON.stringify(json, null, 2) + '\n')
}

function ensureAttrsInTag(source, tagName, predicate, attrs) {
  const re = new RegExp('<' + tagName + '\\b[\\s\\S]*?>', 'g')
  let changed = false
  const next = source.replace(re, (tag) => {
    if (!predicate(tag)) return tag

    const missing = attrs.filter((attr) => {
      const name = attr.match(/[:@]?[A-Za-z0-9_-]+/)?.[0]
      return name ? !tag.includes(name) : !tag.includes(attr)
    })

    if (!missing.length) return tag
    changed = true
    return tag.replace(/\s*>$/u, '\n  ' + missing.join('\n  ') + '\n>')
  })

  return { source: next, changed }
}

function replaceMissingFallback(source) {
  const block = `<div
        v-else
        class="vt-media-missing vt-image-sequence__missing"
        role="status"
        :data-source="item.source"
        :data-src-reason="item.srcReason"
      >
        <strong>Image asset missing</strong>
        <span>{{ item.srcReason || 'unresolved_content_asset' }}</span>
        <code v-if="item.source">{{ item.source }}</code>
      </div>`

  const re = /<div\s+v-else\b[\s\S]*?class="vt-media-missing vt-image-sequence__missing"[\s\S]*?>[\s\S]*?<\/div>/u
  if (re.test(source)) return source.replace(re, block)
  return source
}

function ensureStyleBlock(source) {
  if (source.includes('.vt-image-sequence__missing code')) return source
  const css = `

.vt-image-sequence__missing {
  display: grid;
  place-content: center;
  gap: 6px;
  min-height: 100%;
  padding: 16px;
  text-align: center;
}

.vt-image-sequence__missing code {
  max-width: 100%;
  overflow: hidden;
  color: inherit;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
`

  if (source.includes('</style>')) return source.replace('</style>', css + '</style>')
  return source + `\n<style scoped>${css}</style>\n`
}

function patchImageSequenceVue() {
  const rel = 'src/components/markdown/ImageSequence.vue'
  let s = read(rel)

  const articlePatch = ensureAttrsInTag(
    s,
    'article',
    (tag) => tag.includes('vt-image-sequence__item') && tag.includes('v-for='),
    [
      ':data-asset-id="item.assetId || undefined"',
      ':data-source="item.source"',
      ':data-src-found="item.srcFound ? \'1\' : \'0\'"',
      ':data-src-reason="item.srcReason"',
      ':data-filename="item.filename || undefined"',
      ':data-mime-type="item.mimeType || undefined"',
    ],
  )
  s = articlePatch.source

  const imgPatch = ensureAttrsInTag(
    s,
    'img',
    (tag) => tag.includes('vt-image-sequence__image'),
    [
      ':data-source="item.source"',
      ':data-src-reason="item.srcReason"',
    ],
  )
  s = imgPatch.source

  s = replaceMissingFallback(s)
  s = ensureStyleBlock(s)

  const required = [
    ':data-asset-id="item.assetId || undefined"',
    ':data-source="item.source"',
    ':data-src-found="item.srcFound ? \'1\' : \'0\'"',
    ':data-src-reason="item.srcReason"',
    '<code v-if="item.source">{{ item.source }}</code>',
    ':loading="loadingMode()"',
    ':src="item.src"',
  ]

  const missing = required.filter((token) => !s.includes(token))
  if (missing.length) fail(rel + ' patch missing token: ' + missing.join(', '))

  write(rel, s)
}

function writeDocSection() {
  const rel = 'docs/CMS_IMAGE_SEQUENCE_PUBLIC_RENDERER.md'
  const current = fs.existsSync(path.join(root, rel)) ? fs.readFileSync(path.join(root, rel), 'utf8') : '# CMS Image Sequence Public Renderer\n'
  const marker = '<!-- VT-CMS-05-ASSET-DIAGNOSTICS -->'
  const section = `${marker}

## VT-CMS-05 Asset Diagnostics

Image sequence rendering keeps the CMS source path as the public resolve SSOT. Each rendered item exposes a minimal diagnostic receipt through DOM data attributes:

- data-asset-id
- data-source
- data-src-found
- data-src-reason
- data-filename
- data-mime-type

The public renderer does not query D1 or R2 directly. It does not create srcset, sizes, optimizer URLs, thumbnails, canvas placeholders, or WebGPU/EWA image processing paths.
`

  const next = current.includes(marker)
    ? current.replace(new RegExp(marker + '[\\s\\S]*$', 'u'), section)
    : current.trimEnd() + '\n\n' + section

  write(rel, next + '\n')
}

patchImageSequenceVue()
ensurePackageScript('smoke:cms-image-sequence-diagnostics', 'node scripts/smoke-cms-image-sequence-asset-diagnostics.mjs')
ensurePackageScript('smoke:cms-no-public-d1-r2-coupling', 'node scripts/smoke-cms-no-public-d1-r2-coupling.mjs')
writeDocSection()

console.log('PASS_VT_CMS_05_APPLY_OVERLAY')
