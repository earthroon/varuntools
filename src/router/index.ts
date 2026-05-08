import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/HomePage.vue'),
    },
    {
      path: '/works',
      name: 'works',
      component: () => import('@/pages/WorksPage.vue'),
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
    {
      path: '/:slug+',
      name: 'markdown-page',
      component: () => import('@/pages/MarkdownPage.vue'),
    },
  ],
})
