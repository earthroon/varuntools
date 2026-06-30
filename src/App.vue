<script setup lang="ts">
import CommandPaletteShell from '@/components/CommandPaletteShell.vue'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue'
</script>

<template>
  <div class="vt-app-shell">
    <SiteHeader />

    <main class="vt-app-main">
      <RouterView v-slot="{ Component, route }">
        <component
          :is="Component"
          :key="route.fullPath"
          data-vt-ui14-route-view
        />
      </RouterView>
    </main>

    <SiteFooter />
  </div>

  <CommandPaletteShell />
</template>
