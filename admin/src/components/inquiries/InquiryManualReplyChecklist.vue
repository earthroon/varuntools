<script setup lang="ts">
import { ref } from 'vue'
import { INQUIRY_MANUAL_REPLY_CHECKLIST } from '@/lib/inquiryReplyTemplates'
const checked = ref<Record<string, boolean>>({})
</script>
<template><section class="manual-checklist"><h5>Manual reply checklist</h5><ul><li v-for="item in INQUIRY_MANUAL_REPLY_CHECKLIST" :key="item.id"><label><input v-model="checked[item.id]" type="checkbox" /><span>{{ item.label }}</span><strong v-if="item.required">required</strong></label></li></ul></section></template>
<style scoped>.manual-checklist{display:grid;gap:8px}h5{margin:0;font-size:14px}ul{display:grid;gap:8px;margin:0;padding:0;list-style:none}label{display:flex;gap:8px;align-items:center;line-height:1.45}strong{margin-left:auto;font-size:11px;color:#8b5d2e;text-transform:uppercase}</style>
