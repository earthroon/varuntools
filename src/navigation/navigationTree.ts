import type { NavigationItem, NavigationNode } from './navigationTypes'
export type NavigationTreeIssue={code:'E_NAV_SELF_PARENT'|'E_NAV_PARENT_NOT_FOUND'|'E_NAV_PARENT_EXTERNAL'|'E_NAV_CYCLE'|'E_NAV_DEPTH_EXCEEDED';href:string;parentHref?:string}
export function buildNavigationTree(items:readonly NavigationItem[],maxDepth=3){
  const issues:NavigationTreeIssue[]=[];const by=new Map(items.map(i=>[i.href,i]));const kids=new Map<string,NavigationItem[]>();const roots:NavigationItem[]=[]
  for(const i of items){if(!i.parentHref){roots.push(i);continue}if(i.parentHref===i.href){issues.push({code:'E_NAV_SELF_PARENT',href:i.href,parentHref:i.parentHref});continue}if(/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(i.parentHref)){issues.push({code:'E_NAV_PARENT_EXTERNAL',href:i.href,parentHref:i.parentHref});continue}if(!by.has(i.parentHref)){issues.push({code:'E_NAV_PARENT_NOT_FOUND',href:i.href,parentHref:i.parentHref});continue}const a=kids.get(i.parentHref)||[];a.push(i);kids.set(i.parentHref,a)}
  const sort=(a:NavigationItem,b:NavigationItem)=>a.order-b.order||a.label.localeCompare(b.label)
  const mat=(i:NavigationItem,stack:string[],depth:number):NavigationNode|null=>{if(stack.includes(i.href)){issues.push({code:'E_NAV_CYCLE',href:i.href,parentHref:i.parentHref});return null}if(depth>maxDepth){issues.push({code:'E_NAV_DEPTH_EXCEEDED',href:i.href,parentHref:i.parentHref});return null}return {...i,children:(kids.get(i.href)||[]).sort(sort).map(c=>mat(c,[...stack,i.href],depth+1)).filter(Boolean) as NavigationNode[]}}
  return {roots:roots.sort(sort).map(r=>mat(r,[],1)).filter(Boolean) as NavigationNode[],issues}
}
