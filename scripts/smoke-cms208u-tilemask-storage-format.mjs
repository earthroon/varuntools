import fs from 'node:fs'

const tile = fs.readFileSync('src/media/ewa/ewaTileMaskCompute.ts', 'utf8')
const wgsl = fs.readFileSync('src/media/ewa/ewaWgslSources.ts', 'utf8')
const composite = fs.readFileSync('src/media/ewa/ewaAdaptiveCompositeCompute.ts', 'utf8')

if (tile.includes("storageTexture: { access: 'write-only', format: 'r8uint' }")) {
  throw new Error('CMS208U_TILEMASK_BGL_STILL_USES_R8UINT_STORAGE')
}

if (tile.includes("format: 'r8uint'")) {
  throw new Error('CMS208U_TILEMASK_TEXTURE_STILL_USES_R8UINT')
}

if (wgsl.includes('texture_storage_2d<r8uint, write>')) {
  throw new Error('CMS208U_WGSL_STILL_USES_R8UINT_STORAGE')
}

if (!tile.includes("storageTexture: { access: 'write-only', format: 'rgba8uint' }")) {
  throw new Error('CMS208U_TILEMASK_BGL_RGBA8UINT_MISSING')
}

if (!tile.includes("format: 'rgba8uint'")) {
  throw new Error('CMS208U_TILEMASK_TEXTURE_RGBA8UINT_MISSING')
}

if (!wgsl.includes('texture_storage_2d<rgba8uint, write>')) {
  throw new Error('CMS208U_WGSL_RGBA8UINT_STORAGE_MISSING')
}

if (!composite.includes("texture: { sampleType: 'uint' }")) {
  throw new Error('CMS208U_COMPOSITE_UINT_SAMPLE_CONTRACT_MISSING')
}

if (!composite.includes('texture_2d<u32>')) {
  throw new Error('CMS208U_COMPOSITE_WGSL_UINT_TEXTURE_CONTRACT_MISSING')
}

console.log('PASS_CMS208U_TILEMASK_RGBA8UINT_STORAGE_TEXTURE')
