<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title?: string
    html?: string
    stack?: string[]
    tools?: string[]
    language?: string[]
    runtime?: string[]
    storage?: string[]
  }>(),
  {
    title: 'Tool Stack',
    html: '',
    stack: () => [],
    tools: () => [],
    language: () => [],
    runtime: () => [],
    storage: () => [],
  },
)

const groups = [
  ['Stack', props.stack],
  ['Tools', props.tools],
  ['Language', props.language],
  ['Runtime', props.runtime],
  ['Storage', props.storage],
].filter(([, items]) => Array.isArray(items) && items.length) as [string, string[]][]
</script>

<template>
  <section class="vt-portfolio-panel vt-tool-stack">
    <header class="vt-portfolio-panel__header">
      <p class="vt-portfolio-kicker">Tool Stack</p>
      <h2>{{ title }}</h2>
    </header>
    <div v-if="html" class="vt-markdown vt-portfolio-panel__body" v-html="html" />
    <div class="vt-tool-stack__groups">
      <div v-for="[label, items] in groups" :key="label" class="vt-tool-stack__group">
        <strong>{{ label }}</strong>
        <div class="vt-portfolio-chip-cloud">
          <span v-for="item in items" :key="item" class="vt-portfolio-chip">{{ item }}</span>
        </div>
      </div>
    </div>
  </section>
</template>
