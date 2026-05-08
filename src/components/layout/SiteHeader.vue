<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SiteNavigationLink from './SiteNavigationLink.vue'
import { headerNavigation, utilityNavigation } from '@/navigation/sectionNavigation'

const route = useRoute()
const currentPath = computed(() => route.path)
</script>

<template>
  <header class="vt-site-header" data-navigation-surface="header">
    <RouterLink class="vt-site-header__brand" to="/" aria-label="VARUNTOOLS home">
      <span class="vt-site-header__brand-mark" aria-hidden="true">VT</span>
      <span class="vt-site-header__brand-text">VARUNTOOLS</span>
    </RouterLink>

    <nav class="vt-site-header__nav" aria-label="Primary navigation">
      <SiteNavigationLink
        v-for="item in headerNavigation"
        :key="item.id"
        :item="item"
        :current-path="currentPath"
        variant="header"
      />
    </nav>

    <nav class="vt-site-header__utility" aria-label="Utility navigation">
      <SiteNavigationLink
        v-for="item in utilityNavigation"
        :key="item.id"
        :item="item"
        :current-path="currentPath"
        variant="utility"
      />
    </nav>
  </header>
</template>
