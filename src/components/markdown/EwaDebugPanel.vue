<script setup lang="ts">
import type { EwaDeviceDiagnostics, EwaProcessDiagnostics } from '@/media/ewa/ewaDiagnostics'
import { summarizeEwaDiagnostics } from '@/media/ewa/ewaDiagnostics'

function fmt(value: number | undefined): string {
  return value == null ? 'n/a' : `${value}ms`
}

function pct(value: number | undefined): string {
  return value == null ? 'n/a' : `${Math.round(value * 1000) / 10}%`
}

const props = defineProps<{
  diagnostics: EwaProcessDiagnostics | null
  deviceDiagnostics?: EwaDeviceDiagnostics | null
  fallbackReason?: string
}>()
</script>

<template>
  <aside
    class="vt-ewa-debug-panel"
    aria-label="EWA visual QA diagnostics"
    data-ewa-debug-panel="true"
  >
    <strong class="vt-ewa-debug-panel__title">EWA QA</strong>
    <p class="vt-ewa-debug-panel__summary">{{ summarizeEwaDiagnostics(props.diagnostics) }}</p>
    <dl class="vt-ewa-debug-panel__grid">
      <div><dt>Status</dt><dd>{{ diagnostics?.status || 'idle' }}</dd></div>
      <div><dt>Preset</dt><dd>{{ diagnostics?.preset || 'auto' }}</dd></div>
      <div><dt>Authoring preset</dt><dd>{{ diagnostics?.authoring?.ewaPreset || 'auto' }}</dd></div>
      <div><dt>Authoring mode</dt><dd>{{ diagnostics?.authoring?.ewaMode || 'auto' }}</dd></div>
      <div><dt>Authoring source</dt><dd>{{ diagnostics?.authoring?.source || 'auto' }}</dd></div>
      <div><dt>Pixel-safe</dt><dd>{{ diagnostics?.authoring?.pixelSafe === true ? 'true' : 'false' }}</dd></div>
      <div><dt>EWA enabled</dt><dd>{{ diagnostics?.authoring?.ewaEnabled === false ? 'false' : 'true' }}</dd></div>
      <div><dt>EWA note</dt><dd>{{ diagnostics?.authoring?.ewaNote || 'n/a' }}</dd></div>
      <div><dt>Mode</dt><dd>{{ diagnostics?.computeMode || 'basic' }}</dd></div>
      <div><dt>Tier</dt><dd>{{ diagnostics?.qualityBudget?.tier || 'n/a' }}</dd></div>
      <div><dt>Tier reason</dt><dd>{{ diagnostics?.qualityBudget?.tierReason?.join(', ') || 'n/a' }}</dd></div>
      <div><dt>Requested mode</dt><dd>{{ diagnostics?.qualityBudget?.requestedMode || diagnostics?.computeMode || 'basic' }}</dd></div>
      <div><dt>Resolved mode</dt><dd>{{ diagnostics?.qualityBudget?.resolvedMode || diagnostics?.computeMode || 'basic' }}</dd></div>
      <div><dt>Budget target</dt><dd>{{ diagnostics?.qualityBudget ? `${diagnostics.qualityBudget.resolvedTargetWidth || '?'}×${diagnostics.qualityBudget.resolvedTargetHeight || '?'}` : 'n/a' }}</dd></div>
      <div><dt>Budget max</dt><dd>{{ diagnostics?.qualityBudget ? `${diagnostics.qualityBudget.maxTargetWidth}×${diagnostics.qualityBudget.maxTargetHeight}` : 'n/a' }}</dd></div>
      <div><dt>Timeout budget</dt><dd>{{ diagnostics?.qualityBudget ? `${diagnostics.qualityBudget.timeoutMs}ms` : 'n/a' }}</dd></div>
      <div><dt>Adaptive allowed</dt><dd>{{ diagnostics?.qualityBudget ? (diagnostics.qualityBudget.allowAdaptiveTile ? 'true' : 'false') : 'n/a' }}</dd></div>
      <div><dt>DPR budget</dt><dd>{{ diagnostics?.qualityBudget?.maxDevicePixelRatio || 'n/a' }}</dd></div>
      <div><dt>Rollout mode</dt><dd>{{ diagnostics?.rollout?.mode || 'metadata-only' }}</dd></div>
      <div><dt>Rollout allowed</dt><dd>{{ diagnostics?.rollout ? (diagnostics.rollout.allowed ? 'true' : 'false') : 'n/a' }}</dd></div>
      <div><dt>Rollout reason</dt><dd>{{ diagnostics?.rollout?.reason || 'n/a' }}</dd></div>
      <div><dt>Rollout source</dt><dd>{{ diagnostics?.rollout?.source || 'default' }}</dd></div>
      <div><dt>Rollout metadata</dt><dd>{{ diagnostics?.rollout ? (diagnostics.rollout.metadataPresent ? 'present' : 'required/missing') : 'n/a' }}</dd></div>
      <div><dt>Runtime health</dt><dd>{{ diagnostics?.runtimeHealth?.state || 'healthy' }}</dd></div>
      <div><dt>Health reasons</dt><dd>{{ diagnostics?.runtimeHealth?.reasons?.join(', ') || 'n/a' }}</dd></div>
      <div><dt>Health attempts</dt><dd>{{ diagnostics?.runtimeHealth?.attempts ?? 0 }}</dd></div>
      <div><dt>Health successes</dt><dd>{{ diagnostics?.runtimeHealth?.successes ?? 0 }}</dd></div>
      <div><dt>Health failures</dt><dd>{{ diagnostics?.runtimeHealth?.failures ?? 0 }}</dd></div>
      <div><dt>Health timeouts</dt><dd>{{ diagnostics?.runtimeHealth?.timeouts ?? 0 }}</dd></div>
      <div><dt>Device lost</dt><dd>{{ diagnostics?.runtimeHealth?.deviceLost ?? 0 }}</dd></div>
      <div><dt>Cooldown</dt><dd>{{ diagnostics?.runtimeHealth?.cooldownActive ? `${Math.ceil((diagnostics.runtimeHealth.cooldownRemainingMs || 0) / 1000)}s` : 'inactive' }}</dd></div>
      <div><dt>Health tier</dt><dd>{{ diagnostics?.runtimeHealth?.recommendedTier || 'n/a' }}</dd></div>
      <div><dt>Adaptive fallback</dt><dd>{{ diagnostics?.adaptiveFallback || 'none' }}</dd></div>
      <div><dt>Source</dt><dd>{{ diagnostics?.sourceWidth || '?' }}×{{ diagnostics?.sourceHeight || '?' }}</dd></div>
      <div><dt>Target</dt><dd>{{ diagnostics?.targetWidth || '?' }}×{{ diagnostics?.targetHeight || '?' }}</dd></div>
      <div><dt>DPR</dt><dd>{{ diagnostics?.devicePixelRatio || 'n/a' }}</dd></div>
      <div><dt>Decode</dt><dd>{{ fmt(diagnostics?.decodeMs) }}</dd></div>
      <div><dt>Upload</dt><dd>{{ fmt(diagnostics?.uploadMs) }}</dd></div>
      <div><dt>Compute</dt><dd>{{ fmt(diagnostics?.computeMs) }}</dd></div>
      <div><dt>Present</dt><dd>{{ fmt(diagnostics?.presentMs) }}</dd></div>
      <div><dt>Total</dt><dd>{{ fmt(diagnostics?.totalMs) }}</dd></div>
      <div><dt>Fallback</dt><dd>{{ fallbackReason || diagnostics?.fallbackReason || 'none' }}</dd></div>
      <div><dt>Tile px</dt><dd>{{ diagnostics?.tileDiagnostics?.tilePx || 'n/a' }}</dd></div>
      <div><dt>Q threshold</dt><dd>{{ diagnostics?.tileDiagnostics?.qThresh ?? 'n/a' }}</dd></div>
      <div><dt>Tiles</dt><dd>{{ diagnostics?.tileDiagnostics ? `${diagnostics.tileDiagnostics.tilesW}×${diagnostics.tileDiagnostics.tilesH}` : 'n/a' }}</dd></div>
      <div><dt>Active tiles</dt><dd>{{ diagnostics?.tileDiagnostics ? `${diagnostics.tileDiagnostics.activeTileCount}/${diagnostics.tileDiagnostics.totalTiles}` : 'n/a' }}</dd></div>
      <div><dt>Active ratio</dt><dd>{{ pct(diagnostics?.tileDiagnostics?.activeTileRatio) }}</dd></div>
      <div><dt>Compute format</dt><dd>{{ diagnostics?.presentation?.computeFormat || 'rgba16float' }}</dd></div>
      <div><dt>Presentation</dt><dd>{{ diagnostics?.presentation?.presentationFamily || 'rgba8unorm-srgb' }}</dd></div>
      <div><dt>Canvas format</dt><dd>{{ diagnostics?.presentation?.canvasFormat || deviceDiagnostics?.preferredCanvasFormat || 'n/a' }}</dd></div>
      <div><dt>Color</dt><dd>{{ diagnostics?.presentation ? `${diagnostics.presentation.colorSpace || 'srgb'} / ${diagnostics.presentation.bitDepth || 8}-bit / ${diagnostics.presentation.dynamicRange || 'sdr'}` : 'sRGB / 8-bit / SDR' }}</dd></div>
      <div><dt>Alpha</dt><dd>{{ diagnostics?.presentation?.alphaMode || 'opaque' }}</dd></div>
      <div><dt>Output</dt><dd>{{ diagnostics?.presentation ? `${diagnostics.presentation.outputFormat || 'webp'} ${diagnostics.presentation.outputQuality ?? 0.92}` : 'webp 0.92' }}</dd></div>
      <div><dt>Blob</dt><dd>{{ diagnostics?.presentation?.blobBytes ? `${Math.round(diagnostics.presentation.blobBytes / 1024)}KB / ${fmt(diagnostics.presentation.blobMs)}` : 'n/a' }}</dd></div>
      <div><dt>Object URL</dt><dd>{{ diagnostics?.presentation?.objectUrlCreated ? 'created' : 'n/a' }}</dd></div>
      <div><dt>WebGPU</dt><dd>{{ deviceDiagnostics?.supported ? 'supported' : deviceDiagnostics?.failureReason || 'unknown' }}</dd></div>
    </dl>
    <p v-if="diagnostics?.warnings?.length" class="vt-ewa-debug-panel__warnings">
      {{ diagnostics.warnings.join(', ') }}
    </p>
  </aside>
</template>
