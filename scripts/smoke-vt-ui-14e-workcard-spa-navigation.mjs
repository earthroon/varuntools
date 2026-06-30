import fs from 'node:fs'

const workCard = fs.readFileSync('src/components/markdown/WorkCard.vue', 'utf8')
const helperExists = fs.existsSync('src/composables/useInternalSpaNavigation.ts')
const helper = helperExists ? fs.readFileSync('src/composables/useInternalSpaNavigation.ts', 'utf8') : ''
const app = fs.readFileSync('src/App.vue', 'utf8')

function fail(message) {
  console.error('FAIL_VT_UI_14E_WORKCARD_INTERNAL_SPA_NAVIGATION')
  console.error(message)
  process.exit(1)
}

function mustInclude(text, token, message) {
  if (!text.includes(token)) fail(message)
}

const usesComposable = workCard.includes('useInternalSpaNavigation')
const usesLocalRouter = workCard.includes('useRouter') && workCard.includes('router.push')

if (!usesComposable && !usesLocalRouter) {
  fail('WorkCard.vue missing SPA navigation router bridge')
}

if (usesComposable) {
  mustInclude(helper, 'useRouter', 'useInternalSpaNavigation missing useRouter')
  mustInclude(helper, 'event.preventDefault()', 'useInternalSpaNavigation missing preventDefault')
  mustInclude(helper, 'router.push', 'useInternalSpaNavigation missing router.push')
} else {
  mustInclude(workCard, 'event.preventDefault()', 'WorkCard.vue missing preventDefault')
  mustInclude(workCard, 'router.push', 'WorkCard.vue missing router.push')
}

mustInclude(workCard, '@click=', 'WorkCard.vue missing click handler')

if (
  !workCard.includes('navigateCardTarget') &&
  !workCard.includes('navigateInternalHref')
) {
  fail('WorkCard.vue click handler is not SPA navigation aligned')
}

if (app.includes(':key="route.fullPath"') || app.includes(':key="currentRouteKey"')) {
  fail('App.vue reintroduced route keyed RouterView')
}

console.log('PASS_VT_UI_14E_WORKCARD_INTERNAL_SPA_NAVIGATION')
