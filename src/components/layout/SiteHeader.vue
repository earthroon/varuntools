<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SiteNavigationLink from './SiteNavigationLink.vue'
import { headerNavigationTree, utilityNavigation } from '@/navigation/sectionNavigation'

const route = useRoute()
const currentPath = computed(() => route.path)
const hasUtilityNavigation = computed(() => utilityNavigation.length > 0)
</script>

<template>
  <header class="vt-site-header" data-navigation-surface="header">
    <RouterLink class="vt-site-header__brand" to="/" aria-label="VARUNTOOLS home">
      <span class="vt-site-header__brand-mark" aria-hidden="true" data-cms205g-r1-r3-brand-logo-bound>
        <img class="vt-site-header__brand-logo" src="/assets/brand/by-varun-logo.svg" alt="" width="32" height="32" decoding="async" />
      </span>
      <span class="vt-site-header__brand-text">VARUNTOOLS</span>
    </RouterLink>

    <nav class="vt-site-header__nav" aria-label="Primary navigation">
      <div v-for="node in headerNavigationTree" :key="node.id" class="vt-site-header__nav-node">
        <SiteNavigationLink :item="node" :current-path="currentPath" variant="header" />
        <div v-if="node.children.length" class="vt-site-header__submenu">
          <SiteNavigationLink v-for="child in node.children" :key="child.id" :item="child" :current-path="currentPath" variant="header" />
        </div>
      </div>
    </nav>

    <nav
      v-if="hasUtilityNavigation"
      class="vt-site-header__utility"
      aria-label="Utility navigation"
      data-vt-nav-02-utility-nav-guard="non-empty-only"
    >
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

<style scoped>
.vt-site-header__nav-node{position:relative;display:inline-flex}.vt-site-header__submenu{display:none;position:absolute;z-index:40;top:100%;left:0;min-width:220px;padding:.5rem;border:1px solid rgba(15,17,21,.1);border-radius:14px;background:#fff;box-shadow:0 16px 44px rgba(15,17,21,.14)}.vt-site-header__nav-node:hover>.vt-site-header__submenu,.vt-site-header__nav-node:focus-within>.vt-site-header__submenu{display:grid;gap:.2rem}@media(max-width:720px){.vt-site-header__nav-node{display:grid}.vt-site-header__submenu{position:static;display:grid;box-shadow:none;border:0;padding:.25rem 0 .25rem .75rem}}
</style>
