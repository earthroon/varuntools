<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchAdminActionAuditLog } from '@/lib/adminApiClient'
import type { AdminActionAuditSummary } from '@/types/admin'

const loading = ref(true)
const error = ref('')
const items = ref<AdminActionAuditSummary[]>([])

onMounted(async () => {
  try {
    const result = await fetchAdminActionAuditLog()
    items.value = result.items
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Admin API request failed.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="panel">
    <p class="eyebrow">Commit 86 · audit ledger</p>
    <h2>Admin Action Audit Log</h2>
    <p>
      This ledger records admin write dry-run attempts. Runtime execution remains blocked unless a future execution endpoint
      explicitly requires <code>executionAllowed=true</code>.
    </p>
    <p class="notice">
      Raw Access JWTs, confirm phrases, payment keys, and raw buyer emails must never be stored here. The D1 admin_action_audit_log row is the SSOT
      for auditReady, auditLogId, auditRecordedAt, and requestId.
    </p>
    <p v-if="loading">Loading from Admin API Worker...</p>
    <p v-else-if="error" role="alert">{{ error }}</p>
    <div v-else class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Created</th>
            <th>Action</th>
            <th>Risk</th>
            <th>Actor</th>
            <th>Target</th>
            <th>Status</th>
            <th>Execution</th>
            <th>Request</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>{{ item.createdAt }}</td>
            <td>{{ item.actionKind }}</td>
            <td>{{ item.riskLevel }}</td>
            <td>{{ item.actorEmailMasked ?? item.actorSub ?? 'unknown' }}</td>
            <td>{{ item.targetType }} · {{ item.targetId }}</td>
            <td>{{ item.planStatus }} · valid={{ item.planValid }}</td>
            <td>allowed={{ item.executionAllowed }} · runtimeBlocked={{ item.runtimeBlocked }}</td>
            <td>{{ item.requestId ?? item.id }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="!items.length" class="empty">No dry-run audit records returned yet.</p>
    </div>
  </section>
</template>

<style scoped>
.panel{max-width:1180px;padding:28px;border:1px solid rgba(36,31,26,.12);border-radius:24px;background:rgba(255,255,255,.66)}
.eyebrow{margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#8b5d2e}
h2{margin:0 0 16px;font-size:36px}p{line-height:1.7;color:rgba(36,31,26,.76)}code{font-weight:700;color:#6e3f16}.notice{font-weight:650}.table-wrap{overflow:auto;margin-top:18px}table{width:100%;min-width:960px;border-collapse:collapse}th,td{padding:10px 12px;border-bottom:1px solid rgba(36,31,26,.12);text-align:left;vertical-align:top}th{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#8b5d2e;background:rgba(255,248,230,.72)}td{font-size:13px}.empty{padding:14px;border-radius:14px;background:rgba(255,248,230,.72)}
</style>
