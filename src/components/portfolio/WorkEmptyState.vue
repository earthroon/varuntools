<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    body?: string
  }>(),
  {
    title: '조건에 맞는 작업이 없습니다.',
    body: '필터를 줄이거나 전체 작업을 다시 확인해보세요.',
  },
)
</script>

<template>
  <div class="vt-work-empty-state">
    <strong>{{ title }}</strong>
    <p>{{ body }}</p>
  </div>
</template>
