#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const exists = (file) => fs.existsSync(path.join(root, file))
const fail = (message) => {
  console.error(`[smoke:ewa-runtime-health] ${message}`)
  process.exit(1)
}
const assert = (condition, message) => { if (!condition) fail(message) }

const runtimeFile = 'src/media/ewa/ewaRuntimeHealth.ts'
const cooldownFile = 'src/media/ewa/ewaCooldown.ts'
const diagnosticsFile = 'src/media/ewa/ewaDiagnostics.ts'
const processorFile = 'src/media/ewa/ewaGalleryProcessor.ts'
const budgetFile = 'src/media/ewa/ewaQualityBudget.ts'
const debugPanelFile = 'src/components/markdown/EwaDebugPanel.vue'
const packageFile = 'package.json'
const checkLaunchFile = 'scripts/check-launch.mjs'
const docsFile = 'docs/authoring/ewa-runtime-health.md'

assert(exists(runtimeFile), 'ewaRuntimeHealth.ts must exist')
assert(exists(cooldownFile), 'ewaCooldown.ts must exist')
assert(exists(docsFile), 'ewa-runtime-health docs must exist')

const runtime = read(runtimeFile)
const diagnostics = read(diagnosticsFile)
const processor = read(processorFile)
const budget = read(budgetFile)
const debugPanel = read(debugPanelFile)
const packageJson = JSON.parse(read(packageFile))
const checkLaunch = read(checkLaunchFile)
const docs = read(docsFile)

for (const state of ['healthy', 'degraded', 'cooldown', 'disabled']) {
  assert(runtime.includes(`'${state}'`), `runtime health state ${state} is missing`)
}
for (const reason of ['repeated-timeout', 'repeated-fallback', 'device-lost', 'slow-processing']) {
  assert(runtime.includes(`'${reason}'`), `runtime health reason ${reason} is missing`)
}

assert(runtime.includes('EWA_RUNTIME_COOLDOWN_MS') && runtime.includes('60_000'), '60s session cooldown contract is missing')
assert(runtime.includes('COOLDOWN_TIMEOUTS') && runtime.includes('timeouts >= COOLDOWN_TIMEOUTS'), 'repeated timeout to cooldown contract is missing')
assert(runtime.includes('COOLDOWN_DEVICE_LOST') && runtime.includes('deviceLost >= COOLDOWN_DEVICE_LOST'), 'device lost cooldown contract is missing')
assert(runtime.includes('sessionStorage') && runtime.includes('vt:ewa-health'), 'sessionStorage runtime health contract is missing')
assert(runtime.includes('Do not store long-term health in localStorage') || docs.includes('localStorage'), 'long-term localStorage health warning is missing')
assert(runtime.includes('recordEwaRuntimeHealthResult'), 'runtime result recorder is missing')
assert(runtime.includes('applyRuntimeHealthToTier'), 'health-based tier downgrade helper is missing')
assert(runtime.includes('createEwaRuntimeHealthDiagnostics'), 'runtime health diagnostics creator is missing')

assert(diagnostics.includes('runtimeHealth?: EwaRuntimeHealthDiagnostics'), 'diagnostics.runtimeHealth field is missing')
for (const code of [
  'EWA_DIAG_RUNTIME_DEGRADED',
  'EWA_DIAG_RUNTIME_COOLDOWN_ACTIVE',
  'EWA_DIAG_RUNTIME_DISABLED',
  'EWA_DIAG_RUNTIME_TIER_DOWNGRADED',
  'EWA_DIAG_RUNTIME_REPEATED_TIMEOUT',
  'EWA_DIAG_RUNTIME_DEVICE_LOST',
  'EWA_DIAG_RUNTIME_REPEATED_FALLBACK',
]) {
  assert(diagnostics.includes(code), `${code} warning is missing`)
}

assert(processor.includes('getEwaRuntimeHealthSnapshot'), 'processor does not read runtime health')
assert(processor.includes('isEwaRuntimeCooldownActive'), 'processor does not guard cooldown before WebGPU processing')
assert(processor.includes('runtime-health-cooldown'), 'cooldown fallback reason is missing')
assert(processor.includes('runtime-health-disabled'), 'disabled fallback reason is missing')
assert(processor.includes('applyRuntimeHealthToTier'), 'processor does not apply health downgrade to tier')
assert(processor.includes('recordEwaRuntimeHealthResult'), 'processor does not record EWA results into runtime health')
assert(processor.includes('finalizeRuntimeHealth'), 'processor finalizeRuntimeHealth hook is missing')
assert(processor.includes('page load') === false, 'processor should not mention page-load execution')

assert(budget.includes('resolveEwaQualityBudget'), 'quality budget integration file is missing')
assert(debugPanel.includes('Runtime health'), 'debug panel does not display runtime health')
assert(debugPanel.includes('Cooldown'), 'debug panel does not display cooldown')
assert(debugPanel.includes('Health tier'), 'debug panel does not display recommended tier')
assert(packageJson.scripts?.['smoke:ewa-runtime-health'] === 'node scripts/smoke-ewa-runtime-health.mjs', 'package script smoke:ewa-runtime-health is missing')
assert(checkLaunch.includes('smoke-ewa-runtime-health.mjs'), 'check:launch does not include smoke:ewa-runtime-health')

assert(docs.includes('runtime health는 SSOT가 아님') || docs.includes('runtime health is not SSOT'), 'docs must state runtime health is not SSOT')
assert(docs.includes('page.csv') && docs.includes('manifest'), 'docs must state page.csv/manifest are not modified')
assert(docs.includes('analytics') && docs.includes('전송 없음'), 'docs must state there is no analytics sending')
assert(docs.includes('cooldown') && docs.includes('original fallback'), 'docs must document cooldown original fallback')

for (const file of [runtimeFile, cooldownFile, diagnosticsFile, processorFile, debugPanelFile, docsFile]) {
  assert(!read(file).includes('[object Object]'), `${file} contains [object Object]`)
}

console.log('[smoke:ewa-runtime-health] PASS')
