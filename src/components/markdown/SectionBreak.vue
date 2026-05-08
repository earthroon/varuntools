<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label?: string
    tone?: string
  }>(),
  {
    label: '',
    tone: 'quiet',
  },
)

const allowedTones = new Set(['quiet', 'accent', 'ink'])

function toneClass(tone: string): string {
  return allowedTones.has(tone) ? `is-${tone}` : 'is-quiet'
}
</script>

<template>
  <div class="vt-section-break" :class="toneClass(props.tone)" aria-hidden="true">
    <span v-if="props.label" class="vt-section-break__label">{{ props.label }}</span>
  </div>
</template>
