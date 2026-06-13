<script setup lang="ts">
defineProps<{
  resultCount: number
  hasQuery: boolean
}>()

const query = defineModel<string>('query', { required: true })

defineEmits<{
  reset: []
}>()
</script>

<template>
  <section class="vt-page-search__panel" aria-labelledby="page-search-title">
    <label class="vt-page-search__field">
      <span id="page-search-title">VARUNTOOLS 검색</span>
      <input
        v-model="query"
        type="search"
        placeholder="작업, 문서, 스토어, 가이드 검색"
        aria-describedby="page-search-summary"
        autocomplete="off"
      />
    </label>

    <div id="page-search-summary" class="vt-page-search__summary" aria-live="polite">
      <template v-if="hasQuery">
        <strong>{{ resultCount }}</strong>
        <span>개 결과</span>
      </template>
      <template v-else>
        <span>검색어를 입력하면 페이지, 작업, 문서를 찾아줍니다.</span>
      </template>
    </div>

    <button v-if="hasQuery" class="vt-page-search__reset" type="button" @click="$emit('reset')">
      초기화
    </button>
  </section>
</template>
