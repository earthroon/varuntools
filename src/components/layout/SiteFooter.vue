<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SiteNavigationLink from './SiteNavigationLink.vue'
import { footerNavigation } from '@/navigation/sectionNavigation'

const route = useRoute()
const currentPath = computed(() => route.path)
const year = new Date().getFullYear()
</script>

<template>
  <footer class="vt-site-footer" data-navigation-surface="footer">
    <div class="vt-site-footer__intro">
      <p class="vt-site-footer__eyebrow">VARUNTOOLS</p>
      <p class="vt-site-footer__copy">
        감정, 구조, 기술을 실제 도구와 포트폴리오 흐름으로 엮는 작업장입니다.
      </p>
    </div>

    <nav class="vt-site-footer__nav" aria-label="Footer navigation">
      <SiteNavigationLink
        v-for="item in footerNavigation"
        :key="item.id"
        :item="item"
        :current-path="currentPath"
        variant="footer"
      />
    </nav>

    <p class="vt-site-footer__meta">© {{ year }} VARUNTOOLS. Built as a living portfolio system.</p>
  </footer>
</template>
