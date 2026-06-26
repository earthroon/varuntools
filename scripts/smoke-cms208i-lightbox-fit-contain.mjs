import fs from 'node:fs'

const PATCH_ID = 'CMS-208I'

function readText(path) {
  if (!fs.existsSync(path)) {
    throw new Error(PATCH_ID + '_MISSING_FILE: ' + path)
  }
  return fs.readFileSync(path, 'utf8')
}

function assertOk(condition, code, message) {
  if (!condition) {
    throw new Error(PATCH_ID + '_' + code + ': ' + message)
  }
}

function hasAll(text, parts) {
  return parts.every(function (part) {
    return text.includes(part)
  })
}

const vuePath = 'src/components/markdown/MarkdownLightbox.vue'
const lightboxCssPath = 'src/styles/markdown-lightbox.css'
const ewaCssPath = 'src/styles/ewa-debug.css'
const packagePath = 'package.json'

const vue = readText(vuePath)
const lightboxCss = readText(lightboxCssPath)
const ewaCss = readText(ewaCssPath)
const pkg = JSON.parse(readText(packagePath))

assertOk(
  vue.includes('const stageSize = ref<Size>'),
  'STAGE_SIZE_STATE_MISSING',
  'MarkdownLightbox.vue must own stageSize state.'
)

assertOk(
  vue.includes('ResizeObserver'),
  'RESIZE_OBSERVER_MISSING',
  'MarkdownLightbox.vue must observe stage size changes.'
)

assertOk(
  hasAll(vue, ['function getStageSize(): Size', 'return stageSize.value']),
  'GET_STAGE_SIZE_NOT_STATE_BACKED',
  'getStageSize() must return stageSize.value.'
)

assertOk(
  vue.includes('const imageFitSize = computed'),
  'IMAGE_FIT_SIZE_MISSING',
  'MarkdownLightbox.vue must compute imageFitSize.'
)

assertOk(
  hasAll(vue, ['getContainedSize({', 'container: stageSize.value', 'natural: imageNaturalSize.value']),
  'IMAGE_FIT_SIZE_NOT_CONTAINED',
  'imageFitSize must use getContainedSize(stageSize, imageNaturalSize).'
)

assertOk(
  vue.includes('const imageRenderStyle = computed'),
  'IMAGE_RENDER_STYLE_MISSING',
  'MarkdownLightbox.vue must expose imageRenderStyle.'
)

assertOk(
  vue.includes('imageFitSize.value.width'),
  'IMAGE_RENDER_WIDTH_NOT_BOUND',
  'imageRenderStyle must bind width to imageFitSize.'
)

assertOk(
  vue.includes('imageFitSize.value.height'),
  'IMAGE_RENDER_HEIGHT_NOT_BOUND',
  'imageRenderStyle must bind height to imageFitSize.'
)

assertOk(
  vue.includes(':style="imageRenderStyle"'),
  'IMAGE_STYLE_NOT_BOUND',
  'The lightbox img must use imageRenderStyle.'
)

assertOk(
  hasAll(vue, ['function getImageBaseSize(): Size', 'return imageFitSize.value']),
  'IMAGE_BASE_SIZE_NOT_SSOT',
  'getImageBaseSize() must return imageFitSize.value.'
)

assertOk(
  !vue.includes('<EwaCompareView') || vue.includes(':image-style="imageRenderStyle"'),
  'EWA_COMPARE_STYLE_NOT_BOUND',
  'EwaCompareView must receive imageRenderStyle when present.'
)

assertOk(
  lightboxCss.includes('CMS-208I') || lightboxCss.includes('Lightbox Fit Contain Stage SSOT'),
  'CSS_PATCH_MARKER_MISSING',
  'markdown-lightbox.css must include CMS-208I marker.'
)

assertOk(
  lightboxCss.includes('max-height: none') || lightboxCss.includes('max-block-size: none'),
  'LIGHTBOX_IMAGE_MAX_HEIGHT_NOT_NEUTRALIZED',
  'Lightbox image CSS must neutralize viewport max-height ownership.'
)

assertOk(
  hasAll(lightboxCss, ['.vt-lightbox__stage', 'place-items: center']),
  'LIGHTBOX_STAGE_CENTERING_MISSING',
  'Lightbox stage must center the fit-contained image.'
)

assertOk(
  ewaCss.includes('object-fit: contain') || ewaCss.includes('max-height: none'),
  'EWA_CSS_CONTAIN_MISSING',
  'EWA compare images must preserve contain behavior.'
)

assertOk(
  pkg.scripts && pkg.scripts['smoke:lightbox-fit-contain'],
  'PACKAGE_SCRIPT_MISSING',
  'package.json must expose smoke:lightbox-fit-contain.'
)

console.log('PASS_CMS_208I_LIGHTBOX_FIT_CONTAIN_STAGE_SSOT')
