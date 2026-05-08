<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    type?: string
    title?: string
    kind?: string
    axis?: string
    weight?: string | number
    risk?: string
    ssot?: string
    tradeoff?: string
    impact?: string
    html?: string
  }>(),
  {
    type: 'process',
    title: '',
    kind: '',
    axis: '',
    weight: '',
    risk: '',
    ssot: '',
    tradeoff: '',
    impact: '',
    html: '',
  },
)

const defaultTitles: Record<string, string> = {
  problem: '문제',
  solution: '해결',
  process: '과정',
  decision: '판단',
  result: '결과',
}
</script>

<template>
  <section class="vt-case-section" :data-type="type">
    <header class="vt-case-section__header">
      <p class="vt-portfolio-kicker">{{ type }}</p>
      <h2>{{ title || defaultTitles[type] || 'Case Section' }}</h2>
      <p v-if="kind || axis || risk || weight" class="vt-case-section__meta">
        {{ [kind, axis, risk, weight ? `weight ${weight}` : ''].filter(Boolean).join(' · ') }}
      </p>
    </header>
    <div v-if="html" class="vt-markdown vt-case-section__body" v-html="html" />
    <dl v-if="ssot || tradeoff || impact" class="vt-case-section__facts">
      <template v-if="ssot"><dt>SSOT</dt><dd>{{ ssot }}</dd></template>
      <template v-if="tradeoff"><dt>Trade-off</dt><dd>{{ tradeoff }}</dd></template>
      <template v-if="impact"><dt>Impact</dt><dd>{{ impact }}</dd></template>
    </dl>
  </section>
</template>
