import { createRouter, createWebHistory } from 'vue-router'
import { generatedRoutes } from '@/lib/generated-content/generatedRoutes'
import MarkdownPage from '@/pages/MarkdownPage.vue'
import WorksPage from '@/pages/WorksPage.vue'
import HomePage from '@/pages/HomePage.vue'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
    {
      path: '/works',
      name: 'works',
      component: WorksPage,
    },
    {
      path: '/index',
      name: 'content-index',
      component: () => import('@/pages/PublicContentIndexPage.vue'),
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('@/pages/SearchPage.vue'),
    },
    {
      path: '/works/tags/:tag',
      name: 'works-tag',
      component: () => import('@/pages/WorksTagPage.vue'),
    },
    {
      path: '/404',
      name: 'not-found',
      component: () => import('@/pages/NotFoundPage.vue'),
    },
    ...generatedRoutes,
    {
      path: '/:slug+',
      name: 'markdown-page',
      component: MarkdownPage,
    },
  ],
})
