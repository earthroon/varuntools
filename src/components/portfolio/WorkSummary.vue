<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title?: string
    html?: string
    problem?: string
    solution?: string
    impact?: string
    summary?: string
    role?: string[]
    stack?: string[]
    period?: string
    client?: string
    scope?: string[]
    status?: string
  }>(),
  {
    title: '작업 개요',
    html: '',
    problem: '',
    solution: '',
    impact: '',
    summary: '',
    role: () => [],
    stack: () => [],
    period: '',
    client: '',
    scope: () => [],
    status: '',
  },
)

const summaryItems = [
  ['Problem', props.problem],
  ['Solution', props.solution],
  ['Impact', props.impact],
  ['Summary', props.summary],
].filter(([, value]) => typeof value === 'string' && value.trim()) as [string, string][]

const groups = [
  ['역할', props.role],
  ['기술 스택', props.stack],
  ['Scope', props.scope],
].filter(([, items]) => Array.isArray(items) && items.length) as [string, string[]][]
</script>

<template>
  <section class="vt-portfolio-panel vt-work-summary">
    <header class="vt-portfolio-panel__header">
      <p class="vt-portfolio-kicker">Summary</p>
      <h2>{{ title }}</h2>
      <p v-if="period || client || status" class="vt-portfolio-panel__meta">
        {{ [period, client, status].filter(Boolean).join(' · ') }}
      </p>
    </header>
    <div v-if="html" class="vt-markdown vt-portfolio-panel__body" v-html="html" />

    <dl v-if="summaryItems.length" class="vt-portfolio-meta-grid vt-work-summary__details">
      <template v-for="[label, value] in summaryItems" :key="label">
        <dt>{{ label }}</dt>
        <dd>{{ value }}</dd>
      </template>
    </dl>

    <dl v-if="groups.length" class="vt-portfolio-meta-grid">
      <template v-for="[label, items] in groups" :key="label">
        <dt>{{ label }}</dt>
        <dd>
          <span v-for="item in items" :key="item" class="vt-portfolio-chip">{{ item }}</span>
        </dd>
      </template>
    </dl>
  </section>
</template>
