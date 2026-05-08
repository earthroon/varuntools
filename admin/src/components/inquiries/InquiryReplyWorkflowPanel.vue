<script setup lang="ts">
import { computed, ref } from 'vue'
import type { AdminInquiryDetail } from '@/types/inquiryAdmin'
import type { InquiryReplyTemplateId } from '@/types/inquiryReply'
import { INQUIRY_REPLY_STATUS_GUIDE, INQUIRY_REPLY_TEMPLATES } from '@/lib/inquiryReplyTemplates'
import InquiryManualReplyChecklist from './InquiryManualReplyChecklist.vue'
import InquiryReplyTemplatePicker from './InquiryReplyTemplatePicker.vue'
const props = defineProps<{ inquiry: AdminInquiryDetail }>()
const templateId = ref<InquiryReplyTemplateId>('received-basic')
const selectedTemplate = computed(() => INQUIRY_REPLY_TEMPLATES.find((template) => template.id === templateId.value) ?? INQUIRY_REPLY_TEMPLATES[0])
const copyText = computed(() => `${selectedTemplate.value.subject}\n\n${selectedTemplate.value.body}`)
async function copyReply() {
  await navigator.clipboard?.writeText(copyText.value)
}
</script>
<template><section class="reply-workflow" aria-label="Manual reply workflow"><div class="heading"><p class="eyebrow">Reply workflow</p><h4>Manual reply support</h4><p>Automatic sending is intentionally disabled. Copy the template, reply manually, then update the inquiry status.</p></div><InquiryReplyTemplatePicker v-model="templateId" /><div class="copy-row"><button type="button" @click="copyReply">Copy reply draft</button><span v-if="selectedTemplate.nextStatus">Next: {{ selectedTemplate.nextStatus }}</span></div><InquiryManualReplyChecklist /><section class="guide"><h5>Status transition guide</h5><ul><li v-for="item in INQUIRY_REPLY_STATUS_GUIDE" :key="`${item.from}-${item.to}`"><code>{{ item.from }} → {{ item.to }}</code><span>{{ item.label }}</span></li></ul></section><p class="privacy">Notification/reply helpers do not auto-insert the full private message or send email on behalf of the admin. Current inquiry: {{ props.inquiry.id }}</p></section></template>
<style scoped>.reply-workflow{display:grid;gap:16px;padding:16px;border-radius:18px;background:rgba(255,255,255,.72);border:1px solid rgba(36,31,26,.12)}.heading{display:grid;gap:4px}.eyebrow{margin:0;font-size:11px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#8b5d2e}h4,h5,p{margin:0}.copy-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}button{min-height:38px;border:0;border-radius:13px;background:#8b5d2e;color:white;font-weight:800;cursor:pointer;padding:0 14px}.copy-row span{font-size:12px;font-weight:800;color:#8b5d2e}.guide ul{display:grid;gap:6px;margin:8px 0 0;padding:0;list-style:none}.guide li{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.guide code{padding:3px 7px;border-radius:9px;background:rgba(36,31,26,.08)}.privacy{font-size:12px;color:rgba(36,31,26,.58);line-height:1.5}</style>
