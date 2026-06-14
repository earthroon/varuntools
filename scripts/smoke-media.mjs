#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { getMediaAssetType, resolveFilesystemMediaAsset } from './lib/asset-registry.mjs'

const root = process.cwd()
const checks = []
const exists = (p) => fs.existsSync(path.join(root, p))
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')

checks.push(['VideoPlayer.vue exists', exists('src/components/markdown/VideoPlayer.vue')])
checks.push(['video-player directive exists', exists('src/markdown/directives/videoPlayerDirective.ts')])
checks.push(['directiveTypes knows video-player', read('src/markdown/directiveTypes.ts').includes("'video-player'")])
checks.push(['directive index routes video-player', read('src/markdown/directives/index.ts').includes("case 'video-player'")])
checks.push(['mountMarkdownComponents mounts video-player', read('src/markdown/mountMarkdownComponents.ts').includes("querySelectorAll('video-player, varun-video')")])
checks.push(['asset registry recognizes webm', getMediaAssetType('demo.webm') === 'video'])
checks.push(['asset registry recognizes mp4', getMediaAssetType('demo.mp4') === 'video'])
checks.push(['asset registry recognizes m3u8', getMediaAssetType('demo.m3u8') === 'stream'])
checks.push(['asset registry recognizes poster svg', getMediaAssetType('poster.svg') === 'image'])
checks.push(['validate-content checks video-player', read('scripts/validate-content.mjs').includes('validateVideoPlayerDirectives')])
checks.push(['Visual QA contains Video Player section', read('src/content/pages/lab-markdown-gallery/index.md').includes('## 13. Video Player')])
checks.push(['Visual QA uses video-player directive', read('src/content/pages/lab-markdown-gallery/index.md').includes('::video-player')])
checks.push(['qa-video poster exists', exists('src/content/pages/lab-markdown-gallery/images/qa-video-poster.svg')])
checks.push(['qa-video sample exists', exists('src/content/pages/lab-markdown-gallery/videos/qa-video.webm')])
checks.push(['CSS contains vt-video-player', read('src/styles/markdown-components.css').includes('.vt-video-player')])

const pageFile = path.join(root, 'src/content/pages/lab-markdown-gallery/index.md')
const resolved = resolveFilesystemMediaAsset({
  source: './videos/qa-video.webm',
  contentFilePath: pageFile,
  projectRoot: root,
  expectedType: 'video',
})
checks.push(['qa-video resolves as local video', resolved.found && resolved.mediaType === 'video'])

const failed = checks.filter(([, ok]) => !ok)
if (failed.length) {
  for (const [name] of failed) console.error(`[media] failed: ${name}`)
  process.exit(1)
}

console.log(`[media] OK — ${checks.length} checks`)
