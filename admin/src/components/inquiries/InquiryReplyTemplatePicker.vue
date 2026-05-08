<script setup lang="ts">
import { computed } from 'vue'
import type { InquiryReplyTemplateId } from '@/types/inquiryReply'
import { INQUIRY_REPLY_TEMPLATES } from '@/lib/inquiryReplyTemplates'
const props = defineProps<{ modelValue: InquiryReplyTemplateId }>()
const emit = defineEmits<{ 'update:modelValue': [value: InquiryReplyTemplateId] }>()
const selected = computed(() => INQUIRY_REPLY_TEMPLATES.find((template) => template.id === props.modelValue) ?? INQUIRY_REPLY_TEMPLATES[0])
</script>
<template><section class="template-picker"><label><span>Reply template</span><select :value="modelValue" @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value as InquiryReplyTemplateId)"><option v-for="template in INQUIRY_REPLY_TEMPLATES" :key="template.id" :value="template.id">{{ template.label }}</option></select></label><p class="description">{{ selected.description }}</p><div class="preview"><strong>{{ selected.subject }}</strong><pre>{{ selected.body }}</pre><p v-if="selected.nextStatus" class="next">Recommended next status: {{ selected.nextStatus }}</p></div></section></template>
<style scoped>.template-picker{display:grid;gap:10px}.template-picker label{display:grid;gap:6px;font-weight:800}.template-picker select{min-height:38px;border:1px solid rgba(36,31,26,.16);border-radius:12px;background:#fff;padding:0 10px}.description{margin:0;color:rgba(36,31,26,.66)}.preview{display:grid;gap:8px;padding:14px;border-radius:16px;background:rgba(255,248,230,.7);border:1px solid rgba(36,31,26,.1)}pre{white-space:pre-wrap;margin:0;line-height:1.6;font-family:inherit}.next{margin:0;font-size:12px;font-weight:800;color:#8b5d2e}</style>
