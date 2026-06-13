<script setup lang="ts">
import type { WorkDetailContext } from '@/markdown/pageRegistry'
import RelatedWorks from './RelatedWorks.vue'
import WorkMetaChips from './WorkMetaChips.vue'
import WorkPager from './WorkPager.vue'

defineProps<{
  context: WorkDetailContext | null
}>()
</script>

<template>
  <footer v-if="context" class="vt-work-detail-footer">
    <div class="vt-work-detail-footer__meta">
      <WorkMetaChips
        :kind="context.current.kind"
        :status="context.current.status"
        :series="context.current.series"
        :tags="context.current.tags"
      />
    </div>

    <RelatedWorks :entries="context.related" title="관련 작업" />

    <WorkPager :previous="context.previous" :next="context.next" />
  </footer>
</template>
