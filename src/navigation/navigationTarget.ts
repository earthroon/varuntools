export type NavigationTargetKind = 'internal' | 'external' | 'anchor' | 'invalid'
export type ResolvedNavigationTarget = { kind: NavigationTargetKind; href: string; routePath: string | null; openInNewTab: boolean }
const SAME_SITE_HOSTS = new Set(['varun.tools', 'www.varun.tools'])
export function resolveNavigationTarget(value: string): ResolvedNavigationTarget {
  const raw=String(value??'').trim()
  if(!raw)return {kind:'invalid',href:'#',routePath:null,openInNewTab:false}
  if(raw.startsWith('#'))return {kind:'anchor',href:raw,routePath:null,openInNewTab:false}
  if(raw.startsWith('/'))return {kind:'internal',href:raw,routePath:raw,openInNewTab:false}
  try{
    const u=new URL(raw)
    if((u.protocol==='http:'||u.protocol==='https:')&&SAME_SITE_HOSTS.has(u.hostname.toLowerCase())){
      const href=`${u.pathname}${u.search}${u.hash}`||'/'
      return {kind:'internal',href,routePath:href,openInNewTab:false}
    }
    if(u.protocol==='http:'||u.protocol==='https:')return {kind:'external',href:raw,routePath:null,openInNewTab:true}
  }catch{}
  return {kind:'invalid',href:raw||'#',routePath:null,openInNewTab:false}
}
