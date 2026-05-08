import { computed } from 'vue'
import { loadMarkdownPages } from '@/markdown/loadMarkdownPages'
import {
  createRouteManifest,
  logRouteManifestIssues,
} from '@/router/routeManifest'

const pages = loadMarkdownPages()
const manifest = computed(() => createRouteManifest(pages))

logRouteManifestIssues(manifest.value)

export function useRouteManifest() {
  return {
    pages,
    manifest,
  }
}
