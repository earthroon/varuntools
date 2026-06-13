<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  getSearchEntryLabel,
  isSearchIndexDocument,
  searchCommandPaletteEntries,
} from '@/search/commandPalette'
import type { SearchIndexEntry } from '@/search/searchIndex'

const router = useRouter()
const isOpen = ref(false)
const query = ref('')
const activeIndex = ref(0)
const entries = ref<SearchIndexEntry[]>([])
const loading = ref(false)
const error = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
let hasLoaded = false

const paletteTitleId = 'vt-command-palette-title'
const resultsId = 'vt-command-palette-results'

const isMac = computed(() => {
  if (typeof navigator === 'undefined') return false
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform)
})

const shortcutLabel = computed(() => `${isMac.value ? '⌘' : 'Ctrl'} K`)
const results = computed(() => searchCommandPaletteEntries(entries.value, query.value, 8))
const activeResult = computed(() => results.value[activeIndex.value] || null)
const activeDescendant = computed(() => activeResult.value ? `vt-command-result-${activeIndex.value}` : undefined)

async function loadSearchIndex() {
  if (hasLoaded || loading.value) return
  loading.value = true
  error.value = ''

  try {
    const response = await fetch(`${import.meta.env.BASE_URL}search-index.json`, {
      headers: { accept: 'application/json' },
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const payload = await response.json()
    if (!isSearchIndexDocument(payload)) throw new Error('Invalid search-index.json')

    entries.value = payload.entries
    hasLoaded = true
  } catch (caught) {
    error.value = '검색 인덱스를 불러오지 못했습니다.'
    console.error('[CommandPalette] failed to load search-index.json', caught)
  } finally {
    loading.value = false
  }
}

async function openPalette() {
  isOpen.value = true
  await loadSearchIndex()
  await nextTick()
  inputRef.value?.focus()
  inputRef.value?.select()
}

function closePalette() {
  isOpen.value = false
  query.value = ''
  activeIndex.value = 0
}

function togglePalette() {
  if (isOpen.value) closePalette()
  else void openPalette()
}

function onGlobalKeydown(event: KeyboardEvent) {
  const isCommandK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k'
  if (!isCommandK) return

  event.preventDefault()
  togglePalette()
}

function onPaletteKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    closePalette()
    return
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, Math.max(results.value.length - 1, 0))
    return
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
    return
  }

  if (event.key === 'Enter' && activeResult.value) {
    event.preventDefault()
    navigateTo(activeResult.value)
  }
}

function navigateTo(entry: SearchIndexEntry) {
  closePalette()
  void router.push(entry.href)
}

watch(results, () => {
  activeIndex.value = 0
})

watch(() => router.currentRoute.value.fullPath, () => {
  if (isOpen.value) closePalette()
})

onMounted(() => {
  window.addEventListener('keydown', onGlobalKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
})
</script>

<template>
  <button
    class="vt-command-trigger"
    type="button"
    aria-label="사이트 검색 열기"
    @click="openPalette"
  >
    <span class="vt-command-trigger__text">검색</span>
    <kbd class="vt-command-trigger__key">{{ shortcutLabel }}</kbd>
  </button>

  <Teleport to="body">
    <div
      v-if="isOpen"
      class="vt-command-palette"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="paletteTitleId"
      @keydown="onPaletteKeydown"
    >
      <button
        class="vt-command-palette__backdrop"
        type="button"
        aria-label="검색 닫기"
        @click="closePalette"
      />

      <section class="vt-command-palette__panel" aria-label="사이트 검색">
        <header class="vt-command-palette__header">
          <div>
            <p class="vt-command-palette__eyebrow">Command Palette</p>
            <h2 :id="paletteTitleId" class="vt-command-palette__title">VARUNTOOLS 빠른 이동</h2>
          </div>
          <button
            class="vt-command-palette__close"
            type="button"
            aria-label="검색 닫기"
            @click="closePalette"
          >
            Esc
          </button>
        </header>

        <div class="vt-command-palette__search-row">
          <span class="vt-command-palette__icon" aria-hidden="true">⌕</span>
          <input
            ref="inputRef"
            v-model="query"
            class="vt-command-palette__input"
            type="search"
            autocomplete="off"
            spellcheck="false"
            placeholder="상품, 작업, 도구, 태그 검색"
            role="combobox"
            aria-expanded="true"
            :aria-controls="resultsId"
            :aria-activedescendant="activeDescendant"
          />
          <kbd class="vt-command-palette__shortcut">{{ shortcutLabel }}</kbd>
        </div>

        <p v-if="loading" class="vt-command-palette__status" aria-live="polite">
          검색 인덱스를 불러오는 중입니다.
        </p>
        <p v-else-if="error" class="vt-command-palette__status vt-command-palette__status--error" aria-live="assertive">
          {{ error }}
        </p>
        <p v-else-if="!results.length" class="vt-command-palette__status" aria-live="polite">
          검색 결과가 없습니다. 단어를 줄이거나 다른 태그를 입력해보세요.
        </p>

        <ul
          v-else
          :id="resultsId"
          class="vt-command-palette__results"
          role="listbox"
          aria-label="검색 결과"
        >
          <li
            v-for="(entry, index) in results"
            :id="`vt-command-result-${index}`"
            :key="entry.slug"
            class="vt-command-palette__result"
            :class="{ 'vt-command-palette__result--active': index === activeIndex }"
            role="option"
            :aria-selected="index === activeIndex"
          >
            <button
              class="vt-command-palette__result-button"
              type="button"
              @mouseenter="activeIndex = index"
              @click="navigateTo(entry)"
            >
              <span class="vt-command-palette__result-main">
                <strong>{{ entry.title }}</strong>
                <span>{{ entry.description || entry.slug }}</span>
              </span>
              <span class="vt-command-palette__result-meta">
                {{ getSearchEntryLabel(entry) }}
              </span>
            </button>
          </li>
        </ul>
      </section>
    </div>
  </Teleport>
</template>
