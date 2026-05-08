#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import process from 'node:process'
const read = (path) => readFileSync(path, 'utf8')
const failures = []
const check = (condition, message) => { if (!condition) failures.push(message) }
const responsive = read('src/styles/responsive.css')
const layout = read('src/styles/markdown-layout.css')
const markdownComponents = read('src/styles/markdown-components.css')
const markdownBoxVue = read('src/components/markdown/MarkdownBox.vue')
const captionedImageVue = read('src/components/markdown/CaptionedImage.vue')
const galleryStripVue = read('src/components/markdown/GalleryStrip.vue')
const videoPlayerVue = read('src/components/markdown/VideoPlayer.vue')
const beforeAfterVue = read('src/components/markdown/BeforeAfterWiper.vue')
const lab = read('src/content/pages/lab-markdown-gallery/index.md')
const pkg = read('package.json')
const checkLaunch = read('scripts/check-launch.mjs')
const combinedLayoutCss = `${layout}\n${responsive}`
check(combinedLayoutCss.includes('.vt-media-breakout'), '.vt-media-breakout class must exist in layout CSS')
check(/\.vt-media-breakout\s*\{[\s\S]*--vt-media-max/.test(combinedLayoutCss), '.vt-media-breakout must reference --vt-media-max')
check(/\.vt-media-breakout\s*\{[\s\S]*(100vw|100dvw|calc\(100vw)/.test(combinedLayoutCss), '.vt-media-breakout must use viewport-based width')
check(responsive.includes('--vt-home-max'), '--vt-home-max token must exist')
check(/\.vt-home-section\s*\{[\s\S]*--vt-home-max/.test(responsive), '.vt-home-section must reference --vt-home-max')
check(/@media \(max-width: 719px\)[\s\S]*\.vt-media-breakout,[\s\S]*\.vt-home-section[\s\S]*transform:\s*none/.test(responsive), 'mobile reset must disable media/home breakout transforms')
check(captionedImageVue.includes('class="vt-captioned-image vt-media-breakout"'), 'CaptionedImage.vue must apply vt-media-breakout on figure')
check(galleryStripVue.includes('class="vt-gallery-strip vt-media-breakout"'), 'GalleryStrip.vue must apply vt-media-breakout on section')
check(videoPlayerVue.includes('class="vt-video-player vt-media-breakout"'), 'VideoPlayer.vue must apply vt-media-breakout on figure')
check(beforeAfterVue.includes('<figure class="vt-before-after-figure vt-media-breakout">'), 'BeforeAfterWiper.vue must apply vt-media-breakout on outer figure')
check(!beforeAfterVue.includes('class="vt-before-after vt-media-breakout"'), 'BeforeAfterWiper.vue must not apply vt-media-breakout on inner stage')
check(!markdownBoxVue.includes('vt-media-breakout'), 'MarkdownBox.vue must not apply vt-media-breakout')
check(!/\.vt-markdown-box[\s\S]{0,220}--vt-media-max/.test(markdownComponents + '\n' + responsive), 'markdown-box CSS must not reference --vt-media-max nearby')
check(!/\.vt-markdown-box[\s\S]{0,220}--vt-home-max/.test(markdownComponents + '\n' + responsive), 'markdown-box CSS must not reference --vt-home-max nearby')
check(!/\.vt-markdown\s*\{[\s\S]{0,220}--vt-media-max/.test(responsive), '.vt-markdown must not be widened to --vt-media-max')
check(lab.includes('Media Breakout Contract'), 'lab-markdown-gallery must include Media Breakout Contract fixture text')
check(pkg.includes('smoke:media-breakout'), 'package.json must expose smoke:media-breakout')
check(checkLaunch.includes('smoke-media-breakout.mjs') && checkLaunch.includes('smoke:media-breakout'), 'check-launch must run smoke:media-breakout')
if (failures.length) { console.error('[smoke:media-breakout] FAIL'); for (const f of failures) console.error(`- ${f}`); process.exit(1) }
console.log('[smoke:media-breakout] PASS media breakout rail contract holds')
