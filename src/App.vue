<script setup lang="ts">
import CommandPalette from '@/components/CommandPalette.vue'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue'
</script>

<template>
  <div class="vt-app-shell">
    <SiteHeader />

    <main class="vt-app-main">
      <RouterView />
    </main>

    <SiteFooter />
  </div>

  <CommandPalette />
</template>
