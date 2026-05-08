<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { NavigationItem } from '@/navigation/navigationTypes'
import { isNavigationItemActive } from '@/navigation/navigationActive'

const props = defineProps<{
  item: NavigationItem
  currentPath: string
  variant?: 'header' | 'footer' | 'utility'
}>()

const isActive = computed(() => isNavigationItemActive(props.currentPath, props.item.href))
const rel = computed(() => (props.item.external ? 'noreferrer' : undefined))
const target = computed(() => (props.item.external ? '_blank' : undefined))
</script>

<template>
  <a
    v-if="item.external"
    class="vt-site-nav-link"
    :class="[`vt-site-nav-link--${variant || 'header'}`, { 'is-active': isActive }]"
    :href="item.href"
    :target="target"
    :rel="rel"
    :aria-current="isActive ? 'page' : undefined"
  >
    <span class="vt-site-nav-link__label">{{ item.label }}</span>
    <span v-if="item.description && variant === 'footer'" class="vt-site-nav-link__description">
      {{ item.description }}
    </span>
  </a>

  <RouterLink
    v-else
    class="vt-site-nav-link"
    :class="[`vt-site-nav-link--${variant || 'header'}`, { 'is-active': isActive }]"
    :to="item.href"
    :aria-current="isActive ? 'page' : undefined"
  >
    <span class="vt-site-nav-link__label">{{ item.label }}</span>
    <span v-if="item.description && variant === 'footer'" class="vt-site-nav-link__description">
      {{ item.description }}
    </span>
  </RouterLink>
</template>
