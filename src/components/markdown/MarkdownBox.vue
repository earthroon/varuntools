<script setup lang="ts">
import { computed, ref } from 'vue'

let markdownBoxIdSeed = 0

const BOX_TYPES = ['note', 'tip', 'warning', 'danger', 'quote', 'decision', 'ssot'] as const
const BOX_TONES = ['neutral', 'blue', 'amber', 'red', 'green', 'ink'] as const

type MarkdownBoxType = (typeof BOX_TYPES)[number]
type MarkdownBoxTone = (typeof BOX_TONES)[number]

type BoxMeta = {
  title: string
  icon: string
  tone: MarkdownBoxTone
}

const BOX_META: Record<MarkdownBoxType, BoxMeta> = {
  note: { title: 'Note', icon: '✦', tone: 'neutral' },
  tip: { title: 'Tip', icon: '↗', tone: 'blue' },
  warning: { title: 'Warning', icon: '!', tone: 'amber' },
  danger: { title: 'Danger', icon: '×', tone: 'red' },
  quote: { title: 'Quote', icon: '“', tone: 'ink' },
  decision: { title: 'Decision', icon: '✓', tone: 'green' },
  ssot: { title: 'SSOT', icon: '◆', tone: 'blue' },
}

const props = withDefaults(
  defineProps<{
    type?: string
    title?: string
    tone?: string
    icon?: string
    collapsible?: boolean
    defaultOpen?: boolean
    html?: string
  }>(),
  {
    type: 'note',
    title: '',
    tone: '',
    icon: '',
    collapsible: false,
    defaultOpen: true,
    html: '',
  },
)

function normalizeType(value: string): MarkdownBoxType {
  return (BOX_TYPES as readonly string[]).includes(value) ? (value as MarkdownBoxType) : 'note'
}

function normalizeTone(value: string, fallback: MarkdownBoxTone): MarkdownBoxTone {
  return (BOX_TONES as readonly string[]).includes(value) ? (value as MarkdownBoxTone) : fallback
}

const instanceId = `markdown-box-${++markdownBoxIdSeed}`
const bodyId = `${instanceId}-body`
const normalizedType = computed(() => normalizeType(props.type))
const meta = computed(() => BOX_META[normalizedType.value])
const normalizedTone = computed(() => normalizeTone(props.tone, meta.value.tone))
const resolvedTitle = computed(() => props.title.trim() || meta.value.title)
const resolvedIcon = computed(() => props.icon.trim() || meta.value.icon)
const isOpen = ref(props.defaultOpen)
</script>

<template>
  <article
    class="vt-markdown-box"
    :data-type="normalizedType"
    :data-tone="normalizedTone"
    :data-collapsible="collapsible ? '1' : '0'"
  >
    <button
      v-if="collapsible"
      class="vt-markdown-box__header"
      type="button"
      :aria-expanded="isOpen ? 'true' : 'false'"
      :aria-controls="bodyId"
      @click="isOpen = !isOpen"
    >
      <span class="vt-markdown-box__icon" aria-hidden="true">{{ resolvedIcon }}</span>
      <strong class="vt-markdown-box__title">{{ resolvedTitle }}</strong>
      <span class="vt-markdown-box__chevron" aria-hidden="true">▾</span>
    </button>

    <header v-else class="vt-markdown-box__header">
      <span class="vt-markdown-box__icon" aria-hidden="true">{{ resolvedIcon }}</span>
      <strong class="vt-markdown-box__title">{{ resolvedTitle }}</strong>
    </header>

    <div
      :id="bodyId"
      v-show="!collapsible || isOpen"
      class="vt-markdown-box__body vt-markdown"
      v-html="html"
    />
  </article>
</template>
