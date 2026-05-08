<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchWebhookEvents } from '@/lib/adminApiClient'
const loading=ref(true); const error=ref(''); const items=ref<any[]>([])
onMounted(async()=>{ try{ const result:any = await fetchWebhookEvents(); items.value = Array.isArray(result) ? result : result.items } catch(caught){ error.value = caught instanceof Error ? caught.message : 'Admin API request failed.' } finally { loading.value=false }})
</script>
<template><section class="panel"><p class="eyebrow">Read-only ops view</p><h2>Webhook Events</h2><p>Read-only ops view. Write actions such as revoke, reissue, refund, and webhook replay are intentionally disabled.</p><p class="ops-link">Ops playbooks: /playbooks · Write guardrails: /write-guardrails · Ops overview: /ops</p><p v-if="loading">Loading from Admin API Worker...</p><p v-else-if="error" role="alert">{{ error }}</p><pre v-else>{{ items }}</pre></section></template>
<style scoped>.panel{max-width:1060px;padding:28px;border:1px solid rgba(36,31,26,.12);border-radius:24px;background:rgba(255,255,255,.66)}.eyebrow{margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#8b5d2e}h2{margin:0 0 16px;font-size:36px}p{line-height:1.7;color:rgba(36,31,26,.76)}pre{overflow:auto;padding:16px;border-radius:16px;background:rgba(255,248,230,.72)}</style>
