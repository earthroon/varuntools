<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{
  canvas: HTMLCanvasElement | null
}>()

const hostRef = ref<HTMLDivElement | null>(null)

function detach(canvas: HTMLCanvasElement | null): void {
  if (!canvas) return
  try {
    const host = hostRef.value
    if (host && canvas.parentElement === host) host.removeChild(canvas)
  } catch {}
}

async function attach(canvas: HTMLCanvasElement | null): Promise<void> {
  await nextTick()
  const host = hostRef.value
  if (!host || !canvas) return
  if (canvas.parentElement === host) return
  if (canvas.parentElement) {
    try { canvas.parentElement.removeChild(canvas) } catch {}
  }
  canvas.classList.add('vt-lightbox__canvas-surface')
  canvas.setAttribute('aria-hidden', 'true')
  host.appendChild(canvas)
}

watch(
  () => props.canvas,
  async (canvas, previous) => {
    if (previous && previous !== canvas) detach(previous)
    await attach(canvas)
  },
  { immediate: true, flush: 'post' },
)

onBeforeUnmount(() => detach(props.canvas))
</script>

<template>
  <div ref="hostRef" class="vt-lightbox__canvas-host" />
</template>


