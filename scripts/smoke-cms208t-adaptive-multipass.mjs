import fs from 'node:fs'

function read(path) {
  if (!fs.existsSync(path)) throw new Error(`CMS-208T_MISSING_FILE: ${path}`)
  return fs.readFileSync(path, 'utf8')
}
function assertOk(condition, code, message) {
  if (!condition) throw new Error(`CMS-208T_${code}: ${message}`)
}
function hasAll(text, parts) {
  return parts.every((part) => text.includes(part))
}

const wgsl = read('src/media/ewa/ewaWgslSources.ts')
const adaptive = read('src/media/ewa/ewaAdaptiveTileCompute.ts')
const types = read('src/media/ewa/ewaTypes.ts')
const packageJson = JSON.parse(read('package.json'))

assertOk(hasAll(wgsl, [
  'EWA_FAST_DOWNSCALE_WGSL',
  'EWA_QMAP_LOD_MEANMAX_MIX_WGSL',
  'EWA_TILEMASK_FROM_QMAP_WGSL',
  'EWA_ADAPTIVE_COMPOSITE_WGSL',
]), 'WGSL_CONSTANTS_MISSING', 'required multipass WGSL constants must be baked')

assertOk(hasAll(adaptive, [
  'runEwaQmapLodCompute',
  'runEwaTileMaskCompute',
  'runEwaFastDownscale',
  'runEwaAdaptiveComposite',
  'vt_ewa_gallery_adaptive_multipass_encoder',
]), 'ORCHESTRATOR_MISSING', 'adaptive tile compute must orchestrate qmap, tilemask, fast, composite passes')

assertOk(hasAll(types, [
  'level0Count',
  'level1Count',
  'level2Count',
  'qmapSource',
  'qLodMaxMix',
]), 'TILE_DIAGNOSTICS_MISSING', 'tile diagnostics must expose level counts and qmap source')

assertOk(packageJson.scripts?.['smoke:cms208t:bind'], 'PACKAGE_BIND_SMOKE_MISSING', 'package.json must expose smoke:cms208t:bind')
assertOk(packageJson.scripts?.['smoke:cms208t'], 'PACKAGE_MULTIPASS_SMOKE_MISSING', 'package.json must expose smoke:cms208t')

console.log('PASS_CMS_208T_ADAPTIVE_MULTIPASS')
