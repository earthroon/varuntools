#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const exists = (file) => fs.existsSync(path.join(root, file))

function assert(condition, message) {
  if (!condition) {
    console.error(`[smoke:ewa-webgpu-compute] FAIL ${message}`)
    process.exit(1)
  }
}

const requiredFiles = [
  'src/media/ewa/ewaWgslSources.ts',
  'src/media/ewa/ewaTextureUpload.ts',
  'src/media/ewa/ewaWebGpuCompute.ts',
  'src/media/ewa/ewaCanvasPresenter.ts',
  'src/media/ewa/ewaGalleryProcessor.ts',
  'src/media/ewa/ewaPresets.ts',
  'src/media/ewa/ewaTypes.ts',
  'src/components/markdown/MarkdownLightbox.vue',
]

for (const file of requiredFiles) assert(exists(file), `${file} must exist`)

const wgsl = read('src/media/ewa/ewaWgslSources.ts')
const upload = read('src/media/ewa/ewaTextureUpload.ts')
const compute = read('src/media/ewa/ewaWebGpuCompute.ts')
const presenter = read('src/media/ewa/ewaCanvasPresenter.ts')
const processor = read('src/media/ewa/ewaGalleryProcessor.ts')
const presets = read('src/media/ewa/ewaPresets.ts')
const lightbox = read('src/components/markdown/MarkdownLightbox.vue')
const caseGallery = read('src/components/portfolio/CaseGallery.vue')
const pkg = JSON.parse(read('package.json'))
const checkLaunch = read('scripts/check-launch.mjs')

assert(wgsl.includes('EWA_ANISO_DOWNSCALE_WGSL'), 'WGSL source module must expose EWA_ANISO_DOWNSCALE_WGSL')
assert(wgsl.includes('EWA_CANVAS_PRESENT_WGSL'), 'WGSL source module must expose EWA_CANVAS_PRESENT_WGSL')
assert(wgsl.includes('texture_storage_2d<rgba16float, write>'), 'compute WGSL must write rgba16float storage texture')
assert(wgsl.includes('@compute') && wgsl.includes('@fragment'), 'WGSL module must include compute and presentation shaders')

assert(upload.includes('loadImageBitmapForEwa'), 'texture upload module must decode ImageBitmap')
assert(upload.includes('createImageBitmap'), 'texture upload must use createImageBitmap')
assert(upload.includes('copyExternalImageToTexture'), 'texture upload must copy ImageBitmap into GPUTexture')
assert(upload.includes('GPUTextureUsage'), 'texture upload must use GPUTextureUsage')
assert(upload.includes('destroy:'), 'texture upload resource must expose destroy')

assert(compute.includes('runEwaAnisoDownscale'), 'compute module must export runEwaAnisoDownscale')
assert(compute.includes('EWA_ANISO_DOWNSCALE_WGSL'), 'compute module must use shared WGSL source')
assert(compute.includes('createComputePipeline'), 'compute module must create a WebGPU compute pipeline')
assert(compute.includes('STORAGE_BINDING') && compute.includes('TEXTURE_BINDING'), 'compute output texture must support storage and sampling')
for (const key of ['radiusMul', 'sigma', 'anisoAspect', 'deThresh', 'deSoft', 'deK']) {
  assert(compute.includes(`preset.params.${key}`) || presets.includes(key), `compute path must connect ${key}`)
}
assert(compute.includes('dispatchWorkgroups'), 'compute module must dispatch workgroups')
assert(compute.includes('EWA upscale path is intentionally skipped'), 'compute module must skip upscale path')

assert(presenter.includes('presentEwaTextureToCanvas'), 'presenter module must export presentEwaTextureToCanvas')
assert(presenter.includes('getContext(\'webgpu\')') || presenter.includes('getContext("webgpu")'), 'presenter must use a WebGPU canvas context')
assert(presenter.includes('createRenderPipeline'), 'presenter must render output texture to canvas')
assert(presenter.includes('canvas.toBlob'), 'presenter must produce a displayable blob URL from canvas')
assert(presenter.includes('URL.revokeObjectURL'), 'presenter must revoke output object URLs during cleanup')

assert(processor.includes('loadImageBitmapForEwa'), 'processor must use the texture upload module')
assert(processor.includes('uploadImageBitmapToTexture'), 'processor must upload source image to GPU texture')
assert(processor.includes('runEwaAnisoDownscale'), 'processor must call actual WebGPU EWA compute path')
assert(processor.includes('presentEwaTextureToCanvas'), 'processor must present EWA output through canvas path')
assert(processor.includes('EWA_PROCESS_TIMEOUT_MS') && processor.includes('withTimeout'), 'processor must preserve timeout fallback')
assert(processor.includes('pixel-safe-preset'), 'processor must preserve pixel-safe bypass')
assert(processor.includes('processing-timeout'), 'processor must preserve timeout reason')
assert(processor.includes('output.destroy') && processor.includes('source.destroy'), 'processor must release GPU textures after presentation')
assert(processor.includes('URL.revokeObjectURL'), 'processor must revoke cached object URLs')

assert(lightbox.includes('props.item?.src') && lightbox.includes('ewaOutputUrl'), 'lightbox must keep original-first display before processed output')
assert(lightbox.includes('processActiveItem(props.item)'), 'lightbox must process only the active image')
assert(lightbox.includes('clearRuntimeResult(true)'), 'lightbox must clean up on close/unmount')
assert(!lightbox.includes('@/media/ewa/vendor'), 'lightbox must not import vendor compute passes directly')
assert(!caseGallery.includes('@/media/ewa/vendor'), 'CaseGallery must not import vendor compute passes directly')
assert(!lightbox.includes('onMounted(() => {\n  processActiveItem'), 'processor must not run on page load')

assert(pkg.scripts?.['smoke:ewa-webgpu-compute'] === 'node scripts/smoke-ewa-webgpu-compute.mjs', 'package.json must expose smoke:ewa-webgpu-compute')
assert(checkLaunch.includes('scripts/smoke-ewa-webgpu-compute.mjs'), 'check:launch must run smoke-ewa-webgpu-compute')
assert(![wgsl, upload, compute, presenter, processor, lightbox].join('\n').includes('[object Object]'), 'sources must not contain [object Object]')

console.log('[smoke:ewa-webgpu-compute] PASS')
