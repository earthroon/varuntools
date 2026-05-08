<script setup lang="ts">
import type { AdminInquiryListItem } from '@/types/inquiryAdmin'
import InquiryStatusBadge from './InquiryStatusBadge.vue'
import InquiryPriorityBadge from './InquiryPriorityBadge.vue'
defineProps<{ items: AdminInquiryListItem[]; selectedId?: string }>()
const emit = defineEmits<{ select: [item: AdminInquiryListItem] }>()
</script>
<template><div class="table-wrap"><table><thead><tr><th>Received</th><th>Status</th><th>Priority</th><th>Category</th><th>Title</th><th>Nickname</th><th>Email</th><th>Product</th></tr></thead><tbody><tr v-for="item in items" :key="item.id" :class="{ selected: selectedId === item.id }" @click="emit('select', item)"><td>{{ item.receivedAt || item.createdAt }}</td><td><InquiryStatusBadge :status="item.status" /></td><td><InquiryPriorityBadge :priority="item.priority" /></td><td>{{ item.category }}</td><td><strong>{{ item.title }}</strong><small>{{ item.sourcePath }}</small></td><td>{{ item.nickname || '-' }}</td><td>{{ item.email ? 'provided' : '-' }}</td><td>{{ item.relatedProductSlug || '-' }}</td></tr></tbody></table></div></template>
<style scoped>.table-wrap{overflow:auto;border:1px solid rgba(36,31,26,.12);border-radius:20px;background:rgba(255,255,255,.62)}table{width:100%;border-collapse:collapse;min-width:920px}th,td{padding:13px 14px;text-align:left;border-bottom:1px solid rgba(36,31,26,.08);vertical-align:top}th{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:rgba(36,31,26,.58);background:rgba(255,248,230,.62)}tr{cursor:pointer}tr:hover,tr.selected{background:rgba(255,248,230,.78)}small{display:block;margin-top:4px;color:rgba(36,31,26,.56)}</style>
