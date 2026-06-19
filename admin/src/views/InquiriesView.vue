<script setup lang="ts">
import InquiryQueueTable from '../components/inquiries/InquiryQueueTable.vue'
import InquiryFilterBar from '../components/inquiries/InquiryFilterBar.vue'
import InquiryDetailPanel from '../components/inquiries/InquiryDetailPanel.vue'
import InquiryEventTimeline from '../components/inquiries/InquiryEventTimeline.vue'
</script>
<template>
  <main class="admin-inquiries-view">
    <h1>Inquiry queue</h1>
    <InquiryFilterBar />
    <InquiryQueueTable />
    <InquiryDetailPanel />
    <InquiryEventTimeline />
  </main>
</template>
