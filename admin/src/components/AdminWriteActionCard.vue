<script setup lang="ts">
import type { AdminWriteActionKind, AdminWriteActionMode, AdminWriteActorRole, AdminWriteRiskLevel } from '@/types/admin'

defineProps<{
  action: AdminWriteActionKind
  title: string
  riskLevel: AdminWriteRiskLevel
  mode: AdminWriteActionMode
  requiredRole: AdminWriteActorRole
  requiredConfirmPhrase: string
  playbookHref: string
}>()
</script>

<template>
  <article class="write-card">
    <p class="eyebrow">{{ action }} · {{ riskLevel }}</p>
    <h3>{{ title }}</h3>
    <dl>
      <div><dt>Mode</dt><dd>{{ mode }}</dd></div>
      <div><dt>Required role</dt><dd>{{ requiredRole }}</dd></div>
      <div><dt>Required confirm phrase</dt><dd><code>{{ requiredConfirmPhrase }}</code></dd></div>
    </dl>
    <ul class="status-list" aria-label="Write action status contract">
      <li><strong>Dry-run planning</strong><span>reviewable plan only</span></li>
      <li><strong>Runtime execution</strong><span>blocked</span></li>
      <li><strong>Audit ledger</strong><span>required before future execution</span></li>
    </ul>
    <p class="notice">Dry-run planning can produce a valid plan, but that never implies runtime permission. Future execution code must check <code>executionAllowed=true</code>, not <code>ok=true</code> or <code>planValid=true</code>.</p>
    <a :href="playbookHref">View playbook</a>
  </article>
</template>

<style scoped>
.write-card{padding:18px;border:1px solid rgba(36,31,26,.14);border-radius:20px;background:rgba(255,248,230,.64)}
.eyebrow{margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#8b5d2e}
h3{margin:0 0 12px;font-size:22px}dl{display:grid;gap:8px;margin:0 0 14px}.write-card div{display:flex;justify-content:space-between;gap:14px}dt{font-weight:700}dd{margin:0;color:rgba(36,31,26,.72)}.status-list{display:grid;gap:7px;margin:0 0 14px;padding:0;list-style:none}.status-list li{display:flex;justify-content:space-between;gap:12px;padding:8px 10px;border-radius:12px;background:rgba(255,255,255,.46)}.status-list span{color:rgba(36,31,26,.68);text-align:right}.notice{line-height:1.6;color:rgba(36,31,26,.74)}a{font-weight:700;color:#8b5d2e}
</style>
