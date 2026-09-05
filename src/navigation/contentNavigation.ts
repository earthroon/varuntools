import { loadMarkdownPages } from '@/markdown/loadMarkdownPages'
import type { NavigationItem, NavigationSectionId, NavigationSurface } from './navigationTypes'
import { isPageEligibleForPublicNavigation } from './navigationVisibility'
import { resolveNavigationTarget } from './navigationTarget'
const s=(v:unknown)=>typeof v==='string'?v.trim():''
const b=(v:unknown)=>v===true||(typeof v==='string'&&v.toLowerCase()==='true')
const n=(v:unknown)=>{const x=Number(v);return Number.isFinite(x)?x:9999}
function surfaces(v:unknown):NavigationSurface[]{const x=s(v) as NavigationSurface;return ['header','footer','section','utility'].includes(x)?[x]:['header','section']}
function infer(href:string,parent:string,base:readonly NavigationItem[]):NavigationSectionId{
  const p=base.find(i=>i.href===parent);if(p)return p.section
  const first=href.split('/').filter(Boolean)[0]||''
  if(['works','products','tools','lab','inquiry'].includes(first))return first as NavigationSectionId
  if(first==='post'||first==='page')return 'works'
  return 'utility'
}
export function buildContentNavigationEntries(base:readonly NavigationItem[]):NavigationItem[]{
  return loadMarkdownPages().flatMap(page=>{
    const fm=page.frontmatter as Record<string,unknown>
    if(!b(fm.showInNav))return []
    const href=`/${page.slug}`
    if(!isPageEligibleForPublicNavigation({routePath:href,visibility:s(fm.visibility),status:s(fm.status),noindex:fm.noindex===true,source:s(fm.source)}))return []
    const parentRaw=s(fm.navParent)
    const parent=parentRaw?resolveNavigationTarget(parentRaw):null
    const parentHref=parent?.kind==='internal'?(parent.routePath||'').split(/[?#]/u)[0]:''
    return [{id:`content:${page.slug}`,label:s(fm.navLabel)||s(fm.title)||page.slug,href,parentHref:parentHref||undefined,section:infer(href,parentHref,base),surface:surfaces(fm.navSurface),order:n(fm.navOrder),description:s(fm.summary)||s(fm.description)||undefined,external:false}]
  })
}
