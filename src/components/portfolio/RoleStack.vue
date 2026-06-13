<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    html?: string
    role?: string[]
    responsibility?: string[]
    stack?: string[]
    tools?: string[]
  }>(),
  {
    title: '역할과 스택',
    html: '',
    role: () => [],
    responsibility: () => [],
    stack: () => [],
    tools: () => [],
  },
)
</script>

<template>
  <section class="vt-portfolio-panel vt-role-stack">
    <header class="vt-portfolio-panel__header">
      <p class="vt-portfolio-kicker">역할과 스택</p>
      <h2>{{ title }}</h2>
    </header>
    <div v-if="html" class="vt-markdown vt-portfolio-panel__body" v-html="html" />
    <div class="vt-role-stack__grid">
      <div v-if="role.length" class="vt-role-stack__cell">
        <strong>역할</strong>
        <span v-for="item in role" :key="item" class="vt-portfolio-chip vt-portfolio-chip--role">{{ item }}</span>
      </div>
      <div v-if="responsibility.length" class="vt-role-stack__cell">
        <strong>Responsibility</strong>
        <span v-for="item in responsibility" :key="item" class="vt-portfolio-chip">{{ item }}</span>
      </div>
      <div v-if="stack.length || tools.length" class="vt-role-stack__cell">
        <strong>스택 / 도구</strong>
        <span v-for="item in [...stack, ...tools]" :key="item" class="vt-portfolio-chip">{{ item }}</span>
      </div>
    </div>
  </section>
</template>
