#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const exists = (file) => fs.existsSync(path.join(root, file))
const assert = (condition, message) => {
  if (!condition) {
    console.error(`[smoke:ewa-rollout-gate] FAIL ${message}`)
    process.exit(1)
  }
}

const packageJson = JSON.parse(read('package.json'))
assert(packageJson.scripts?.['smoke:ewa-rollout-gate'] === 'node scripts/smoke-ewa-rollout-gate.mjs', 'package script must exist')

const featureFlagsFile = 'src/media/ewa/ewaFeatureFlags.ts'
const rolloutGateFile = 'src/media/ewa/ewaRolloutGate.ts'
const typesFile = 'src/media/ewa/ewaTypes.ts'
const diagnosticsFile = 'src/media/ewa/ewaDiagnostics.ts'
const processorFile = 'src/media/ewa/ewaGalleryProcessor.ts'
const debugPanelFile = 'src/components/markdown/EwaDebugPanel.vue'
const checkLaunchFile = 'scripts/check-launch.mjs'
const docsFile = 'docs/authoring/ewa-rollout-gate.md'

assert(exists(featureFlagsFile), 'ewaFeatureFlags.ts must exist')
assert(exists(rolloutGateFile), 'ewaRolloutGate.ts must exist')
assert(exists(docsFile), 'ewa-rollout-gate docs must exist')

const flags = read(featureFlagsFile)
const gate = read(rolloutGateFile)
const types = read(typesFile)
const diagnostics = read(diagnosticsFile)
const processor = read(processorFile)
const panel = read(debugPanelFile)
const checkLaunch = read(checkLaunchFile)
const docs = read(docsFile)

for (const mode of ['off', 'debug-only', 'metadata-only', 'enabled']) {
  assert(types.includes(`'${mode}'`) || flags.includes(`'${mode}'`), `rollout mode ${mode} is missing`)
}

assert(flags.includes('VITE_EWA_ROLLOUT_MODE'), 'VITE_EWA_ROLLOUT_MODE contract is missing')
assert(flags.includes('vt:ewa-rollout'), 'vt:ewa-rollout debug override hook is missing')
assert(flags.includes('isEwaDebugEnabled') && flags.includes('getEwaRolloutDebugOverride'), 'debug-only rollout override guard is missing')
assert(flags.includes("DEFAULT_EWA_ROLLOUT_MODE: EwaRolloutMode = 'metadata-only'"), 'default rollout mode must be metadata-only')

assert(gate.includes('resolveEwaRolloutDecision'), 'rollout decision resolver is missing')
assert(gate.includes('hasEwaAuthoringMetadata'), 'metadata presence helper is missing')
assert(gate.includes('media?.ewaEnabled === false'), 'media.ewaEnabled=false priority is missing')
assert(gate.includes('media?.pixelSafe === true'), 'media.pixelSafe=true priority is missing')
assert(gate.includes("input.mode === 'metadata-only'"), 'metadata-only branch is missing')
assert(gate.includes('debug-only-without-debug'), 'debug-only without debug block is missing')
assert(gate.includes('metadata-required'), 'metadata-required block is missing')
assert(gate.includes('metadata-enabled'), 'metadata-enabled allow is missing')
assert(gate.includes('runtime-health-blocked'), 'runtime health block is missing')
assert(gate.includes('webgpu-unsupported'), 'WebGPU unsupported block is missing')

assert(processor.includes('resolveEwaRolloutFeatureMode'), 'processor does not resolve rollout mode')
assert(processor.includes('resolveEwaRolloutDecision'), 'processor does not call rollout gate')
assert(processor.includes('createEwaRolloutDiagnostics'), 'processor does not create rollout diagnostics')
assert(processor.includes('!rolloutDecision.allowed'), 'processor does not block disallowed rollout decisions')
assert(processor.includes('fallbackReasonForRollout'), 'processor does not map rollout decisions to fallback reasons')
assert(processor.includes('isNavigatorWebGpuAvailable'), 'processor does not check WebGPU support for rollout')

assert(diagnostics.includes('rollout?: EwaRolloutDiagnostics'), 'diagnostics.rollout field is missing')
for (const code of [
  'EWA_DIAG_ROLLOUT_OFF',
  'EWA_DIAG_ROLLOUT_DEBUG_ONLY_BLOCKED',
  'EWA_DIAG_ROLLOUT_METADATA_REQUIRED',
  'EWA_DIAG_ROLLOUT_ALLOWED_BY_METADATA',
  'EWA_DIAG_ROLLOUT_ALLOWED_BY_DEBUG_OVERRIDE',
]) {
  assert(diagnostics.includes(code), `${code} warning is missing`)
}

for (const label of ['Rollout mode', 'Rollout allowed', 'Rollout reason', 'Rollout source', 'Rollout metadata']) {
  assert(panel.includes(label), `DebugPanel must display ${label}`)
}
assert(checkLaunch.includes('smoke-ewa-rollout-gate.mjs'), 'check:launch must include smoke:ewa-rollout-gate')
assert(!processor.includes('processActiveImage({ src:'), 'rollout gate must not trigger processor on page load')
assert(!read('src/components/markdown/WorkCard.vue').includes('ewaRollout'), 'WorkCard must not run rollout-gated EWA processing')

assert(docs.includes('metadata-only'), 'docs must document metadata-only mode')
assert(docs.includes('VITE_EWA_ROLLOUT_MODE'), 'docs must document VITE_EWA_ROLLOUT_MODE')
assert(docs.includes('vt:ewa-rollout'), 'docs must document vt:ewa-rollout debug override')
assert(docs.includes('media.ewaEnabled=false') && docs.includes('pixelSafe'), 'docs must document metadata priority')
assert(docs.includes('page.csv') && docs.includes('수정하지'), 'docs must state rollout does not modify SSOT')

for (const file of [featureFlagsFile, rolloutGateFile, typesFile, diagnosticsFile, processorFile, debugPanelFile, docsFile]) {
  assert(!read(file).includes('[object Object]'), `${file} must not contain [object Object]`)
}

console.log('[smoke:ewa-rollout-gate] PASS')
