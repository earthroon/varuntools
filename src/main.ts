import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'

import './styles/tokens.css'
import './styles/base.css'
import './styles/accessibility.css'
import './styles/markdown.css'
import './styles/markdown-directives.css'
import './styles/markdown-components.css'
import './styles/markdown-toc.css'
import './styles/markdown-layout.css'
import './styles/markdown-cards.css'
import './styles/markdown-works.css'
import './styles/markdown-portfolio.css'
import './styles/markdown-related.css'
import './styles/markdown-document.css'
import './styles/markdown-lightbox.css'
import './styles/responsive.css'
import './styles/command-palette.css'
import './styles/page-search.css'
import './styles/site-navigation.css'
import './styles/works-tags.css'
import './styles/ewa-debug.css'
import './styles/notion-legacy.css'
import './styles/themes/varuntools-showroom.css'
import './styles/typography.css'
import './styles/generated-content.css'

const root = document.querySelector('#app')

const hasStaticArticlePrerender =
  document
    .querySelector('meta[name="vacms-static-article-prerender"]')
    ?.getAttribute('content') === 'true' &&
  root?.getAttribute('data-vacms-static-prerender') === 'true' &&
  Boolean(root.querySelector('[data-vacms-static-article="true"]'))

if (!hasStaticArticlePrerender) {
  createApp(App).use(router).mount('#app')
}
