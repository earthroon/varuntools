<script setup lang="ts">
import AdminWriteActionCard from '@/components/AdminWriteActionCard.vue'

const actions = [
  { action: 'grant-revoke', title: 'Grant revoke dry-run', riskLevel: 'high', mode: 'disabled', requiredRole: 'owner', requiredConfirmPhrase: 'REVOKE GRANT', playbookHref: '/docs/ops/grant-revoke-dry-run.md' },
  { action: 'grant-reissue', title: 'Grant reissue dry-run', riskLevel: 'critical', mode: 'disabled', requiredRole: 'owner', requiredConfirmPhrase: 'REISSUE GRANT', playbookHref: '/docs/ops/grant-reissue-dry-run.md' },
  { action: 'refund-note', title: 'Refund note dry-run', riskLevel: 'medium', mode: 'disabled', requiredRole: 'owner', requiredConfirmPhrase: 'REFUND NOTE', playbookHref: '/docs/ops/refund-note-dry-run.md' },
  { action: 'webhook-replay', title: 'Webhook replay dry-run', riskLevel: 'critical', mode: 'disabled', requiredRole: 'owner', requiredConfirmPhrase: 'REPLAY WEBHOOK', playbookHref: '/docs/ops/webhook-replay-guardrails.md' },
] as const
</script>

<template>
  <section class="panel">
    <p class="eyebrow">Dry-run only</p>
    <h2>Admin Write Guardrails</h2>
    <p>
      Admin write actions are disabled. This surface shows dry-run planning slots for future grant revoke,
      grant reissue, refund-note, support-note, and webhook-replay workflows. There is no runtime write button here.
    </p>
    <p class="warning">Dry-run validity and runtime execution are separate states. A valid plan never implies execution permission; future mutation code must obey executionAllowed only.</p>
    <div class="grid">
      <AdminWriteActionCard v-for="item in actions" :key="item.action" v-bind="item" />
    </div>
  </section>
</template>

<style scoped>
.panel{max-width:1120px;padding:28px;border:1px solid rgba(36,31,26,.12);border-radius:24px;background:rgba(255,255,255,.66)}
.eyebrow{margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#8b5d2e}
h2{margin:0 0 16px;font-size:36px}p{line-height:1.7;color:rgba(36,31,26,.76)}.warning{font-weight:700;color:#6e3f16}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin-top:22px}
</style>
