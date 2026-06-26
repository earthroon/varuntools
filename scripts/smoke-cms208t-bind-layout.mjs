import fs from 'node:fs'

const checks = []
function read(path) {
  if (!fs.existsSync(path)) throw new Error(`CMS-208T-R1_MISSING_FILE: ${path}`)
  return fs.readFileSync(path, 'utf8')
}
function assertOk(condition, code, message) {
  if (!condition) throw new Error(`CMS-208T-R1_${code}: ${message}`)
}
function hasAll(text, parts) {
  return parts.every((part) => text.includes(part))
}

const basic = read('src/media/ewa/ewaWebGpuCompute.ts')
const wgsl = read('src/media/ewa/ewaWgslSources.ts')
const fast = read('src/media/ewa/ewaFastDownscaleCompute.ts')
const qmap = read('src/media/ewa/ewaQmapLodCompute.ts')
const tile = read('src/media/ewa/ewaTileMaskCompute.ts')
const comp = read('src/media/ewa/ewaAdaptiveCompositeCompute.ts')

const basicUsesSampler = /EWA_ANISO_DOWNSCALE_WGSL[\s\S]*?@binding\(1\)[\s\S]*?sampler/.test(wgsl)
if (!basicUsesSampler) {
  assertOk(!basic.includes('binding: 1'), 'BASIC_STALE_BINDING_1', 'basic textureLoad kernel must not bind stale sampler at binding 1')
  assertOk(!basic.includes('createSampler'), 'BASIC_STALE_SAMPLER', 'basic textureLoad kernel must not create a sampler')
}

assertOk(hasAll(fast, ['EWA_FAST_DOWNSCALE_BINDING_CONTRACT', "kernel: 'textureSample'", 'binding: 1', 'sampler']), 'FAST_CONTRACT_MISSING', 'fast downscale must explicitly document sampler binding')
assertOk(hasAll(qmap, ['EWA_QMAP_LOD_BINDING_CONTRACT', "kernel: 'textureLoad'", 'binding: 1', 'storageTexture']), 'QMAP_CONTRACT_MISSING', 'qmap lod must explicitly document binding 1 as storage texture, not sampler')
assertOk(hasAll(tile, ['EWA_TILEMASK_BINDING_CONTRACT', "kernel: 'textureLoad'", 'r8uint']), 'TILEMASK_CONTRACT_MISSING', 'tilemask must explicitly document r8uint storage binding')
assertOk(hasAll(comp, ['EWA_ADAPTIVE_COMPOSITE_BINDING_CONTRACT', 'fastTex', 'tileMaskTex', 'binding: 5']), 'COMPOSITE_CONTRACT_MISSING', 'adaptive composite must document source/sampler/fast/mask/out/params binding contract')

console.log('PASS_CMS_208T_R1_BIND_LAYOUT')
