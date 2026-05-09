<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { findDemoManifestEntry, resolveDemoSource, type DemoStatus } from '@/data/demoManifest'

type DemoMessage =
  | {
      source: 'VARUNTOOLS_DEMO'
      type: 'VARUN_DEMO_READY'
      id?: string
    }
  | {
      source: 'VARUNTOOLS_DEMO'
      type: 'VARUN_DEMO_RESIZE'
      id?: string
      height?: number
    }
  | {
      source: 'VARUNTOOLS_DEMO'
      type: 'VARUN_DEMO_ERROR'
      id?: string
      message?: string
    }

const DEFAULT_SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-popups'

const props = withDefaults(
  defineProps<{
    id?: string
    title?: string
    src?: string
    ratio?: string
    status?: DemoStatus | string
    description?: string
    stack?: string[]
    allowFullscreen?: boolean
    sandbox?: string
    autoResize?: boolean
    minHeight?: number
    maxHeight?: number
    html?: string
  }>(),
  {
    id: '',
    title: '',
    src: '',
    ratio: '',
    status: '',
    description: '',
    stack: () => [],
    sandbox: '',
    html: '',
  },
)

const loaded = ref(false)
const ready = ref(false)
const failed = ref(false)
const errorMessage = ref('')

const manifestEntry = computed(() => findDemoManifestEntry(props.id))

const demoId = computed(() => props.id || manifestEntry.value?.id || '')
const demoTitle = computed(() => props.title || manifestEntry.value?.title || props.id || 'Interactive demo')
const demoSrc = computed(() => resolveDemoSource(props.src || manifestEntry.value?.src || ''))
const demoRatio = computed(() => props.ratio || manifestEntry.value?.ratio || '16 / 10')
const demoStatus = computed(() => props.status || manifestEntry.value?.status || 'stable')
const demoDescription = computed(() => props.description || manifestEntry.value?.description || '')
const demoStack = computed(() => (props.stack?.length ? props.stack : manifestEntry.value?.stack || []))
const canFullscreen = computed(() => props.allowFullscreen ?? manifestEntry.value?.allowFullscreen ?? true)
const iframeSandbox = computed(() => props.sandbox || manifestEntry.value?.sandbox || DEFAULT_SANDBOX)
const openHref = computed(() => manifestEntry.value?.externalUrl || demoSrc.value)
const shouldAutoResize = computed(() => props.autoResize ?? manifestEntry.value?.autoResize ?? true)
const minFrameHeight = computed(() => clampHeight(props.minHeight ?? manifestEntry.value?.minHeight ?? 360, 240, 2000))
const maxFrameHeight = computed(() => Math.max(clampHeight(props.maxHeight ?? manifestEntry.value?.maxHeight ?? 1200, 320, 4000), minFrameHeight.value))
const frameHeight = ref(360)

const isReady = computed(() => loaded.value || ready.value)

const frameStyle = computed(() => {
  if (shouldAutoResize.value) {
    return {
      minHeight: `${minFrameHeight.value}px`,
      height: `${frameHeight.value || minFrameHeight.value}px`,
    }
  }

  return {
    aspectRatio: demoRatio.value,
    minHeight: `${minFrameHeight.value}px`,
  }
})

function clampHeight(value: number, min: number, max: number): number {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return min
  return Math.min(Math.max(Math.round(numeric), min), max)
}

function normalizeMessage(value: unknown): DemoMessage | null {
  if (!value || typeof value !== 'object') return null

  const data = value as Partial<DemoMessage>
  if (data.source !== 'VARUNTOOLS_DEMO') return null
  if (
    data.type !== 'VARUN_DEMO_READY' &&
    data.type !== 'VARUN_DEMO_RESIZE' &&
    data.type !== 'VARUN_DEMO_ERROR'
  ) return null

  return data as DemoMessage
}

function acceptsMessage(message: DemoMessage): boolean {
  const expectedId = demoId.value
  if (!expectedId || !message.id) return true
  return message.id === expectedId
}

function resizeFrame(height: number | undefined) {
  if (!shouldAutoResize.value) return

  const nextHeight = Number(height)
  if (!Number.isFinite(nextHeight)) return

  frameHeight.value = Math.min(Math.max(Math.round(nextHeight), minFrameHeight.value), maxFrameHeight.value)
}

function onMessage(event: MessageEvent) {
  const message = normalizeMessage(event.data)
  if (!message || !acceptsMessage(message)) return

  if (message.type === 'VARUN_DEMO_READY') {
    ready.value = true
    loaded.value = true
    failed.value = false
    errorMessage.value = ''
    return
  }

  if (message.type === 'VARUN_DEMO_RESIZE') {
    ready.value = true
    loaded.value = true
    resizeFrame(message.height)
    return
  }

  if (message.type === 'VARUN_DEMO_ERROR') {
    ready.value = true
    loaded.value = true
    failed.value = true
    errorMessage.value = message.message || 'Demo failed to initialize.'
  }
}

function onLoad() {
  loaded.value = true
  failed.value = false
  errorMessage.value = ''
}

function onError() {
  loaded.value = true
  failed.value = true
  errorMessage.value = 'Demo could not be loaded.'
}

