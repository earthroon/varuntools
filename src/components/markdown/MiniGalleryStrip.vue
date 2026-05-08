<script setup lang="ts">
export type MiniGalleryItem = {
  src: string
  thumbSrc?: string
  alt?: string
  caption?: string
  source?: string
}

const props = defineProps<{
  items: MiniGalleryItem[]
  groupId: string
}>()

const emit = defineEmits<{
  open: [payload: { groupId: string; index: number }]
}>()

function openAt(index: number) {
  emit('open', { groupId: props.groupId, index })
}
</script>

<template>
  <section
    v-if="items.length > 1"
    class="vt-mini-gallery"
    :data-gallery-group="groupId"
    aria-label="섹션 이미지 미니 갤러리"
  >
    <button
      v-for="(item, index) in items"
      :key="`${item.src}-${index}`"
      class="vt-mini-gallery__thumb"
      type="button"
      :aria-label="`${index + 1}번째 이미지 열기${item.caption ? `: ${item.caption}` : ''}`"
      @click="openAt(index)"
    >
      <img
        :src="item.thumbSrc || item.src"
        alt=""
        loading="lazy"
        decoding="async"
        draggable="false"
      />
    </button>
  </section>
</template>
