#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const requiredRootTail = /(?:^|[\\/])dd[\\/]varuntools$/i
const normalizedRoot = root.replace(/\\/g, '/')

if (!requiredRootTail.test(root) && !normalizedRoot.endsWith('/dd/varuntools')) {
  console.warn(`[VT-CMS-02] expected local repo D:\\11124\\dd\\varuntools, current=${root}`)
}

function abs(file) {
  return path.join(root, file)
}

function read(file) {
  return fs.readFileSync(abs(file), 'utf8')
}

function write(file, text) {
  fs.mkdirSync(path.dirname(abs(file)), { recursive: true })
  fs.writeFileSync(abs(file), text, 'utf8')
}

function ensureFile(file) {
  if (!fs.existsSync(abs(file))) throw new Error(`${file} missing. Unzip the overlay at the varuntools repo root first.`)
}

function ensureImport(text, anchor, insertion) {
  if (text.includes(insertion)) return text
  if (!text.includes(anchor)) throw new Error(`import anchor not found: ${anchor}`)
  return text.replace(anchor, `${anchor}\n${insertion}`)
}

function ensureMountBlock(text) {
  if (text.includes("root.querySelectorAll('image-sequence')")) return text

  const marker = '  const mounted: MountedApp[] = []'
  if (!text.includes(marker)) throw new Error('mount block marker not found')

  const block = `

  root.querySelectorAll('image-sequence').forEach((element) => {
    const el = element as HTMLElement
    const itemsTemplate = el.querySelector('template[data-image-sequence-items]') as HTMLTemplateElement | null
    const rawItems = parseImageSequenceTemplateItems(itemsTemplate?.textContent || '')

    const items = rawItems.map((item) => {
      const srcAsset = resolveContentAssetMeta(options.contentDir, item.src)

      return {
        assetId: item.assetId,
        src: srcAsset.url,
        srcFound: srcAsset.found,
        srcReason: srcAsset.reason || '',
        source: item.src || '',
        alt: item.alt || '',
        caption: item.caption,
        width: item.width,
        height: item.height,
        filename: item.filename,
        mimeType: item.mimeType,
      }
    })

    const props = {
      layout: el.dataset.layout === 'crop-strip' ? 'crop-strip' : 'crop-strip',
      reserved: boolAttr(el.dataset.reserved, true),
      lazy: boolAttr(el.dataset.lazy, true),
      fade: boolAttr(el.dataset.fade, true),
      width: numberAttr(el.dataset.width, 0) || undefined,
      height: numberAttr(el.dataset.height, 0) || undefined,
      items,
    }

    const mountedApp = mountOne(element, ImageSequence, props)
    if (mountedApp) mounted.push(mountedApp)
  })`

  return text.replace(marker, `${marker}${block}`)
}

for (const file of [
  'src/components/markdown/ImageSequence.vue',
  'src/markdown/imageSequenceItems.ts',
  'scripts/smoke-cms-image-sequence-public-renderer.mjs',
  'docs/CMS_IMAGE_SEQUENCE_PUBLIC_RENDERER.md',
]) ensureFile(file)

let mount = read('src/markdown/mountMarkdownComponents.ts')
mount = ensureImport(mount, "import GalleryStrip from '@/components/markdown/GalleryStrip.vue'", "import ImageSequence from '@/components/markdown/ImageSequence.vue'")
mount = ensureImport(mount, "import { parseGalleryStripItems } from './galleryStripItems'", "import { parseImageSequenceTemplateItems } from './imageSequenceItems'")
mount = ensureMountBlock(mount)
write('src/markdown/mountMarkdownComponents.ts', mount)

const pkgPath = 'package.json'
const pkg = JSON.parse(read(pkgPath))
pkg.scripts = pkg.scripts || {}
pkg.scripts['smoke:cms-image-sequence-renderer'] = 'node scripts/smoke-cms-image-sequence-public-renderer.mjs'
write(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)

console.log('PASS_VT_CMS_02_APPLY_OVERLAY')