onMounted(() => {
  frameHeight.value = minFrameHeight.value
  window.addEventListener('message', onMessage)
})

onBeforeUnmount(() => {
  window.removeEventListener('message', onMessage)
})
</script>

<template>
  <section
    class="vt-demo-frame"
    :class="[`is-${demoStatus}`, { 'is-ready': isReady, 'has-error': failed, 'is-auto-resize': shouldAutoResize }]"
    :aria-label="demoTitle"
  >
    <header class="vt-demo-frame__header">
      <div class="vt-demo-frame__heading">
        <p class="vt-demo-frame__eyebrow">Interactive Demo</p>
        <h3>{{ demoTitle }}</h3>
      </div>

      <div class="vt-demo-frame__actions">
        <span class="vt-demo-frame__status">{{ demoStatus }}</span>
        <a v-if="openHref" class="vt-demo-frame__open" :href="openHref" target="_blank" rel="noreferrer">
          Open
        </a>
      </div>
    </header>

    <div class="vt-demo-frame__canvas" :style="frameStyle">
      <div v-if="!isReady && !failed" class="vt-demo-frame__placeholder" aria-hidden="true">
        Loading demo canvas...
      </div>
      <div v-if="failed || !demoSrc" class="vt-demo-frame__fallback" role="status">
        {{ errorMessage || 'Demo could not be loaded.' }}
      </div>
      <iframe
        v-if="demoSrc"
        :src="demoSrc"
        :title="demoTitle"
        :sandbox="iframeSandbox"
        loading="lazy"
        referrerpolicy="no-referrer"
        :allowfullscreen="canFullscreen"
        @load="onLoad"
        @error="onError"
      />
    </div>

    <div v-if="demoDescription || html || demoStack.length" class="vt-demo-frame__meta">
      <p v-if="demoDescription" class="vt-demo-frame__description">{{ demoDescription }}</p>
      <div v-if="html" class="vt-demo-frame__body" v-html="html" />
      <ul v-if="demoStack.length" class="vt-demo-frame__stack" aria-label="Demo stack">
        <li v-for="item in demoStack" :key="item">{{ item }}</li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.vt-demo-frame {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  border-radius: 24px;
  background: color-mix(in srgb, canvas 94%, currentColor 6%);
  box-shadow: 0 18px 48px color-mix(in srgb, black 10%, transparent);
}

.vt-demo-frame__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
}

.vt-demo-frame__heading {
  min-width: 0;
}

.vt-demo-frame__eyebrow {
  margin: 0 0 0.25rem;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.62;
}

.vt-demo-frame__header h3 {
  margin: 0;
  font-size: clamp(1rem, 2vw, 1.25rem);
  line-height: 1.2;
}

.vt-demo-frame__actions {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 0.5rem;
}

.vt-demo-frame__status,
.vt-demo-frame__open {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2rem;
  border-radius: 999px;
  padding: 0.35rem 0.7rem;
  border: 1px solid color-mix(in srgb, currentColor 22%, transparent);
  font-size: 0.78rem;
  text-decoration: none;
}

.vt-demo-frame__status {
  opacity: 0.7;
  text-transform: capitalize;
}

.vt-demo-frame__open {
  color: inherit;
}

.vt-demo-frame__canvas {
  position: relative;
  width: 100%;
  min-height: 360px;
  background: #111;
  transition: height 180ms ease;
}

.vt-demo-frame iframe,
.vt-demo-frame__placeholder,
.vt-demo-frame__fallback {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.vt-demo-frame iframe {
  z-index: 2;
  display: block;
  border: 0;
  background: #111;
}

.vt-demo-frame__placeholder,
.vt-demo-frame__fallback {
  display: grid;
  place-items: center;
  padding: 1rem;
  color: #f7efe2;
  background: radial-gradient(circle at 50% 35%, #2a2420 0%, #111 68%);
  font-size: 0.9rem;
  text-align: center;
}

.vt-demo-frame__fallback {
  z-index: 3;
}

.vt-demo-frame.is-ready .vt-demo-frame__placeholder {
  opacity: 0;
  pointer-events: none;
}

.vt-demo-frame__meta {
  display: grid;
  gap: 0.75rem;
  padding: 1rem;
}

.vt-demo-frame__description,
.vt-demo-frame__body :deep(p) {
  margin: 0;
  line-height: 1.75;
  opacity: 0.78;
}

.vt-demo-frame__stack {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.vt-demo-frame__stack li {
  border-radius: 999px;
  padding: 0.22rem 0.55rem;
  background: color-mix(in srgb, currentColor 10%, transparent);
  font-size: 0.75rem;
}

.vt-demo-frame.is-experimental .vt-demo-frame__status {
  border-color: color-mix(in srgb, orange 45%, currentColor 16%);
}

.vt-demo-frame.is-archived {
  opacity: 0.72;
}

@media (max-width: 720px) {
  .vt-demo-frame__header {
    align-items: stretch;
    flex-direction: column;
  }

  .vt-demo-frame__actions {
    justify-content: space-between;
  }

  .vt-demo-frame__canvas {
    min-height: 320px;
  }
}
</style>
