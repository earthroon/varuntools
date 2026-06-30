<script setup lang="ts">
import CommandPaletteShell from '@/components/CommandPaletteShell.vue'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import SiteFooter from '@/components/layout/SiteFooter.vue'
</script>

<template>
  <div class="vt-app-shell">
    <SiteHeader />

    <main class="vt-app-main">
      <RouterView v-slot="{ Component }">
        <Suspense :timeout="1200">
          <component :is="Component" />
          <template #fallback>
            <div
              class="vt-route-suspense-pane-hold"
              data-vt-ui14f-suspense-pane-hold
              aria-hidden="true"
            ></div>
          </template>
        </Suspense>
      </RouterView>
    </main>

    <SiteFooter />
  </div>

  <CommandPaletteShell />
</template>
