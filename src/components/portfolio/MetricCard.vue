<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    value?: string | number
    unit?: string
    label?: string
    delta?: string
    tone?: string
    html?: string
  }>(),
  {
    title: 'Metric',
    value: '',
    unit: '',
    label: '',
    delta: '',
    tone: 'default',
    html: '',
  },
)
</script>

<template>
  <section class="vt-metric-card" :data-tone="tone">
    <p class="vt-portfolio-kicker">Metric</p>
    <strong class="vt-metric-card__title">{{ title }}</strong>
    <p v-if="value !== '' || unit" class="vt-metric-card__value" :aria-label="`${title}: ${value} ${unit}`.trim()">
      <span>{{ value }}</span>
      <small v-if="unit">{{ unit }}</small>
    </p>
    <p v-if="label" class="vt-metric-card__label">{{ label }}</p>
    <p v-if="delta" class="vt-metric-card__delta">{{ delta }}</p>
    <div v-if="html" class="vt-markdown vt-metric-card__body" v-html="html" />
  </section>
</template>
