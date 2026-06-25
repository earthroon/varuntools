import{E as e,M as t,O as n,_ as r,at as i,d as a,f as o,l as s,o as c,p as l,u,w as d,z as f}from"./seo-at9L4b7Q.js";import{n as p,t as m}from"./index-DaY_g80S.js";var h=Object.defineProperty,g=(e,t)=>{let n={};for(var r in e)h(n,r,{get:e[r],enumerable:!0});return t||h(n,Symbol.toStringTag,{value:`Module`}),n},_={publicCategories:[`page`,`post`,`work`,`case-study`,`lab`,`tool`,`product`,`doc`,`catalog`,`commission`,`checkout`,`claim`,`inquiry`,`policies`,`qa`],publicKinds:[`page`,`post`,`work`,`case-study`,`lab`,`tool`,`product`,`doc`,`catalog`,`commission`,`checkout`,`claim`,`inquiry`,`policies`,`qa`],publicIndexCategories:[`page`,`post`,`work`,`case-study`,`lab`,`tool`,`product`,`doc`,`catalog`,`commission`],primaryPublicIndexCategories:[`page`,`post`,`work`,`lab`,`tool`,`product`],utilityRouteCategories:[`checkout`,`claim`,`inquiry`,`policies`,`qa`],workRouteCategories:[`work`,`case-study`],collectionIndexSlugs:[`home`,`index`,`products`,`products/categories`,`post`,`lab`,`tools`],collections:{page:`page`,post:`post`,work:`works`,"case-study":`works`,lab:`lab`,tool:`tools`,product:`products`,doc:`docs`,catalog:`products`,commission:`works`},labels:{page:`page`,post:`post`,work:`works`,"case-study":`case-study`,lab:`lab`,tool:`tool`,product:`product`,doc:`doc`,catalog:`catalog`,commission:`commission`,checkout:`checkout`,claim:`claim`,inquiry:`inquiry`,policies:`policies`,qa:`qa`}},v=_.publicCategories,y=_.publicKinds,b=_.publicIndexCategories,ee=_.utilityRouteCategories,te=_.workRouteCategories;_.labels,new Set(v),new Set(y),new Set(b);var ne=new Set(ee);new Set(te);function x(e){let t=String(e??``).trim().replace(/^\/+|\/+$/g,``).replace(/\/+/g,`/`);return t?t===`works`?`work`:t===`products`?`product`:t===`tools`?`tool`:t===`case-studies`?`case-study`:t:`page`}function re(e){return ne.has(x(e))}function ie(e){let t=x(e);return _.collections[t]||`page`}function ae(e){let t=x(e),n=re(t);return{route:!0,home:!1,collection:ie(t),search:!n,sitemap:!n,nav:!1,featured:!1,routeOnly:n}}var oe=Object.fromEntries(v.map(e=>[e,ae(e)]));function se(e){return e&&typeof e==`object`&&!Array.isArray(e)?e:{}}function S(e){return typeof e==`string`?e.trim():``}function C(e,t=!1){if(typeof e==`boolean`)return e;if(typeof e==`string`){let t=e.trim().toLowerCase();if(t===`true`)return!0;if(t===`false`)return!1}return t}function ce(e){return e.trim().replace(/^\/+|\/+$/g,``).replace(/\/+/g,`/`)}function le(e){return ce(e.slug||e.contentDir||``).split(`/`).filter(Boolean)[0]||`page`}function ue(e){let t=le(e);return t===`works`?`work`:t===`products`?`product`:t===`tools`||t===`wiper`?`tool`:t===`lab`||t===`lab-markdown-gallery`?`lab`:t===`post`?`post`:t===`case-study`||t===`case-studies`?`case-study`:t===`checkout`?`checkout`:t===`claim`?`claim`:t===`inquiry`?`inquiry`:t===`policies`?`policies`:t===`qa`?`qa`:t===`home`?`page`:t}function de(e){let t=x(e||``);return!t||t===`checkout`||t===`claim`||t===`inquiry`||t===`policies`||t===`qa`?`page`:t}function fe(e){let t=e.frontmatter;return x(S(t.category)||S(t.section)||ue(e))}function pe(e){let t=e.frontmatter;return de(S(t.kind)||S(t.type)||fe(e)||ue(e))}function me(e){let t=e.frontmatter,n=S(t.visibility).toLowerCase();return n===`hidden`||n===`private`||n===`draft`?n:t.draft===!0||S(t.status)===`draft`?`draft`:`public`}function he(e,t,n){let r=oe[e]||oe[t]||oe.page,i=S(n.collection);return{route:C(n.route,r.route),home:C(n.home,r.home),collection:i||r.collection||ie(e),search:C(n.search,r.search),sitemap:C(n.sitemap,r.sitemap),nav:C(n.nav,r.nav),featured:C(n.featured,r.featured),routeOnly:C(n.routeOnly,r.routeOnly)}}function ge(e){let t=[];return e.route&&t.push(`route`),e.collection&&e.collection!==`none`&&t.push(`collection:`+e.collection),e.home&&t.push(`home`),e.search&&t.push(`search`),e.sitemap&&t.push(`sitemap`),e.nav&&t.push(`nav`),e.featured&&t.push(`featured`),e.routeOnly&&t.push(`routeOnly`),t}function _e(e){let t=e.frontmatter,n=fe(e),r=pe(e),i=me(e),a=S(t.status)||`active`,o=he(n,r,se(t.exposure)),s=[];return i!==`public`&&(o.route=!1,o.home=!1,o.search=!1,o.sitemap=!1,o.nav=!1,o.featured=!1,s.push(`visibility:`+i)),(a===`archived`||a===`trashed`)&&(o.route=!1,o.home=!1,o.search=!1,o.sitemap=!1,o.nav=!1,o.featured=!1,s.push(`status:`+a)),{category:n,kind:r,visibility:i,status:a,...o,resolvedSurfaces:ge(o),blockedReasons:s}}function ve(e){let t=_e(e);return t.collection&&t.collection!==`none`?t.collection:t.kind}var ye=new Set([`works`]),be=new Set([`work`,`tool`,`lab`,`doc`,`post`,`case-study`,`page`]),xe=new Set([`work`,`case-study`]),Se=new Set([`works`,`work`,`case-study`]);function Ce(e){return e&&typeof e==`object`&&!Array.isArray(e)?e:{}}function w(e){return typeof e==`string`?e.trim():``}function we(e,t=!1){if(typeof e==`boolean`)return e;if(typeof e==`string`){let t=e.trim().toLowerCase();if(t===`true`)return!0;if(t===`false`)return!1}return t}function Te(e){if(typeof e==`number`&&Number.isFinite(e))return e;if(typeof e==`string`&&e.trim()){let t=Number(e);if(Number.isFinite(t))return t}}function Ee(e){if(Array.isArray(e))return e.map(e=>w(e)).filter(Boolean);if(typeof e==`string`){let t=e.trim();return t?t.includes(`|`)?t.split(`|`).map(e=>e.trim()).filter(Boolean):t.includes(`,`)?t.split(`,`).map(e=>e.trim()).filter(Boolean):[t]:[]}return[]}function De(e){return Array.from(new Set(e.map(e=>e.trim()).filter(Boolean)))}function Oe(e){let t=Te(e);if(t)return t;let n=w(e).match(/(?:19|20)\d{2}/);if(!n)return;let r=Number(n[0]);return Number.isFinite(r)?r:void 0}function ke(e){return Ce(e.work)}function Ae(e){let t=Ce(e.mood);return{tone:w(t.tone),density:w(t.density),color:w(t.color)}}function je(e){let t=Ce(e.links);return{demo:w(t.demo),repo:w(t.repo),caseStudy:w(t.caseStudy)}}function Me(e){return Object.keys(e).length>0}function Ne(e,t){return t||(e===`draft`?`draft`:e===`archived`?`archived`:`published`)}function Pe(e,t=!1){return!(e.visibility===`hidden`||e.workStatus===`private`||!t&&e.workStatus===`draft`||!t&&e.status===`draft`)}function Fe(e){return!ye.has(e.slug)&&Pe(e)&&(be.has(e.kind)||e.featured||e.hasWorkMetadata)}function Ie(e){let t=e.frontmatter,n=ke(t),r=t.status||`active`,i=Ne(r,w(n.status)),a=pe(e),o=_e(e),s=ve(e),c=w(n.type)||a||`page`,l=De(Ee(n.role).concat(Ee(t.role))),u=De(Ee(n.stack)),d=De(Ee(n.tools)),f=De(Ee(n.tags).concat(Ee(t.tags))),p=w(n.period),m=Oe(n.year)??Oe(p)??Oe(t.date),h=w(n.summary)||t.cardDescription||t.summary||t.description||``,g=t.cardCover||t.thumbnail||t.cover||``;return{slug:e.slug,href:`/${e.slug}`,title:t.cardTitle||t.title,description:h,summary:h,cover:g,thumbnail:t.thumbnail||g,icon:t.cardIcon||``,kind:a,type:c,status:r,workStatus:i,tags:f,order:typeof t.order==`number`?t.order:9999,featured:we(n.featured,o.featured||t.featured===!0),weight:Te(n.weight)??0,contentDir:e.contentDir,year:m,period:p,client:w(n.client)||w(t.client),role:l,stack:u,tools:d,category:w(n.category)||s,mood:Ae(n),links:je(n),hasWorkMetadata:Me(n),date:t.date||``,updated:t.updated||``,series:t.series||``,related:t.related||[],visibility:t.visibility||`public`}}function Le(e){return Be(e.map(Ie).filter(e=>e.featured).filter(e=>e.category===`works`).filter(e=>Pe(e)),`featured`)}function Re(e,t={}){return Be(e.map(Ie).filter(e=>!ye.has(e.slug)).filter(e=>Pe(e,t.includeDrafts)).filter(e=>e.category===`works`).filter(e=>be.has(e.kind)||e.featured||e.hasWorkMetadata),`featured`)}function ze(e,t){return Number(t.featured)-Number(e.featured)||t.weight-e.weight||Number(t.year??0)-Number(e.year??0)||e.order-t.order||e.title.localeCompare(t.title)}function Be(e,t){let n=[...e];return t===`title`?n.sort((e,t)=>e.title.localeCompare(t.title)):t===`kind`||t===`type`?n.sort((e,t)=>e.type.localeCompare(t.type)||t.weight-e.weight||e.order-t.order||e.title.localeCompare(t.title)):t===`year`?n.sort((e,t)=>Number(t.year??0)-Number(e.year??0)||t.weight-e.weight||e.title.localeCompare(t.title)):n.sort(ze)}function Ve(e){return Fe(e)&&(xe.has(e.kind)||xe.has(e.type)||Se.has(e.category)||e.slug.startsWith(`works/`))}function He(e){return Be(e.map(Ie).filter(Ve),`featured`)}function Ue(e,t,n=4){let r=new Map(t.map(e=>[e.slug,e])),i=[],a=new Set([e.slug]);for(let t of e.related){let e=r.get(t);if(!(!e||a.has(e.slug))&&(i.push(e),a.add(e.slug),i.length>=n))return i}let o=t.filter(e=>!a.has(e.slug)).map(t=>{let n=0;e.series&&t.series===e.series&&(n+=12),t.type===e.type&&(n+=4),t.kind===e.kind&&(n+=3);let r=t.tags.filter(t=>e.tags.includes(t));n+=r.length*4;let i=t.stack.filter(t=>e.stack.includes(t));n+=i.length*2;let a=Math.abs(t.order-e.order);return n-=Math.min(a,20)*.05,{entry:t,score:n}}).filter(e=>e.score>0).sort((e,t)=>t.score-e.score||ze(e.entry,t.entry));for(let e of o)if(i.push(e.entry),a.add(e.entry.slug),i.length>=n)break;return i}function We(e,t){let n=Be(t,`featured`),r=n.findIndex(t=>t.slug===e.slug);return r<0?{previous:null,next:null}:{previous:n[r-1]||null,next:n[r+1]||null}}function Ge(e,t){let n=He(e),r=n.find(e=>e.slug===t);if(!r)return null;let i=Ue(r,n,4),a=We(r,n);return{current:r,related:i,previous:a.previous,next:a.next}}function Ke(e){let t=String(e??``).trim();return t?/^[a-z][a-z0-9+.-]*:/i.test(t)?t:t.replace(/\\/g,`/`).replace(/^\/+/,``).replace(/\/+$/,``).replace(/\/+$/,``):``}function qe(e){let t=new Map;for(let n of e){let e=Ke(n.slug);e&&(t.set(e,n),e.startsWith(`works/`)?t.set(e.slice(6),n):t.set(`works/${e}`,n))}return t}function Je(e,t,n={}){let r=qe(e),i=Ke(n.currentSlug||``),a=Number.isFinite(Number(n.limit))?Math.max(0,Number(n.limit)):1/0,o=[],s=new Set;function c(e){let t=Ke(e);t&&(s.add(t),t.startsWith(`works/`)?s.add(t.slice(6)):s.add(`works/${t}`))}c(i);for(let e of t){let t=Ke(e);if(!t||s.has(t)||/^[a-z][a-z0-9+.-]*:/i.test(t))continue;let n=r.get(t);if(!(!n||s.has(n.slug))&&!(n.workStatus===`private`||n.workStatus===`draft`)&&!(n.status===`draft`||n.visibility===`hidden`)&&(o.push(n),c(n.slug),o.length>=a))break}return o}var Ye={class:`vt-work-card__media`},Xe=[`src`,`alt`],Ze={key:1,class:`vt-work-card__missing`},Qe={key:2,class:`vt-work-card__tag`},$e={key:3,class:`vt-work-card__featured`},et={class:`vt-work-card__body`},tt={class:`vt-work-card__meta-row`},nt={key:0,class:`vt-work-card__meta`},rt={key:1,class:`vt-work-card__status`},it={class:`vt-work-card__title`},at={key:0,class:`vt-work-card__description`},ot={key:1,class:`vt-work-card__chips`,"aria-label":`역할`},st={key:2,class:`vt-work-card__chips`,"aria-label":`기술 스택`},ct={key:3,class:`vt-work-card__chips vt-work-card__chips--muted`,"aria-label":`태그`},lt=r({__name:`WorkCard`,props:{pages:{default:()=>[]},contentDir:{default:``},slug:{default:``},title:{default:``},description:{default:``},cover:{default:``},href:{default:``},tag:{default:``},role:{default:()=>[]},stack:{default:()=>[]},tags:{default:()=>[]},year:{default:void 0},period:{default:``},featured:{type:Boolean,default:!1},status:{default:``}},setup(r){let h=r,g=s(()=>{if(!h.slug)return null;let e=h.pages.find(e=>e.slug===h.slug);return e?Ie(e):null});function _(e=[],t=4){return e.filter(Boolean).slice(0,t)}let v=s(()=>{let e=g.value;return{title:h.title||e?.title||``,description:h.description||e?.summary||e?.description||``,cover:h.cover||e?.cover||``,href:h.href||e?.href||``,tag:h.tag||e?.type||e?.kind||``,contentDir:h.contentDir||e?.contentDir||``,role:h.role.length?h.role:e?.role||[],stack:h.stack.length?h.stack:e?.stack||[],tags:h.tags.length?h.tags:e?.tags||[],year:h.year||e?.year,period:h.period||e?.period||``,featured:h.featured||e?.featured||!1,status:h.status||e?.workStatus||``}}),y=s(()=>m(v.value.contentDir,v.value.cover)),b=s(()=>v.value.href||`#`),ee=s(()=>/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(b.value)),te=s(()=>/^(?:https?:)?\/\//i.test(b.value)),ne=s(()=>ee.value||b.value.startsWith(`#`)),x=s(()=>{let e=b.value.trim();return!e||e===`#`?`/`:e.startsWith(`/`)?e:`/${e.replace(/^\.\//,``).replace(/^\/+/,``)}`}),re=s(()=>_(v.value.role,3)),ie=s(()=>_(v.value.stack,4)),ae=s(()=>_(v.value.tags,4)),oe=s(()=>v.value.period||(v.value.year?String(v.value.year):``));return(r,s)=>(d(),a(n(ne.value?`a`:f(p)),{class:`vt-work-card`,href:ne.value?b.value:void 0,to:ne.value?void 0:x.value,target:te.value?`_blank`:void 0,rel:te.value?`noopener noreferrer`:void 0},{default:t(()=>[u(`div`,Ye,[y.value.found?(d(),l(`img`,{key:0,class:`vt-work-card__image`,src:y.value.url,alt:v.value.title,loading:`lazy`,decoding:`async`},null,8,Xe)):(d(),l(`div`,Ze,`No cover`)),v.value.tag?(d(),l(`span`,Qe,i(v.value.tag),1)):o(``,!0),v.value.featured?(d(),l(`span`,$e,`Featured`)):o(``,!0)]),u(`div`,et,[u(`div`,tt,[oe.value?(d(),l(`span`,nt,i(oe.value),1)):o(``,!0),v.value.status===`archived`?(d(),l(`span`,rt,`Archived`)):o(``,!0)]),u(`strong`,it,i(v.value.title||`Untitled`),1),v.value.description?(d(),l(`p`,at,i(v.value.description),1)):o(``,!0),re.value.length?(d(),l(`div`,ot,[(d(!0),l(c,null,e(re.value,e=>(d(),l(`span`,{key:`role-${e}`,class:`vt-work-card__chip vt-work-card__chip--role`},i(e),1))),128))])):o(``,!0),ie.value.length?(d(),l(`div`,st,[(d(!0),l(c,null,e(ie.value,e=>(d(),l(`span`,{key:`stack-${e}`,class:`vt-work-card__chip`},i(e),1))),128))])):o(``,!0),ae.value.length?(d(),l(`div`,ct,[(d(!0),l(c,null,e(ae.value,e=>(d(),l(`span`,{key:`tag-${e}`,class:`vt-work-card__chip vt-work-card__chip--muted`},` #`+i(e),1))),128))])):o(``,!0)])]),_:1},8,[`href`,`to`,`target`,`rel`]))}}),ut=new Set([`필수`,`선택`,`기타`]);function dt(e){return!!(e&&ut.has(e))}function ft(e){let t=e.trim(),n=t.match(/^\[(필수|선택|기타)\]\s*(.*)$/);return n?{tag:n[1],caption:n[2]?.trim()||``}:{tag:``,caption:t}}function pt(e){return e.replace(/&amp;/g,`&`).replace(/&lt;/g,`<`).replace(/&gt;/g,`>`).replace(/&quot;/g,`"`).replace(/&#39;/g,`'`)}function mt(e){return e.replace(/^[-*+]\s+/,``).trim()}function ht(e){let t={},n=(e||``).split(`;`).map(e=>e.trim()).filter(Boolean);for(let e of n){let n=e.indexOf(`=`);if(n<=0)continue;let r=e.slice(0,n).trim(),i=e.slice(n+1).trim();!r||!/^[a-zA-Z][\w.-]*$/.test(r)||(t[r]=i)}return t}function gt(e){return pt(e||``).replace(/\r\n/g,`
`).split(`
`).map(e=>e.trim()).filter(e=>e&&!e.startsWith(`#`)).filter(e=>/^[-*+]\s+/.test(e)).map(e=>mt(e)).map(e=>{let[t=``,n=``,r=``,i=``]=e.split(`|`).map(e=>e.trim()),a=ht(i);return{src:t,caption:n,thumb:r,title:a.title||``,meta:a}}).filter(e=>e.src.length>0)}var _t=`---
title: "Checkout failed or canceled"
slug: "checkout/fail"
kind: "page"
status: "active"
visibility: "public"
description: "Buyer landing page after checkout failure or cancellation."
robots: "noindex,follow"
---

# Checkout failed or canceled

The checkout was not completed or was canceled by the provider.

This page does not create, revoke, or delete purchase grants. Try the purchase flow again, or use the inquiry page if the problem repeats.

[Contact support](/inquiry)
`,vt=`---
title: "Checkout confirmation"
slug: "checkout/success"
kind: "page"
status: "active"
visibility: "public"
description: "Buyer landing page after checkout provider success redirect."
robots: "noindex,follow"
---

# Checkout confirmation

The checkout provider returned to the success page.

Payment success screens do not prove purchase rights. Actual file delivery rights are activated only after server-side payment verification and grant creation.

[Go to the claim page](/claim)
`,yt=`---
title: "구매 파일 수령"
slug: "claim"
description: "결제 후 발급된 수령 정보를 입력해 구매 파일 수령 절차를 확인합니다."
kind: "page"
status: "active"
visibility: "public"
robots: "noindex,follow"
tags:
  - claim
  - delivery
  - store
order: 92
seoTitle: "구매 파일 수령 — VARUN Tools"
seoDescription: "결제 후 발급된 claim token, 주문번호, 이메일을 입력해 구매 파일 수령 절차를 확인합니다."
---

# 구매 파일 수령

결제 후 안내받은 수령 정보를 입력하세요. 실제 다운로드 권한은 서버에서만 검증됩니다.

::claim-portal
title: 구매 파일 수령
intro: claim token, 주문번호, 이메일 중 안내받은 정보를 입력하세요.
requireClaimToken: true
requireEmail: false
requireOrderId: false
submitLabel: 수령 정보 확인
::
`,bt=`---
title: "VARUN Tools"
slug: "home"
layout: "default"
theme: "showroom"
description: "디자인, 도구, 실험, 상품을 모아둔 바룬툴즈 작업실입니다."
summary: "작업물, 상품, 도구, 실험을 정리하는 VARUNTOOLS 쇼룸"
cover: "./images/cover.svg"
thumbnail: "./images/cover.svg"
kind: "page"
status: "active"
visibility: "public"
featured: false
tags:
  - home
  - portfolio
  - tools
order: 0
seoTitle: "VARUN Tools"
seoDescription: "디자인, 도구, 실험, 상품을 모아둔 바룬툴즈 작업실입니다."
ogImage: "/og/default-og.svg"
---

# VARUN Tools

::markdown-box
type: ssot
title: 작업실 안내
::
바룬툴즈는 디자인 작업, 실험적 도구, 이미지/문서 아카이브, 상품 카탈로그를 한곳에 묶는 개인 작업실형 홈페이지입니다.
::

::home-section
title: 추천 상품
source: products
featured: true
limit: 6
layout: product-grid
showUnavailable: true
emptyMode: notice
emptyTitle: 상품을 준비하고 있습니다
emptyBody: 판매 가능 상품과 디지털 다운로드 항목을 이곳에 정리할 예정입니다.
emptyHref: /products
emptyLabel: 상품 카탈로그 보기
::

::home-section
title: 대표 작업
source: works
featured: true
limit: 6
layout: card-grid
emptyMode: notice
emptyTitle: 대표 작업을 정리하고 있습니다
emptyBody: 바룬툴즈의 작업 사례와 제작 기록이 이곳에 표시됩니다.
::

::home-section
title: 도구
source: tools
limit: 6
layout: card-grid
emptyMode: hide
::

::home-section
title: 실험실
source: lab
limit: 4
layout: compact-list
emptyMode: hide
::

::home-section
title: 최근 글
source: post
limit: 6
layout: compact-list
emptyMode: hide
::
`,xt=`---
title: "문의"
slug: "inquiry"
description: "VARUN Tools 문의 창구입니다."
kind: "page"
status: "active"
visibility: "public"
tags:
  - inquiry
  - contact
order: 90
seoTitle: "문의 — VARUN Tools"
seoDescription: "VARUN Tools 상품 문의, 작업 의뢰, 협업 제안을 남길 수 있는 문의 창구입니다."
---

# 문의

상품 문의, 작업 의뢰, 협업 제안을 남길 수 있습니다.

::inquiry-form
title: 문의하기
intro: 닉네임과 제출 확인용 코드를 입력한 뒤 문의를 남겨주세요.
requireNickname: true
requireGateCode: true
requireEmail: false
submitLabel: 문의 남기기
::
`,St=`---
title: "마크다운 갤러리 실험실"
slug: "lab-markdown-gallery"
layout: "default"
theme: "showroom"
description: "VARUNTOOLS 마크다운 컴포넌트를 검수하는 시각 QA 보드입니다."
summary: "마크다운 화면 구성요소를 검수하는 시각 QA 갤러리입니다."
kind: "lab"
status: "active"
visibility: "public"
featured: true
order: 4
date: "2026-04-26"
updated: "2026-05-04"
series: "markdown-tools"
cover: "./images/cover.svg"
thumbnail: "./images/qa-card-a.svg"
cardTitle: "마크다운 갤러리 실험실"
cardDescription: "마크다운 컴포넌트, 카드, 박스, 이미지 화면, 경계 규칙을 점검하는 시각 QA 보드입니다."
cardCover: "./images/cover.svg"
tags:
  - lab
  - qa
  - markdown
  - media
work:
  type: "experiment"
  category: "experiment"
  status: "published"
  featured: true
  weight: 40
  year: 2026
  role:
    - "designer"
    - "developer"
    - "editor"
  stack:
    - "markdown"
    - "vue"
    - "css"
  tags:
    - "qa"
    - "markdown"
    - "visual-regression"
seoTitle: "마크다운 갤러리 실험실"
seoDescription: "VARUNTOOLS Markdown 컴포넌트의 시각 QA 기준판입니다."
gallery:
  autoMini: true
---

# 마크다운 갤러리 실험실

::markdown-box
type: ssot
title: 시각 QA 기준
::
이 페이지는 바룬툴즈 Markdown 컴포넌트의 시각 검수 기준판입니다.

- 실제 Markdown renderer를 통과합니다.
- intentionally broken sample은 실제 content에 넣지 않습니다.
- 오류/누락/경계 케이스는 fixture와 smoke script에서 검증합니다.
::

::section-gap
size: sm
::

## 1. 캡션 이미지

일반 Markdown image와 \`captioned-image\` directive의 tooltip/chip/lightbox 연결을 확인합니다.

![caption 없는 이미지](./images/qa-card-a.svg)

![필수 캡션](./images/qa-card-a.svg "[필수] 대표 이미지 설명입니다.")

![선택 캡션](./images/qa-card-b.svg "[선택] 보조 설명 이미지입니다.")

![기타 캡션](./images/qa-card-c.svg "[기타] 기타 참고 이미지입니다.")

::captioned-image
src: ./images/qa-card-b.svg
alt: 명시형 captioned image
caption: Directive 기반 캡션 툴팁입니다.
tag: 선택
lightbox: true
::

::section-gap
size: md
::


## 1.5. 캡션 이미지 프레임

::markdown-box
type: ssot
title: 캡션 이미지 프레임 Contract
::
Captioned image의 badge, help button, tooltip은 반드시 image frame 내부 overlay로 귀속됩니다.
badge는 줄바꿈/세로쓰기 없이 한 줄 pill 형태로 보여야 합니다.
tooltip은 이미지 frame hover로 열리지 않고, 오직 \`?\` help button hover 또는 keyboard focus-visible 상태에서만 열립니다.
::

![Required Badge](./images/qa-card-a.svg "[필수] 필수 뱃지 프레임 고정 확인")

![Optional Badge](./images/qa-card-b.svg "[선택] 선택 뱃지 프레임 고정 확인")

![Misc Badge](./images/qa-card-c.svg "[기타] 기타 뱃지 프레임 고정 확인")

::section-gap
size: md
::

## 2. Before / After

기본 전후 비교와 세로형 이미지의 natural aspect-ratio 반영을 확인합니다.

::before-after
before: ./images/qa-before.svg
after: ./images/qa-after.svg
caption: 기본 전후 비교
initial: 50
::

::before-after
before: ./images/qa-before.svg
after: ./images/qa-after.svg
caption: initial 30 비교
initial: 30
::

::before-after
before: ./images/qa-before-tall.svg
after: ./images/qa-after-tall.svg
caption: 세로형 이미지 비율 검수
initial: 35
::

::section-gap
size: md
::

## 3. Pagecard Grid

명시 items와 registry query 기반 pagecard grid를 확인합니다.

::pagecard-grid
items: /wiper,/lab-markdown-gallery
columns: auto
::

::pagecard-grid
query: lab
limit: 3
sort: order
columns: compact
::

::pagecard-grid
items: /lab-markdown-gallery
columns: wide
::

::section-gap
size: md
::

## 4. 마크다운 박스

박스 타입, tone, collapsible, defaultOpen 상태를 확인합니다.

::markdown-box
type: note
title: 메모
::
일반 메모 박스입니다.
::

::markdown-box
type: tip
title: Tip
::
작은 사용 팁을 담는 박스입니다.
::

::markdown-box
type: ssot
title: SSOT 기준
::
상태 귀속 위치를 명시하는 박스입니다.
::

::markdown-box
type: warning
title: 조용한 보정 금지
collapsible: true
defaultOpen: true
::
불명확한 값은 예쁘게 메우지 않고 warning으로 남깁니다.
::

::markdown-box
type: danger
title: Danger
::
실제 실패나 손실 가능성이 있는 상태를 강조합니다.
::

::markdown-box
type: quote
title: Quote
::
인용이나 관찰 기록을 담는 박스입니다.
::

::markdown-box
type: decision
title: 접힌 결정 기록
collapsible: true
defaultOpen: false
::
이 박스는 기본적으로 닫힌 상태로 시작합니다.
::

::section-gap
size: md
::

## 5. Image Card

이미지 카드가 captioned-image나 pagecard-grid와 섞이지 않고 독립 카드로 렌더되는지 확인합니다.

::image-card
src: ./images/qa-card-c.svg
alt: 이미지 카드 QA
caption: 이미지 카드 설명
tag: QA
href: /lab-markdown-gallery
::

::section-gap
size: md
::

## 6. Section Gap

Native section gap directive가 legacy token 없이 시각 간격을 만드는지 확인합니다.

위 문단입니다.

::section-gap
size: lg
::

아래 문단입니다.

::section-gap
size: md
::

## 7. Asset Registry Policy

::markdown-box
type: warning
title: Missing Asset QA 정책
::
실제 missing asset 샘플은 fixture와 smoke에서만 검증합니다.
시각 QA 페이지는 validation-clean 상태를 유지합니다.
::

::markdown-box
type: ssot
title: Asset SSOT
::
콘텐츠 에셋 경로 판정은 Asset Registry 정책을 기준으로 합니다.
Runtime과 validation이 서로 다른 방식으로 경로를 해석하지 않아야 합니다.
::

::section-gap
size: md
::

## 8. 기존 문법 마이그레이션 미리보기

::markdown-box
type: note
title: 기존 문법 점검 명령
::
이 프로젝트는 legacy 문법을 런타임에서 제한적으로 흡수하지만, 원본 정리는 CLI로 수행합니다.

\`\`\`bash
npm run audit:legacy
npm run codemod:legacy
npm run codemod:legacy:write
\`\`\`
::

::section-gap
size: md
::

## 9. Boundary Rule

::markdown-box
type: ssot
title: Nested Directive Boundary
::
\`markdown-box\` 내부에는 일반 Markdown만 넣습니다.
\`pagecard-grid\`, \`before-after\`, \`captioned-image\` 같은 Vue directive는 top-level block으로 분리합니다.
::

::section-gap
size: md
::

## 10. Mobile Density Check

::markdown-box
type: tip
title: 모바일 확인 항목
::
- TOC floating button 위치
- caption tooltip touch target
- before-after slider handle
- pagecard grid column collapse
- collapsible box header height
::

::section-gap
size: md
::

## 11. Accessibility Check

::markdown-box
type: ssot
title: 접근성 확인 기준
::
이 페이지는 마우스 없이도 주요 상호작용을 확인할 수 있어야 합니다.

- Tab으로 TOC/카드/박스/이미지 설명 버튼 접근
- Enter/Space로 접힘 박스 토글
- Before/After slider 방향키 조작
- Escape로 모바일 TOC/Lightbox 닫기
- reduced motion 환경에서 과한 전환 감소
::


## 12. SEO Metadata Check

::markdown-box
type: ssot
title: SEO SSOT
::
페이지 제목, 설명, 대표 이미지는 Markdown frontmatter에서 가져옵니다.
사이트 공통 origin과 default OG 이미지는 \`siteConfig\`에서 가져옵니다.
::


::section-gap
size: md
::

## 13. Video Player

::markdown-box
type: ssot
title: Native Video Playback QA
::
Commit 30은 스트리밍 인프라가 아니라 native video 재생 입구를 검수합니다.
\`preload: auto\`, \`playsInline\`, native controls를 기준으로 준 실시간 재생감을 확인합니다.
::

::video-player
src: ./videos/qa-video.webm
poster: ./images/qa-video-poster.svg
title: Video Player QA
caption: Native video-player directive sample for progressive playback.
controls: true
autoplay: false
loop: true
muted: false
playsInline: true
preload: auto
::

::section-gap
size: md
::

## 14. 섹션 범위 라이트박스와 미니 갤러리

::markdown-box
type: ssot
title: 미니 갤러리 계약
::
이미지를 클릭하면 페이지 전체가 아니라, 현재 구분선 section 안의 이미지들만 라이트박스 갤러리로 묶입니다.
섹션 안 이미지가 2개 이상이면, 마지막 이미지 아래에 mini gallery strip이 자동 생성됩니다.
썸네일을 누르면 해당 section group만 라이트박스로 열립니다.
::

![Gallery A-1](./images/qa-card-a.svg "[필수] 첫 번째 섹션 이미지 A")

![Gallery A-2](./images/qa-card-b.svg "[선택] 첫 번째 섹션 이미지 B")

::section-gap
size: sm
::

![Gallery B-1](./images/qa-card-c.svg "[기타] 두 번째 섹션 이미지 C")

![Gallery B-2](./images/qa-before.svg "[선택] 두 번째 섹션 이미지 D")


::section-gap
size: md
::

## 15. 수동 갤러리 스트립

::markdown-box
type: ssot
title: 수동 갤러리 계약
::
\`gallery-strip\`은 작성자가 직접 이미지 묶음을 선언하는 수동 갤러리입니다.
이 directive가 있는 section에서는 자동 mini gallery가 중복 생성되지 않습니다.
::

::gallery-strip
title: 수동 스트립 갤러리
caption: strip layout sample.
layout: strip
lightbox: true
::
- ./images/qa-card-a.svg | Manual gallery A
- ./images/qa-card-b.svg | Manual gallery B
- ./images/qa-card-c.svg | Manual gallery C
::

::gallery-strip
title: 수동 그리드 갤러리
caption: grid layout sample.
layout: grid
lightbox: true
::
- ./images/qa-before.svg | Grid gallery A
- ./images/qa-after.svg | Grid gallery B
- ./images/qa-before-tall.svg | Grid gallery C
::

::section-gap
size: md
::

## 16. 갤러리 확대 보기

::markdown-box
type: ssot
title: 갤러리 확대 보기 계약
::
갤러리 썸네일에 마우스를 올리면 돋보기 박스가 나타납니다.
돋보기 박스 안의 확대 영역은 마우스 포인터 또는 드래그 좌표를 따라 실시간으로 바뀝니다.

- 클릭 1회: 해당 이미지의 돋보기 비활성화
- 같은 이미지에서 0.1초 안에 한 번 더 클릭: 돋보기 재활성화
- 느린 두 번 클릭: double click으로 판정하지 않음
::

::section-gap
size: md
::

## 17. Lightbox Zoom Inspection

::markdown-box
type: ssot
title: Lightbox Zoom Contract
::
라이트박스 안의 큰 이미지는 확대/축소/드래그 이동이 가능합니다.

- \`+\` / \`-\` 버튼 또는 키보드로 확대/축소
- \`0\`으로 초기화
- 확대 상태에서 드래그 pan
- 이미지가 바뀌면 zoom/pan reset
- \`Ctrl + wheel\`로 stage 위에서 확대/축소
::

::section-gap
size: md
::

## 18. 모바일 터치 갤러리

::markdown-box
type: ssot
title: Mobile Touch Contract
::
모바일 라이트박스에서는 손가락 입력을 기준으로 이미지를 조작합니다.

- 두 손가락 pinch: 확대/축소
- 확대 상태 한 손가락 drag: 이미지 pan
- 1x 상태 좌우 swipe: 이전/다음 이미지 이동
- double tap: 2x 확대 또는 reset
- thumbnail tray는 가로 스크롤을 유지합니다.
::

::section-gap
size: md
::

## 19. Lightbox Pan Clamp

::markdown-box
type: ssot
title: Lightbox Pan Boundary
::
확대된 이미지는 stage 밖으로 과하게 벗어나지 않도록 이동 범위가 제한됩니다.
\`Ctrl + wheel\`, pinch, double tap 확대는 입력 지점을 기준으로 focal zoom을 수행합니다.
::


::section-gap
size: md
::

## 20. Lightbox Metadata

::markdown-box
type: ssot
title: Lightbox Metadata Contract
::
라이트박스는 현재 이미지의 제목, 캡션, 순번, 원본 경로, gallery group을 표시합니다.
Copy 버튼은 현재 gallery/image index를 담은 공유 링크를 생성합니다.
라이트박스 닫기/이전/다음/액션 버튼은 밝은 이미지 위에서도 icon/text가 명확히 보여야 하며, 모든 액션 버튼 텍스트는 중앙 정렬되어야 합니다.
::

::gallery-strip
title: 수동 메타데이터 갤러리
caption: metadata panel sample.
layout: strip
lightbox: true
::
- ./images/qa-card-a.svg | 첫 번째 메타 이미지 | ./images/qa-card-a.svg | title=초기 시안; tool=Figma; tag=draft
- ./images/qa-card-b.svg | 두 번째 메타 이미지 | ./images/qa-card-b.svg | title=보정안; tool=Photoshop; tag=final
::

::section-gap
size: md
::

## 21. Authoring & Filing

::markdown-box
type: ssot
title: Content Filing Contract
::
새 페이지는 \`src/content/pages/{category}/{slug}/index.md\` 구조로 생성합니다.
이미지와 영상은 해당 페이지 폴더 내부의 \`images/\`, \`videos/\`에 둡니다.
새 페이지 생성은 \`npm run new:page -- works project-name\` 명령을 사용합니다.
::

::section-gap
size: md
::

## CSV Authoring

::markdown-box
type: ssot
title: CSV Authoring Contract
::
복잡한 Markdown directive를 직접 외우지 않고, \`page.csv\`를 작성한 뒤 \`npm run csv:page\`로 \`index.md\`를 생성합니다.
CSV 기반 페이지에서는 \`page.csv\`가 작성 원본이고 \`index.md\`는 generated output입니다.
::

::section-gap
size: md
::

## 22. Responsive UI

::markdown-box
type: ssot
title: Responsive UI Contract
::
와이드 화면에서도 본문 타이포그래피와 카드 폭은 과하게 확대되지 않습니다.
텍스트 본문은 읽기 폭을 유지하고, 모바일에서는 터치 UI 밀도를 보정합니다.
반응형은 화면이 넓다고 모든 UI를 키우는 것이 아니라, 정보 밀도와 읽기 폭을 안정화하는 기준입니다.
::


## 스토어 준비 콘텐츠 모델

::markdown-box
type: ssot
title: 상품 카탈로그 Contract
::
스토어 확장을 위해 \`products\` category와 \`product\` frontmatter를 사용한다.
Commit 48은 자체 결제 기능이 아니라 상품 카탈로그와 외부 구매 링크 기반 모델을 추가한다.
상품 결제 링크는 Toss Payments URL을 \`product.checkoutUrl\`에 연결하고, 디지털 상품 다운로드는 추후 Cloudflare URL을 \`product.downloadUrl\`에 연결한다.
상품 가격은 공개하며 \`coming-soon\`과 \`sold-out\` 상태도 \`showWhenUnavailable: true\` 기준으로 메인/목록 노출 후보에 포함한다.
::


::section-gap
size: md
::

## Homepage Index

::markdown-box
type: ssot
title: Homepage Index Contract
::
홈페이지는 works, products, tools, lab 데이터를 개별 페이지 frontmatter에서 수집해 섹션별 카드로 노출한다.
상품은 가격을 공개하며, 준비중/품절 상품도 설정에 따라 목록에 표시한다.
::


## Seed Content Empty Section Contract

::markdown-box
type: ssot
title: Seed Content Empty Section Contract
::
Commit 50-0 기준으로 홈/스토어 섹션은 항목이 없을 때 개발자용 \`아직 표시할 항목이 없습니다.\` 문구를 직접 노출하지 않습니다.
\`::home-section\`은 \`emptyMode: notice\` 또는 \`emptyMode: hide\`를 통해 사용자용 안내 카드 또는 섹션 숨김을 선택합니다.
상품 seed는 실제 상품명, SKU, 가격, 구매 링크가 있을 때만 public content tree에 추가합니다.
::

::section-gap
size: md
::

## Media Breakout Contract

와이드 화면에서 본문 문단은 읽기 폭을 유지하고, 아래 미디어 컴포넌트들은 본문보다 넓은 rail로 펼쳐져야 한다.

- captioned image
- gallery strip
- video player
- before-after

markdown-box는 넓어지면 안 된다.

::markdown-box
type: ssot
title: Media Breakout Contract
::
텍스트 rail은 \`--vt-content-max\`에 남고, 미디어 rail은 \`--vt-media-max\`, 홈 카드 rail은 \`--vt-home-max\`에 귀속됩니다.

\`markdown-box\`는 구조/주의/SSOT 설명 블록이므로 wide rail로 빠져나가지 않습니다.
::

`,Ct=`---
schema: "{\\"packId\\":\\"page\\",\\"packVersion\\":\\"cms-schema-pack-v1\\"}"
layout: "default"
showInNav: "true"
navLabel: "3252"
tags:
  - "3252523523"
title: "342523523"
summary: "5235325235"
category: "page"
slug: "page/231325343"
source: "vacms"
vacmsSlug: "231325343"
vacmsPageId: "page_2e4da4ab42148326ad0c123c"
vacmsRevisionId: "rev_9ad9d1ce9c887c2cfaaffb89"
---



::case-section
type: process
title: ewrwrewrwe
kind: ewrwerewrew
::
werwerew
::
`,wt=`---
showInNav: "true"
navLabel: "sdsds"
schema: "{\\"packId\\":\\"page\\",\\"packVersion\\":\\"cms-schema-pack-v1\\"}"
layout: "default"
tags:
  - "sdsds"
title: "sdsdsd"
summary: "sdsdsds"
category: "page"
slug: "page/sdsdsd"
source: "vacms"
vacmsSlug: "sdsdsd"
vacmsPageId: "page_04eb99780ae81931c94d5d4f"
vacmsRevisionId: "rev_fbd9c8989a77a5c28416031f"
---

::tip
title: Tip
::
sdsdsㅇㄹㅇㄹㅇ
::
`,Tt=`---
showInNav: "true"
navLabel: "TEST"
schema: "{\\"packId\\":\\"page\\",\\"packVersion\\":\\"cms-schema-pack-v1\\"}"
kind: "page"
visibility: "public"
exposure: "{\\"route\\":true,\\"home\\":false,\\"collection\\":\\"page\\",\\"search\\":true,\\"sitemap\\":true,\\"nav\\":false,\\"featured\\":false,\\"routeOnly\\":false}"
layout: "default"
tags:
  - "TEST"
title: "testt11"
summary: "TEST1"
category: "page"
slug: "page/testt11"
source: "vacms"
vacmsSlug: "testt11"
vacmsPageId: "page_ef84ea51500553d6821f9f8e"
vacmsRevisionId: "rev_2998eb83b8c309031c1c90f5"
---

::note
title: Note
::
TEST
::


`,Et=`---
title: "디지털 다운로드 안내"
slug: "policies/digital-download"
layout: "default"
theme: "showroom"
description: "디지털 상품 파일 제공 방식과 사용 범위 안내입니다."
summary: "디지털 다운로드 안내"
kind: "page"
status: "active"
visibility: "hidden"
featured: false
order: 905
robots: "noindex,follow"
tags:
  - policy
  - digital-download
---

# 디지털 다운로드 안내

디지털 상품은 상품별 안내에 따라 파일 제공 방식, 다운로드 가능 시점, 업데이트 범위가 달라질 수 있습니다.

## 확인할 항목

- 다운로드 링크 제공 방식은 상품별 안내를 기준으로 확인합니다.
- 사용 범위와 라이선스는 상품 설명 또는 별도 라이선스 문구를 기준으로 확인합니다.
- 파일 업데이트, 재다운로드, 배포 가능 여부는 런칭 전 최종 정책으로 정리해야 합니다.

::markdown-box
type: warning
title: 라이선스 문구 미확정
::
개인 사용, 상업 사용, 재배포 가능 여부를 단정하지 않습니다. 실제 디지털 상품의 라이선스는 상품별로 확정해야 합니다.
::
`,Dt=`---
title: "스토어 정책"
slug: "policies"
layout: "default"
theme: "showroom"
description: "바룬툴즈 스토어 정책 안내 허브입니다."
summary: "스토어 정책 안내"
kind: "page"
status: "active"
visibility: "hidden"
featured: false
order: 900
robots: "noindex,follow"
tags:
  - policy
  - store
---

# 스토어 정책

바룬툴즈 스토어에서 상품을 확인하거나 외부 결제 링크로 이동하기 전에 참고할 정책 안내입니다.

::markdown-box
type: warning
title: 검토 필요
::
이 페이지의 문구는 런칭 전 운영 기준과 실제 판매 형태에 맞춰 최종 검토해야 합니다. 배송, 환불, 개인정보, 디지털 다운로드 조건은 상품별 안내와 외부 결제 서비스 정책이 함께 적용될 수 있습니다.
::

## 정책 링크

- [스토어 안내](/policies/store)
- [배송 안내](/policies/shipping)
- [환불/교환 안내](/policies/refund)
- [개인정보 안내](/policies/privacy)
- [디지털 다운로드 안내](/policies/digital-download)
`,Ot=`---
title: "개인정보 안내"
slug: "policies/privacy"
layout: "default"
theme: "showroom"
description: "외부 결제, 외부 스토어, 문의 과정에서 적용될 수 있는 개인정보 처리 흐름 안내입니다."
seoDescription: "외부 결제, 외부 스토어, 문의 과정에서 적용될 수 있는 개인정보 처리 흐름 안내입니다."
summary: "개인정보 안내"
kind: "page"
status: "active"
visibility: "hidden"
featured: false
order: 904
robots: "noindex,follow"
tags:
  - policy
  - privacy
---

# 개인정보 안내

바룬툴즈 페이지에서 외부 결제, 외부 스토어, 문의 채널로 이동하는 경우 해당 서비스의 개인정보 처리 기준이 함께 적용될 수 있습니다.

## 확인할 항목

- 현재 사이트가 직접 수집하는 정보와 외부 서비스가 수집하는 정보를 구분해야 합니다.
- 결제 정보는 연결된 결제 서비스 또는 외부 스토어의 정책을 확인해야 합니다.
- 문의 폼이나 이메일 수집이 추가되면 별도 개인정보 안내가 필요합니다.

::markdown-box
type: warning
title: 수집 범위 검토 필요
::
개인정보 처리 문구는 실제 폼, 결제 링크, 외부 서비스 연결 방식에 따라 최종 검토해야 합니다.
::
`,kt=`---
title: "환불/교환 안내"
slug: "policies/refund"
layout: "default"
theme: "showroom"
description: "구매 전 확인할 환불과 교환 안내 골격입니다."
summary: "환불/교환 안내"
kind: "page"
status: "active"
visibility: "hidden"
featured: false
order: 903
robots: "noindex,follow"
tags:
  - policy
  - refund
---

# 환불/교환 안내

환불과 교환 가능 여부는 상품 유형, 제작 방식, 배송 상태, 디지털 파일 제공 여부에 따라 달라질 수 있습니다.

## 확인할 항목

- 실물 상품과 디지털 상품의 처리 기준은 다를 수 있습니다.
- 외부 결제 또는 외부 스토어를 이용하는 경우 해당 서비스의 정책이 함께 적용될 수 있습니다.
- 최종 환불/교환 조건은 판매 시작 전 실제 운영 기준으로 확정해야 합니다.

::markdown-box
type: warning
title: 법률 문구 아님
::
이 페이지는 정책 골격입니다. 환불, 교환, 청약철회 관련 확정 문구는 실제 판매 형태에 맞춰 별도 검토가 필요합니다.
::
`,At=`---
title: "배송 안내"
slug: "policies/shipping"
layout: "default"
theme: "showroom"
description: "실물 상품의 배송 방식, 배송비, 발송 준비 상태를 구매 전 확인하기 위한 안내입니다."
seoDescription: "실물 상품의 배송 방식, 배송비, 발송 준비 상태를 구매 전 확인하기 위한 안내입니다."
summary: "배송 안내"
kind: "page"
status: "active"
visibility: "hidden"
featured: false
order: 902
robots: "noindex,follow"
tags:
  - policy
  - shipping
---

# 배송 안내

실물 상품의 배송 방식, 배송비, 예상 발송일은 상품별 상세 설명과 구매 안내를 기준으로 확인합니다.

## 확인할 항목

- 상품이 실물 상품인지 확인합니다.
- 배송이 필요한 상품인지 확인합니다.
- 배송비, 발송일, 포장 방식은 런칭 전 실제 운영 기준에 맞춰 확정해야 합니다.

::markdown-box
type: warning
title: 배송 조건 미확정
::
배송 기간과 비용을 단정하지 않습니다. 실제 상품별 배송 정책은 판매 시작 전 최종 검토가 필요합니다.
::
`,jt=`---
title: "스토어 안내"
slug: "policies/store"
layout: "default"
theme: "showroom"
description: "바룬툴즈 스토어의 상품 상태와 판매 방식 안내입니다."
summary: "스토어 운영 안내"
kind: "page"
status: "active"
visibility: "hidden"
featured: false
order: 901
robots: "noindex,follow"
tags:
  - policy
  - store
---

# 스토어 안내

바룬툴즈의 상품 상세 페이지는 상품 상태, 가격 표시 여부, 구매 링크 또는 외부 스토어 링크를 기준으로 구매 가능 여부를 안내합니다.

## 구매 흐름

- 자체 장바구니를 운영하지 않는 경우, 상품 상세의 버튼은 외부 결제 또는 외부 스토어 페이지로 이동할 수 있습니다.
- 상품이 \`coming-soon\`, \`sold-out\`, \`hidden\` 상태라면 구매 버튼이 비활성화될 수 있습니다.
- 실제 판매 조건은 각 상품 상세 설명과 연결된 결제/스토어 페이지를 함께 확인해야 합니다.

::markdown-box
type: warning
title: 최종 검토 필요
::
이 안내는 운영 골격입니다. 실제 사업자 정보, 결제 방식, 판매 조건은 런칭 전 최종 문구로 정리해야 합니다.
::
`,Mt=`---
role: "그냥"
period: "111110-223343"
client: "sadasd"
projectType: "sadasd"
contribution:
  - "sadasd"
result: "saddsa"
galleryAssetIds:
  - "sdfsdfsdfds"
schema: "{\\"packId\\":\\"post\\",\\"packVersion\\":\\"cms-schema-pack-v1\\"}"
shippingNote: "dfdfd"
size: "fdgdfg"
material: "dfgdfgdf"
purchaseUrl: "dfgdfgfd"
priceLabel: "dfgdfgdf"
publishedDate: "2026-06-19"
series: "sds"
mood: "sds"
relatedLinks: []
tags:
  - "fdshjfusjdk"
title: "asdasdsads"
summary: "sdasdasdasdsa"
category: "post"
slug: "post/asdasdsads"
source: "vacms"
vacmsSlug: "asdasdsads"
vacmsPageId: "page_4bea12ab6b5422fd5541a816"
vacmsRevisionId: "rev_95249701e2a91b34d32665e9"
---



::tip
title: Tip
::
ㄴㅇㄴㅇㄴㅇㄴㅇㅁㄹㅀㅀㄹ
::

::section-break


::note
title: Note
::
ㄴㅇㄴㅇㄴ
::
`,Nt=`---
publishedDate: "2026-06-26"
series: "sdfsd"
mood: "sdfds"
relatedLinks:
  - "sdfds"
tags:
  - "sdfdsfsd"
schema: "{\\"packId\\":\\"post\\",\\"packVersion\\":\\"cms-schema-pack-v1\\"}"
title: "sdfsdfdsfsdfdsfds"
summary: "dsfsdfsdfdsfdsfds"
category: "post"
slug: "post/dsfsdfjkdsfdsf"
source: "vacms"
vacmsSlug: "dsfsdfjkdsfdsf"
vacmsPageId: "page_e7a846c28908916d8c1db44d"
vacmsRevisionId: "rev_d2e503131402ff878eb98c7c"
---

::note
title: Note
::
sdfsfds
::
`,Pt=`---
publishedDate: "2026-06-25"
series: "dfdfd"
mood: "fdfdfd"
relatedLinks:
  - "fdfdfdf"
tags:
  - "dfdfdfdfdfd"
schema: "{\\"packId\\":\\"post\\",\\"packVersion\\":\\"cms-schema-pack-v1\\"}"
title: "pssppspspspspsps"
summary: "dfdfdfdfdfdfd"
category: "post"
slug: "post/pspspspspspps"
source: "vacms"
vacmsSlug: "pspspspspspps"
vacmsPageId: "page_1b4a51c05e92e27b7cb6e680"
vacmsRevisionId: "rev_f23460a28f2799eea578a3c4"
---

::work-card
id: work-1
title: 222
summary: 2222
href: 2222
status: archived
tags: 22222
::
`,Ft=`---
title: "상품 분류"
slug: "products/categories"
layout: "default"
theme: "showroom"
description: "바룬툴즈 상품 카테고리 안내입니다."
summary: "상품을 카테고리별 매대로 둘러봅니다."
kind: "page"
status: "active"
visibility: "public"
featured: false
order: 21
tags:
  - products
  - store
  - categories
seoTitle: "VARUNTOOLS 상품 분류"
seoDescription: "바룬툴즈 상품을 카테고리별로 둘러봅니다."
---

# 상품 분류

::markdown-box
type: ssot
title: 스토어 분류 인덱스
::
이 페이지는 바룬툴즈 상품 카테고리의 진입점입니다. 실제 상품이 있는 매대는 링크로 열고, 아직 비어 있는 매대는 준비 중 상태로 보여줍니다.
::

::store-nav
title: 상품 분류
intro: 상품을 카테고리별로 둘러봅니다.
mode: categories
showCounts: true
showEmpty: true
includeAllLink: true
::
`,It=`---
title: "템플릿"
slug: "products/categories/templates"
layout: "default"
theme: "showroom"
description: "바룬툴즈 템플릿 상품 카테고리입니다."
summary: "Notion, 문서, 워크플로우 템플릿 계열 상품을 모아봅니다."
kind: "page"
status: "active"
visibility: "public"
featured: false
order: 22
tags:
  - products
  - store
  - category
  - templates
seoTitle: "VARUNTOOLS 템플릿"
seoDescription: "바룬툴즈 템플릿 상품 카테고리입니다."
---

# 템플릿

::store-nav
title: 상품 분류
mode: categories
currentCategory: templates
showCounts: true
showEmpty: true
includeAllLink: true
::

::product-catalog
title: 템플릿
intro: 템플릿 계열 상품을 모아봅니다.
limit: 48
showUnavailable: true
showCategoryFilter: false
showCollectionFilter: true
showSubcategoryFilter: true
defaultCategory: templates
defaultStatus: all
defaultType: all
defaultCollection: all
defaultTag: all
defaultSort: order
emptyTitle: 템플릿 상품이 없습니다
emptyBody: 아직 공개된 템플릿 상품이 없습니다. 전체 상품으로 돌아가거나 문의를 남겨주세요.
::
`,Lt=`---
title: "더미 카탈로그 상품"
description: "나중에 실제 상품으로 첨삭하기 위한 작성용 더미 카탈로그 페이지입니다."
thumbnail: ./images/cover.svg
cover: ./images/cover.svg
slug: products/dummy-catalog
kind: product
status: active
visibility: hidden
robots: "noindex,nofollow"
tags:
  - product
  - dummy
  - catalog
  - template
order: 30
featured: false
series: store-starter
collection: varun-tools
product:
  type: digital
  status: coming-soon
  priceVisible: false
  shippingRequired: false
  showWhenUnavailable: true
  isDemo: false
  readyForCatalog: false
  sku: VT-DUMMY-EDIT-ME
  currency: KRW
  stock: unknown
  checkoutProvider: toss-payments
  downloadProvider: cloudflare
  license: personal
  category: templates
  subcategory: workflow
  series: store-starter
  collection: varun-tools
  material: "디지털 템플릿 샘플"
  size: "편집 전 입력"
  shippingNote: "디지털 상품 샘플이므로 배송이 필요하지 않습니다."
  refundNote: "실제 상품 등록 시 교환 환불 조건을 선배가 첨삭합니다."
  digitalDeliveryNote: "디지털 상품으로 바꾸는 경우 제공 방식을 적습니다."
  policyNote: "이 페이지는 작성용 더미이며 결제 링크가 없습니다."
  inquiryUrl: /inquiry
  checkoutMode: disabled
  claimRedirect: /claim
---

<!--
GENERATED FROM src/content/pages/products/dummy-catalog/page.csv.
Do not edit this file directly.
Run: npm run csv:page -- src/content/pages/products/dummy-catalog/page.csv
-->

# 더미 카탈로그 상품

::markdown-box
type: ssot
title: 첨삭용 더미 페이지
::
이 페이지는 상품 상세 구조와 taxonomy 필터를 눈으로 확인하기 위한 더미입니다. 실제 판매 상품으로 바꿀 때 제목 설명 이미지 가격 상태 링크 정책 메모를 순서대로 교체합니다.
::

::product-cta
::

::product-trust
::

![더미 카탈로그 상품 커버](./images/cover.svg "[필수] 작성용 대표 이미지")

::section-gap
::

## Taxonomy 첨삭 체크리스트

1. category는 상품이 놓일 매대를 고릅니다. 2. type은 제공 방식을 고릅니다. 3. collection은 브랜드나 기획 묶음을 고릅니다. 4. series는 연작이나 세트명을 kebab-case로 입력합니다. 5. tags에는 검색 보조어만 남깁니다.

::gallery-strip
title: 더미 상품 이미지
caption: 대표 이미지와 상세 이미지를 나중에 교체하기 위한 자리입니다.
layout: grid
lightbox: true
::
- ./images/cover.svg | 더미 대표 이미지 | ./images/cover.svg | title=대표컷; tag=dummy
::
`,Rt=`---
title: "상품"
slug: "products"
layout: "default"
theme: "showroom"
description: "바룬툴즈 상품 카탈로그입니다."
summary: "판매 가능 상품과 준비 중인 상품을 모아두는 카탈로그입니다."
kind: "page"
status: "active"
visibility: "public"
featured: false
order: 20
tags:
  - products
  - store
seoTitle: "VARUNTOOLS 상품"
seoDescription: "바룬툴즈 상품 카탈로그입니다."
---

# 상품

::markdown-box
type: ssot
title: 상품 카탈로그
::
바룬툴즈의 판매 가능 상품과 준비 중인 상품을 모아두는 카탈로그입니다.  
Commit 48 기준으로 자체 결제는 구현하지 않고, Toss Payments 결제 링크와 Cloudflare 디지털 다운로드 URL을 상품 메타데이터로 관리합니다.
::

::markdown-box
type: note
title: 스토어 정책
::
상품 가격은 공개한다. \`coming-soon\`과 \`sold-out\` 상태의 상품도 메인/목록 노출 후보로 유지할 수 있다.  
구매는 \`product.checkoutUrl\`에 연결한 Toss Payments 링크를 사용하고, 디지털 상품 다운로드는 추후 \`product.downloadUrl\`에 Cloudflare 연동 URL을 연결한다.
::

::store-nav
title: 상품 분류
intro: 상품을 매대별로 둘러봅니다.
mode: categories
currentCategory: all
showCounts: true
showEmpty: true
includeAllLink: true
::

::product-catalog
title: 상품 카탈로그
intro: 판매 가능 상품과 준비 중인 상품을 검색하고 상태별로 확인합니다.
limit: 48
showUnavailable: true
showCategoryFilter: true
showCollectionFilter: true
showSubcategoryFilter: false
defaultCategory: all
defaultStatus: all
defaultType: all
defaultCollection: all
defaultTag: all
defaultSort: order
emptyTitle: 상품이 없습니다
emptyBody: 필터 조건을 바꾸거나 전체 상품으로 돌아가세요.
::
`,zt=`---
title: "상품 사양 실험장"
description: "상품 스펙 블록, 옵션, 제공 조건 표시를 확인하기 위한 더미 상품 페이지입니다."
thumbnail: ./images/cover.svg
cover: ./images/cover.svg
slug: products/spec-playground
kind: product
robots: "noindex,follow"
tags:
  - demo
  - scaffold
  - spec-test
  - product
order: 999
featured: false
status: active
visibility: hidden
series: store-starter
collection: varun-tools
product:
  type: digital
  status: coming-soon
  price: 0
  priceVisible: false
  shippingRequired: false
  showWhenUnavailable: true
  isDemo: false
  readyForCatalog: false
  sku: DEMO-SPEC-PLAYGROUND
  currency: KRW
  stock: demo
  checkoutProvider: none
  downloadProvider: manual
  license: demo
  category: templates
  subcategory: workflow
  series: store-starter
  collection: varun-tools
  material: "마크다운/디자인 소재"
  size: "demo package"
  shippingNote: "배송이 없는 디지털/서비스형 더미입니다."
  refundNote: "실제 판매 상품이 아니므로 환불 정책 검증용 문구입니다."
  digitalDeliveryNote: "실제 다운로드 링크는 제공하지 않습니다."
  policyNote: "런칭 전 실제 상품으로 교체하거나 삭제할 수 있습니다."
  inquiryUrl: /inquiry
  checkoutMode: disabled
  claimRedirect: /claim
---

<!--
GENERATED FROM src/content/pages/products/spec-playground/page.csv.
Do not edit this file directly.
Run: npm run csv:page -- src/content/pages/products/spec-playground/page.csv
-->


`,Bt=`---
title: "EWA Fixture Gallery"
description: "EWA gallery processor QA page. This page is hidden and noindex."
thumbnail: /qa/ewa-fixtures/qa-cover.svg
cover: /qa/ewa-fixtures/qa-cover.svg
slug: qa/ewa-gallery
kind: lab
status: active
visibility: hidden
robots: "noindex,follow"
noindex: true
featured: false
tags:
  - qa
  - ewa
  - fixture
  - media
order: 999
---

<!--
GENERATED FROM src/content/pages/qa/ewa-gallery/page.csv.
Do not edit this file directly.
Run: npm run csv:page -- src/content/pages/qa/ewa-gallery/page.csv
-->

# EWA Fixture Gallery

::markdown-box
type: ssot
title: QA SSOT
::
This page is a hidden noindex fixture for EWA gallery QA. It is not a portfolio work. It must stay excluded from sitemap page search tag index and publish gate.
::

Enable QA with localStorage.setItem('vt:ewa-debug' 'true') and localStorage.setItem('vt:ewa-compare' 'split').

Force rollout with localStorage.setItem('vt:ewa-rollout' 'enabled') then test adaptive with localStorage.setItem('vt:ewa-mode' 'adaptive-tile').

Test low tier downgrade with localStorage.setItem('vt:ewa-tier' 'low'). Test cooldown with sessionStorage.setItem('vt:ewa-health' 'cooldown').

::case-gallery
title: EWA Scenario Gallery
caption: 각 이미지를 라이트박스에서 열고 EWA 진단 정보를 확인합니다.
variant: framed
columns: 2
captionStyle: below
::
- /qa/ewa-fixtures/photo-like.svg | Photo preset should avoid over-smoothing |  | alt=Photo fixture; media.ewaPreset=photo; media.ewaMode=basic; media.ewaNote=Photo EWA baseline; label=Photo
- /qa/ewa-fixtures/ui-screenshot.svg | Check small text and thin border ringing |  | alt=UI screenshot fixture; media.ewaPreset=ui-low-ring; media.ewaMode=adaptive-tile; media.ewaNote=Check text and thin borders; label=UI
- /qa/ewa-fixtures/line-art.svg | Check thin lines and halo |  | alt=Line art fixture; media.ewaPreset=line-art; media.ewaMode=adaptive-tile; label=Line
- /qa/ewa-fixtures/pixel-safe.svg | Pixel safe should use original fallback |  | alt=Pixel safe fixture; media.ewaPreset=pixel-safe; media.pixelSafe=true; label=Pixel
- /qa/ewa-fixtures/ui-disabled.svg | Explicit disabled metadata overrides rollout enabled |  | alt=EWA disabled fixture; media.ewaEnabled=false; media.ewaPreset=ui-low-ring; label=Disabled
- /qa/ewa-fixtures/ui-budget.svg | Adaptive request should downgrade under low budget |  | alt=Budget downgrade fixture; media.ewaPreset=ui-low-ring; media.ewaMode=adaptive-tile; media.ewaNote=Set vt:ewa-tier low to test downgrade; label=Budget
::

::markdown-box
type: tip
title: Reset QA flags
::
Run localStorage.removeItem('vt:ewa-debug') localStorage.removeItem('vt:ewa-compare') localStorage.removeItem('vt:ewa-rollout') localStorage.removeItem('vt:ewa-mode') localStorage.removeItem('vt:ewa-tier') and sessionStorage.removeItem('vt:ewa-health') after QA.
::
`,Vt=`---
title: "전후 비교 와이퍼"
slug: "wiper"
layout: "tool"
theme: "showroom"
description: "전후 비교 와이퍼 도구"
summary: "이미지 전후를 비교하는 쇼룸형 와이퍼 컴포넌트"
kind: "tool"
status: "active"
visibility: "public"
featured: true
order: 3
date: "2026-04-26"
updated: "2026-04-26"
series: "markdown-tools"
related:
  - lab-markdown-gallery
cover: "./images/cover.svg"
cardTitle: "전후 비교 와이퍼"
cardDescription: "이미지 비교를 위한 전후 슬라이더 도구"
cardCover: "./images/cover.svg"
tags:
  - tool
  - image
  - markdown
work:
  type: "tool"
  category: "tool"
  status: "published"
  featured: true
  weight: 60
  year: 2026
  role:
    - "designer"
    - "developer"
  stack:
    - "typescript"
    - "vue"
    - "css"
    - "markdown"
  tags:
    - "image"
    - "comparison"
    - "tool"
seoTitle: "전후 비교 와이퍼"
seoDescription: "이미지 전후를 비교하는 VARUNTOOLS 와이퍼 도구입니다."
ogImage: "./images/cover.svg"
---

# 전후 비교 와이퍼

이미지 전후를 비교하는 와이퍼 도구입니다.

::section-gap
size: sm
::

## 데모

::before-after
before: ./images/before.svg
after: ./images/after.svg
caption: 보정 전후 비교
initial: 50
::

::section-break
label: 사용법
tone: quiet
::

## 작성 규칙

신규 Markdown 콘텐츠에서는 \`[전]\`, \`[후]\` 마커보다 \`::before-after\` directive를 우선 사용합니다.

### 기존 문법 호환

기존 Super/Notion 마커 파서는 후속 legacy adapter 커밋에서 따로 흡수합니다.
`,Ht=`---
title: "Editorial Block Showcase"
slug: "works/editorial-showcase"
layout: "default"
theme: "showroom"
description: "제목 계층과 반응형 컬럼 레이아웃을 확인하는 포트폴리오 편집 블록 미리보기 화면입니다."
summary: "대제목, 중제목, 소제목, 2/3칼럼 조판을 한 화면에서 검수하기 위한 숨김 쇼케이스 페이지."
kind: "work"
status: "active"
visibility: "hidden"
featured: false
order: 125
cardTitle: "Editorial Block Showcase"
cardDescription: "포트폴리오 편집 블록 미리보기 화면."
tags:
  - portfolio
  - editorial
  - qa
work:
  type: "system"
  status: "private"
  featured: false
  weight: 0
  year: 2026
  role:
    - "Editorial system"
  stack:
    - "Markdown"
    - "Vue"
    - "CSS Grid"
  tags:
    - "portfolio"
    - "editorial"
    - "preview"
---

# Editorial Block Showcase

::editorial-title
level: major
as: h2
kicker: EDITORIAL SYSTEM
title: 포트폴리오를 문서가 아니라 편집물처럼 세우는 방법
subtitle: 대제목, 중제목, 소제목, 칼럼 조판을 통해 프로젝트의 사고 구조를 한 화면에서 검수한다.
::

이 페이지는 공개 작품 설명이 아니라, portfolio editorial block을 실제 렌더링 흐름에서 확인하기 위한 preview surface입니다.

::editorial-title
level: middle
as: h3
title: 제목 계층 Preview
subtitle: visual level과 실제 heading tag를 분리해 문서 순서를 보존합니다.
::

::editorial-title
level: minor
as: h4
title: 칼럼 내부의 짧은 판단 단위
::

소제목은 카드나 칼럼 내부에서 작은 판단 단위를 고정할 때 사용합니다. 과한 여백 없이 본문 흐름에 붙어야 합니다.

::editorial-title
level: middle
as: h3
title: 문제와 해결 2칼럼
subtitle: 비교가 필요한 구간은 좌우 구조로 짧게 접어 독자의 시선을 붙잡습니다.
::

::editorial-columns
cols: 2
gap: md
collapse: mobile
::
### 문제

프로젝트 설명이 긴 문단으로만 이어지면 독자는 핵심 판단 구조를 놓치기 쉽습니다.

---
### 해결

문제와 해결을 나란히 배치해 시선이 비교하고, 머리가 정리할 수 있는 구조를 만듭니다.
::

::editorial-title
level: middle
as: h3
title: 감정 / 구조 / 기술 3칼럼
subtitle: 선배식 판단 스택을 포트폴리오 화면에 직접 세우는 preview입니다.
::

::editorial-columns
cols: 3
gap: lg
collapse: tablet
::
### 감정

사용자가 먼저 느끼는 압력과 결핍을 놓치지 않습니다.

---
### 구조

그 감각이 머물 수 있도록 정보 흐름과 상태 귀속 위치를 나눕니다.

---
### 기술

그 구조를 실제로 작동시키는 렌더링, 저장, 검증 로직으로 봉인합니다.
::

::editorial-title
level: middle
as: h3
title: Long Text Preview
subtitle: 긴 제목과 긴 본문이 들어와도 column은 화면 밖으로 도망가지 않아야 합니다.
::

::editorial-columns
cols: 3
gap: md
collapse: tablet
::
### 긴 제목 후보

아주 긴 문장이 들어와도 텍스트는 column 내부에서 줄바꿈되어야 하며, layout은 수평 스크롤을 만들지 않아야 합니다.

---
### 긴 토큰 후보

https://varun.tools/portfolio/editorial-showcase/very-long-token-that-should-wrap-inside-the-column-without-breaking-the-grid

---
### 기존 heading 혼용

일반 Markdown heading과 editorial block은 서로를 대체하지 않고, 필요한 장면에서만 함께 사용합니다.
::
`,Ut=`---
title: "작업"
slug: "works"
layout: "default"
theme: "showroom"
description: "작업 목록 설명 문서"
summary: "감정, 구조, 기술을 하나의 흐름으로 읽는 VARUNTOOLS 대표 작업 인덱스"
kind: "page"
status: "active"
featured: false
order: 2
---

# Works
<!-- # Works -->

::editorial-title
level: major
as: h2
kicker: 대표 작업
title: 감정과 구조를 실제 도구로 바꾸는 작업들
subtitle: 글, 색, 자동화, 인터페이스를 하나의 작동 구조로 엮어 실험하고 구현하는 VARUNTOOLS 작업 인덱스.
::

이 페이지는 결과물의 목록을 늘어놓기보다, 각 작업이 어떤 감각에서 출발해 어떤 구조로 고정되고 어떤 기술로 작동했는지를 읽을 수 있게 정리한 입구입니다.

::editorial-columns
cols: 3
gap: lg
collapse: tablet
::
### 감정

먼저 흔들리는 감각과 결핍을 붙잡습니다. 불편함, 막힘, 색의 압력, 문장의 흐림처럼 말로만 남기 쉬운 신호를 작업의 출발점으로 둡니다.

---
### 구조

그 감각이 사라지지 않도록 콘텐츠, 데이터, 상태 귀속 위치를 나눕니다. 무엇이 SSOT이고 무엇이 화면 상태인지 분리해 작업의 뼈대를 세웁니다.

---
### 기술

구조를 실제 화면과 코드로 작동시킵니다. 마크다운 directive, 검증 스크립트, worker/API, 배포 가능한 파일까지 연결해 결과를 남깁니다.
::

![작업 미리보기](./images/work-preview.gif)

::editorial-title
level: middle
as: h3
title: 대표 작업
subtitle: 가장 먼저 보여줄 작업은 결과물의 크기가 아니라, 판단 구조가 선명한 것부터 배치합니다.
::

::featured-works
title: 전체 대표 작업
limit: 12
::

::editorial-title
level: middle
as: h3
title: 작업을 읽는 기준
subtitle: 포트폴리오의 핵심은 무엇을 만들었는지가 아니라, 왜 그렇게 구조화했는지를 보여주는 데 있습니다.
::

::editorial-columns
cols: 2
gap: md
collapse: mobile
::
### 문제

작업이 늘어나면 목록은 금방 평평해집니다. 카드가 많아질수록 어떤 감각이 문제였고, 어떤 구조로 해결했는지 방문자는 뒤로 밀린 정보처럼 읽게 됩니다.

---
### 해결

대표 작업은 editorial heading으로 진입감을 만들고, 비교가 필요한 설명은 2칼럼으로 접어 읽기 리듬을 세웁니다. 결과물은 카드로, 판단 과정은 조판으로 분리합니다.
::

::editorial-title
level: middle
as: h3
title: 작업 탐색
subtitle: 도구, 실험, 쇼룸 페이지는 같은 흐름 안에서 서로의 맥락을 밀어주는 탐색 구조로 이어집니다.
::

::pagecard-grid
items:
  - /wiper
  - /lab-markdown-gallery
columns: auto
::

::pagecard-grid
query: markdown
limit: 4
sort: order
columns: compact
::

::editorial-title
level: minor
as: h4
title: Manual Card Example
::

::work-card
slug: wiper
::

### Preview Loop

짧은 GIF는 썸네일용으로만 사용하고, 긴 움직임은 WebM으로 분리합니다. 목록에서는 시선을 붙잡고, 상세에서는 실제 작동 리듬을 보여주는 방식으로 역할을 나눕니다.
`,Wt=`---
title: "VARUNTOOLS 쇼룸 시스템"
slug: "works/varuntools-showroom"
layout: "default"
theme: "showroom"
description: "바룬툴즈 홈페이지와 스토어 카탈로그 구조를 정리한 쇼룸 시스템 작업입니다."
summary: "홈, 작업, 도구, 실험, 상품 카탈로그를 하나의 콘텐츠 구조로 묶은 VARUNTOOLS 쇼룸 시스템."
kind: "work"
status: "active"
visibility: "public"
featured: true
order: 1
cover: "./images/cover.svg"
thumbnail: "./images/cover.svg"
cardTitle: "VARUNTOOLS 쇼룸"
cardDescription: "홈페이지와 스토어 카탈로그를 함께 운영하기 위한 콘텐츠 쇼룸 구조."
cardCover: "./images/cover.svg"
tags:
  - work
  - homepage
  - store
  - system
work:
  type: "system"
  category: "system"
  status: "published"
  featured: true
  weight: 90
  year: 2026
  role:
    - "designer"
    - "developer"
    - "system-architect"
  stack:
    - "typescript"
    - "vue"
    - "markdown"
    - "cloudflare"
    - "css"
  tags:
    - "portfolio"
    - "showroom"
    - "content-system"
seoTitle: "VARUNTOOLS 쇼룸 시스템"
seoDescription: "VARUNTOOLS 홈페이지와 스토어 카탈로그 구조 작업 기록입니다."
ogImage: "./images/cover.svg"
---

# VARUNTOOLS Showroom System
<!-- # VARUNTOOLS Showroom System -->

::editorial-title
level: major
as: h2
kicker: FEATURED WORK
title: VARUNTOOLS 쇼룸 시스템
subtitle: 홈페이지, 작업 기록, 실험실, 상품 카탈로그를 하나의 콘텐츠 동선으로 묶어 개인 작업실의 구조를 보여주는 쇼룸 시스템.
::

::markdown-box
type: ssot
title: 작업 요약
::
VARUNTOOLS는 포트폴리오, 도구, 실험, 상품 카탈로그를 한 구조 안에 묶는 개인 작업실형 홈페이지입니다. 이 페이지는 그 구조가 단순한 메뉴 묶음이 아니라, 작업자의 판단 흐름을 방문자가 따라갈 수 있게 만드는 쇼룸 시스템임을 설명합니다.
::

::editorial-columns
cols: 3
gap: lg
collapse: tablet
::
### 감정

흩어진 작업들이 단순 목록으로 밀려나지 않게 붙잡았습니다. 방문자가 결과만 훑고 지나가는 대신, 작업자의 감각과 방향성이 남아 있는 전시장처럼 읽히는 상태를 목표로 삼았습니다.

---
### 구조

홈, 작업, 도구, 실험, 상품 카탈로그를 분리하되 같은 콘텐츠 파이프라인 안에서 연결했습니다. 각 페이지는 독립적으로 보이지만, 메타데이터와 카드 흐름은 하나의 쇼룸 규칙을 공유합니다.

---
### 기술

Markdown directive, page metadata, 카드 그리드, smoke 검증을 엮어 실제 배포 가능한 구조로 고정했습니다. 보여주는 화면과 검증 가능한 콘텐츠 규칙을 같은 레이어에서 관리합니다.
::

::editorial-title
level: middle
as: h3
title: 문제와 해결
subtitle: 포트폴리오는 결과물 목록이 아니라, 작업 방식이 어떻게 반복 가능한 구조가 되었는지 보여주는 증거여야 합니다.
::

::editorial-columns
cols: 2
gap: md
collapse: mobile
::
### 문제

포트폴리오, 상품, 실험, 도구가 서로 다른 페이지로 흩어지면 방문자는 결과만 보고 판단 구조를 놓치기 쉽습니다. 작업은 많은데, 그것들이 왜 같은 세계에 있는지 설명하는 축이 사라집니다.

---
### 해결

각 콘텐츠를 같은 쇼룸 문법으로 묶고, 대표 작업과 상품 카탈로그가 서로를 밀어주는 탐색 흐름을 만들었습니다. 페이지는 나뉘지만, 방문자가 읽는 방향은 하나의 작업실을 통과하듯 이어집니다.
::

::editorial-title
level: middle
as: h3
title: 쇼룸이 고정하는 것
subtitle: 이 시스템은 예쁜 목록이 아니라, 작업의 공개 기준과 검증 가능한 콘텐츠 흐름을 함께 붙잡는 장치입니다.
::

::editorial-columns
cols: 3
gap: md
collapse: tablet
::
### 전시 밀도

대표 작업, 실험, 상품 후보가 서로 고립되지 않도록 최소한의 전시 밀도를 유지합니다.

---
### 작성 흐름

Markdown을 기본으로 두고 필요한 곳에만 directive를 얹어, 글을 쓰는 손맛과 구조화된 렌더링을 동시에 유지합니다.

---
### 검증 루프

카드, 메타데이터, 링크, 검색, editorial block이 smoke로 묶여 콘텐츠가 조용히 깨지는 일을 줄입니다.
::

::editorial-title
level: minor
as: h4
title: Seed Work 기준
::

::markdown-box
type: note
title: Commit 50-0 Seed
::
이 페이지는 실제 판매 상품을 임의로 만들지 않으면서 대표 작업 섹션의 최소 전시 밀도를 확보하기 위한 seed work입니다. 없는 상품을 꾸며내지 않고, 실제 구조와 공개 가능한 작업 단위만 전시 대상으로 삼습니다.
::
`,Gt=/^!\[(?<alt>[^\]]*)\]\((?<target>.*)\)\s*$/,Kt=/^\s*\[(?<kind>전|후)\]\s*(?<label>.*)?$/,qt=/^\s*(```|~~~)/,Jt=1,Yt=3;function Xt(e){return qt.test(e)}function Zt(e){return e.trim().length===0}function Qt(e){let t=e.match(Kt);return t?.groups?.kind?{kind:t.groups.kind,label:(t.groups.label||``).trim()}:null}function $t(e){let t=e.trim();if(!t)return null;let n=t.match(/^(?<src>.+?)\s+["'](?<title>.*)["']\s*$/);return n?.groups?.src?{src:n.groups.src.trim(),title:(n.groups.title||``).trim()}:{src:t,title:``}}function en(e){let t=e.match(Gt);if(!t?.groups?.target)return null;let n=$t(t.groups.target);return n?.src?{alt:t.groups.alt||``,src:n.src,title:n.title}:null}function tn(e){return Qt(e)}function nn(e,t){let n=en(e[t]||``);if(!n)return null;let r=tn(n.title);if(r)return{kind:r.kind,src:n.src,label:r.label,startLine:t+1,endLine:t+1,nextIndex:t+1};let i=t+1,a=0;for(;i<e.length&&Zt(e[i]||``)&&a<Jt;)i+=1,a+=1;let o=Qt(e[i]||``);return o?{kind:o.kind,src:n.src,label:o.label,startLine:t+1,endLine:i+1,nextIndex:i+1}:null}function rn(e,t){let n=[e.label,t.label].filter(Boolean),r=[`::before-after`,`before: ${e.src}`,`after: ${t.src}`];return n.length&&r.push(`caption: ${n.join(` / `)}`),r.push(`initial: 50`),r.push(`::`),r.join(`
`)}function an(e,t){let n=t,r=0;for(;n<e.length&&Zt(e[n]||``);)n+=1,r+=1;return{index:n,blanks:r}}function on(e){let t=e.replace(/\r\n/g,`
`).split(`
`),n=[],r=[],i={changed:!1,items:[]},a=0,o=!1,s=0;for(;s<t.length;){let e=t[s]||``;if(Xt(e)){o=!o,n.push(e),s+=1;continue}if(o){n.push(e),s+=1;continue}let c=nn(t,s);if(!c){let t=Qt(e);t&&r.push({code:t.kind===`전`?`missing_before_image`:`orphan_after_marker`,line:s+1,message:`Legacy [${t.kind}] marker is not directly attached to a preceding image.`}),n.push(e),s+=1;continue}if(c.kind===`후`){r.push({code:`orphan_after_marker`,line:c.startLine,message:`Legacy [후] image group appeared without a preceding [전] group.`}),n.push(...t.slice(s,c.nextIndex)),s=c.nextIndex;continue}let l=an(t,c.nextIndex),u=nn(t,l.index);if(!u){let e=t.slice(c.nextIndex,Math.min(t.length,c.nextIndex+Yt+2)).findIndex(e=>!!Qt(e));r.push({code:e>=0?`unsupported_marker_distance`:`missing_after_image`,line:c.startLine,message:`Legacy [전] image group could not be paired with a safe [후] image group.`}),n.push(...t.slice(s,c.nextIndex)),s=c.nextIndex;continue}if(l.blanks>Yt){r.push({code:`unsupported_marker_distance`,line:u.startLine,message:`Legacy [전]/[후] image groups are too far apart for safe conversion.`}),n.push(...t.slice(s,c.nextIndex)),s=c.nextIndex;continue}if(u.kind!==`후`){r.push({code:`ambiguous_before_after_group`,line:u.startLine,message:`Legacy [전] group was followed by another [전] group; conversion skipped.`}),n.push(...t.slice(s,c.nextIndex)),s=c.nextIndex;continue}let d=rn(c,u);n.push(d),i.changed=!0,i.items.push({kind:`before-after-legacy-marker`,line:c.startLine,token:`[전]/[후]`,output:d}),a+=1,s=u.nextIndex}return{content:n.join(`
`),report:i,converted:a,warnings:r}}var sn=/^\s*(```|~~~)/,cn=/^\s*>\s*\[!(?<type>note|tip|warning|danger|quote|decision|ssot)\]\s*(?<title>.*)$/i,ln=/^\s*>\s?(?<body>.*)$/;function un(e){return sn.test(e)}function dn(e){return e.trim().length===0}function fn(e){return e.match(ln)?.groups?.body??null}function pn(e,t,n){let r=[`::markdown-box`,`type: ${e}`];return t.trim()&&r.push(`title: ${t.trim()}`),r.push(`::`),r.push(...n),r.push(`::`),r.join(`
`)}function mn(e){let t=e.replace(/\r\n/g,`
`).split(`
`),n=[],r=[],i={changed:!1,items:[]},a=0,o=!1,s=0;for(;s<t.length;){let e=t[s]||``;if(un(e)){o=!o,n.push(e),s+=1;continue}if(o){n.push(e),s+=1;continue}let c=e.match(cn);if(!c?.groups?.type){n.push(e),s+=1;continue}let l=c.groups.type.toLowerCase(),u=c.groups.title.trim(),d=[],f=s+1;for(;f<t.length;){let e=t[f]||``;if(dn(e))break;let n=fn(e);if(n===null)break;d.push(n),f+=1}if(!u&&!d.some(e=>e.trim())){r.push({code:`empty_box_callout`,line:s+1,message:`Legacy markdown-box callout did not include a title or body.`}),n.push(e),s+=1;continue}let p=pn(l,u,d);n.push(p),i.changed=!0,i.items.push({kind:`box-legacy-callout`,line:s+1,token:`[!${l}]`,output:p}),a+=1,s=f}return{content:n.join(`
`),report:i,converted:a,warnings:r}}var hn=/^\s*(```|~~~)/,gn=/^\s*>\s*\[\[(?<href>[^\]]+)\]\]\s*$/,_n=/^\s*>\s*\[!pagecards\]\s*$/i,vn=/^\s*>\s*(?<href>\/[A-Za-z0-9가-힣._~/-]+)\s*$/,yn=/^\s*\[pagecards\]\s*$/i,bn=/^\s*-\s*(?<href>\/[A-Za-z0-9가-힣._~/-]+)\s*$/;function xn(e){return hn.test(e)}function Sn(e){return e.trim().length===0}function Cn(e){return/^\/[A-Za-z0-9가-힣._~/-]+$/.test(e.trim())}function wn(e){return[`::pagecard-grid`,`items:`,...e.map(e=>`  - ${e}`),`::`].join(`
`)}function Tn(e,t){let n=e[t]||``;if(!gn.test(n))return null;let r=[],i=t;for(;i<e.length;){let t=(e[i]||``).match(gn);if(!t?.groups?.href)break;let n=t.groups.href.trim();if(!Cn(n))break;r.push(n),i+=1}return r.length?{items:r,nextIndex:i}:null}function En(e,t){if(!_n.test(e[t]||``))return null;let n=[],r=t+1;for(;r<e.length;){let t=e[r]||``;if(Sn(t))break;let i=t.match(vn);if(!i?.groups?.href)break;let a=i.groups.href.trim();if(!Cn(a))break;n.push(a),r+=1}return{items:n,nextIndex:r}}function Dn(e,t){if(!yn.test(e[t]||``))return null;let n=[],r=t+1;for(;r<e.length;){let t=e[r]||``;if(Sn(t))break;let i=t.match(bn);if(!i?.groups?.href)break;let a=i.groups.href.trim();if(!Cn(a))break;n.push(a),r+=1}return{items:n,nextIndex:r}}function On(e){let t=e.replace(/\r\n/g,`
`).split(`
`),n=[],r=[],i={changed:!1,items:[]},a=0,o=!1,s=0;for(;s<t.length;){let e=t[s]||``;if(xn(e)){o=!o,n.push(e),s+=1;continue}if(o){n.push(e),s+=1;continue}let c=Tn(t,s)||En(t,s)||Dn(t,s);if(!c){n.push(e),s+=1;continue}if(!c.items.length){r.push({code:`empty_pagecard_group`,line:s+1,message:`Legacy pagecard marker did not include any valid href entries.`}),n.push(...t.slice(s,c.nextIndex)),s=Math.max(c.nextIndex,s+1);continue}let l=wn(c.items);n.push(l),i.changed=!0,i.items.push({kind:`pagecard-legacy-marker`,line:s+1,token:`pagecards`,output:l}),a+=1,s=c.nextIndex}return{content:n.join(`
`),report:i,converted:a,warnings:r}}var kn=`[문단끝]`,An=/^\s*\[문단끝\]\s*$/,jn=/^\s*\[문단끝\]\s*(.+)$/;function Mn(){return[`::section-gap`,`size: md`,`::`].join(`
`)}function Nn(e){let t=e.trim();return t.startsWith("```")||t.startsWith(`~~~`)}function Pn(e){let t=e.replace(/\r\n/g,`
`).split(`
`),n=[],r={changed:!1,items:[]},i=!1;return t.forEach((e,t)=>{if(Nn(e)){i=!i,n.push(e);return}if(i){n.push(e);return}if(An.test(e)){let e=Mn();n.push(e),r.changed=!0,r.items.push({kind:`section-gap-token`,line:t+1,token:kn,output:e});return}let a=e.match(jn);if(a){let e=Mn(),i=a[1].trim();n.push(e),n.push(``),n.push(i),r.changed=!0,r.items.push({kind:`section-gap-token`,line:t+1,token:kn,output:e});return}n.push(e)}),{content:n.join(`
`),report:r}}function Fn(...e){return{changed:e.some(e=>e.changed),items:e.flatMap(e=>e.items)}}function In(e){let t=Pn(e),n=on(t.content),r=On(n.content),i=mn(r.content);return{content:i.content,report:Fn(t.report,n.report,r.report,i.report)}}function Ln(e){let t=e.trim();return t.startsWith(`"`)&&t.endsWith(`"`)||t.startsWith(`'`)&&t.endsWith(`'`)?t.slice(1,-1):t}function Rn(e){let t=e.trim();return t===``?``:t===`true`?!0:t===`false`?!1:t===`null`?null:/^-?\d+(?:\.\d+)?$/.test(t)?Number(t):Ln(t)}function zn(e){let t=e.trim();if(!t.startsWith(`[`)||!t.endsWith(`]`))return null;let n=t.slice(1,-1).trim();return n?n.split(`,`).map(e=>Rn(e.trim())):[]}function Bn(e){return e.match(/^\s*/)?.[0].length||0}function Vn(e){let t={},n=e.split(/\r?\n/);for(let e=0;e<n.length;e+=1){let r=n[e];if(!r.trim()||r.trimStart().startsWith(`#`))continue;let i=r.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);if(!i)continue;let[,a,o]=i,s=zn(o);if(s){t[a]=s;continue}if(o.trim()!==``){t[a]=Rn(o);continue}let c=[],l={},u=e+1;for(;u<n.length;){let e=n[u];if(!e.trim()){u+=1;continue}if(Bn(e)===0)break;let t=e.match(/^\s+-\s*(.*)$/);if(t){c.push(Rn(t[1])),u+=1;continue}let r=e.match(/^\s+([A-Za-z0-9_-]+):\s*(.*)$/);if(r){let[,e,t]=r;l[e]=zn(t)||Rn(t),u+=1;continue}break}c.length>0?(t[a]=c,e=u-1):Object.keys(l).length>0?(t[a]=l,e=u-1):t[a]=``}return t}function Hn(e){let t=String(e||``),n=t.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);return n?{frontmatter:Vn(n[1]),content:n[2]}:{frontmatter:{},content:t}}var Un={};function Wn(e){let t=Un[e];if(t)return t;t=Un[e]=[];for(let e=0;e<128;e++){let n=String.fromCharCode(e);t.push(n)}for(let n=0;n<e.length;n++){let r=e.charCodeAt(n);t[r]=`%`+(`0`+r.toString(16).toUpperCase()).slice(-2)}return t}function Gn(e,t){typeof t!=`string`&&(t=Gn.defaultChars);let n=Wn(t);return e.replace(/(%[a-f0-9]{2})+/gi,function(e){let t=``;for(let r=0,i=e.length;r<i;r+=3){let a=parseInt(e.slice(r+1,r+3),16);if(a<128){t+=n[a];continue}if((a&224)==192&&r+3<i){let n=parseInt(e.slice(r+4,r+6),16);if((n&192)==128){let e=a<<6&1984|n&63;e<128?t+=`��`:t+=String.fromCharCode(e),r+=3;continue}}if((a&240)==224&&r+6<i){let n=parseInt(e.slice(r+4,r+6),16),i=parseInt(e.slice(r+7,r+9),16);if((n&192)==128&&(i&192)==128){let e=a<<12&61440|n<<6&4032|i&63;e<2048||e>=55296&&e<=57343?t+=`���`:t+=String.fromCharCode(e),r+=6;continue}}if((a&248)==240&&r+9<i){let n=parseInt(e.slice(r+4,r+6),16),i=parseInt(e.slice(r+7,r+9),16),o=parseInt(e.slice(r+10,r+12),16);if((n&192)==128&&(i&192)==128&&(o&192)==128){let e=a<<18&1835008|n<<12&258048|i<<6&4032|o&63;e<65536||e>1114111?t+=`����`:(e-=65536,t+=String.fromCharCode(55296+(e>>10),56320+(e&1023))),r+=9;continue}}t+=`�`}return t})}Gn.defaultChars=`;/?:@&=+$,#`,Gn.componentChars=``;var Kn={};function qn(e){let t=Kn[e];if(t)return t;t=Kn[e]=[];for(let e=0;e<128;e++){let n=String.fromCharCode(e);/^[0-9a-z]$/i.test(n)?t.push(n):t.push(`%`+(`0`+e.toString(16).toUpperCase()).slice(-2))}for(let n=0;n<e.length;n++)t[e.charCodeAt(n)]=e[n];return t}function Jn(e,t,n){typeof t!=`string`&&(n=t,t=Jn.defaultChars),n===void 0&&(n=!0);let r=qn(t),i=``;for(let t=0,a=e.length;t<a;t++){let o=e.charCodeAt(t);if(n&&o===37&&t+2<a&&/^[0-9a-f]{2}$/i.test(e.slice(t+1,t+3))){i+=e.slice(t,t+3),t+=2;continue}if(o<128){i+=r[o];continue}if(o>=55296&&o<=57343){if(o>=55296&&o<=56319&&t+1<a){let n=e.charCodeAt(t+1);if(n>=56320&&n<=57343){i+=encodeURIComponent(e[t]+e[t+1]),t++;continue}}i+=`%EF%BF%BD`;continue}i+=encodeURIComponent(e[t])}return i}Jn.defaultChars=`;/?:@&=+$,-_.!~*'()#`,Jn.componentChars=`-_.!~*'()`;function Yn(e){let t=``;return t+=e.protocol||``,t+=e.slashes?`//`:``,t+=e.auth?e.auth+`@`:``,e.hostname&&e.hostname.indexOf(`:`)!==-1?t+=`[`+e.hostname+`]`:t+=e.hostname||``,t+=e.port?`:`+e.port:``,t+=e.pathname||``,t+=e.search||``,t+=e.hash||``,t}function Xn(){this.protocol=null,this.slashes=null,this.auth=null,this.port=null,this.hostname=null,this.hash=null,this.search=null,this.pathname=null}var Zn=/^([a-z0-9.+-]+:)/i,Qn=/:[0-9]*$/,$n=/^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,er=[`%`,`/`,`?`,`;`,`#`,`'`,`{`,`}`,`|`,`\\`,`^`,"`",`<`,`>`,`"`,"`",` `,`\r`,`
`,`	`],tr=[`/`,`?`,`#`],nr=255,rr=/^[+a-z0-9A-Z_-]{0,63}$/,ir=/^([+a-z0-9A-Z_-]{0,63})(.*)$/,ar={javascript:!0,"javascript:":!0},or={http:!0,https:!0,ftp:!0,gopher:!0,file:!0,"http:":!0,"https:":!0,"ftp:":!0,"gopher:":!0,"file:":!0};function sr(e,t){if(e&&e instanceof Xn)return e;let n=new Xn;return n.parse(e,t),n}Xn.prototype.parse=function(e,t){let n,r,i,a=e;if(a=a.trim(),!t&&e.split(`#`).length===1){let e=$n.exec(a);if(e)return this.pathname=e[1],e[2]&&(this.search=e[2]),this}let o=Zn.exec(a);if(o&&(o=o[0],n=o.toLowerCase(),this.protocol=o,a=a.substr(o.length)),(t||o||a.match(/^\/\/[^@\/]+@[^@\/]+/))&&(i=a.substr(0,2)===`//`,i&&!(o&&ar[o])&&(a=a.substr(2),this.slashes=!0)),!ar[o]&&(i||o&&!or[o])){let e=-1;for(let t=0;t<tr.length;t++)r=a.indexOf(tr[t]),r!==-1&&(e===-1||r<e)&&(e=r);let t,n;n=e===-1?a.lastIndexOf(`@`):a.lastIndexOf(`@`,e),n!==-1&&(t=a.slice(0,n),a=a.slice(n+1),this.auth=t),e=-1;for(let t=0;t<er.length;t++)r=a.indexOf(er[t]),r!==-1&&(e===-1||r<e)&&(e=r);e===-1&&(e=a.length),a[e-1]===`:`&&e--;let i=a.slice(0,e);a=a.slice(e),this.parseHost(i),this.hostname=this.hostname||``;let o=this.hostname[0]===`[`&&this.hostname[this.hostname.length-1]===`]`;if(!o){let e=this.hostname.split(/\./);for(let t=0,n=e.length;t<n;t++){let n=e[t];if(n&&!n.match(rr)){let r=``;for(let e=0,t=n.length;e<t;e++)n.charCodeAt(e)>127?r+=`x`:r+=n[e];if(!r.match(rr)){let r=e.slice(0,t),i=e.slice(t+1),o=n.match(ir);o&&(r.push(o[1]),i.unshift(o[2])),i.length&&(a=i.join(`.`)+a),this.hostname=r.join(`.`);break}}}}this.hostname.length>nr&&(this.hostname=``),o&&(this.hostname=this.hostname.substr(1,this.hostname.length-2))}let s=a.indexOf(`#`);s!==-1&&(this.hash=a.substr(s),a=a.slice(0,s));let c=a.indexOf(`?`);return c!==-1&&(this.search=a.substr(c),a=a.slice(0,c)),a&&(this.pathname=a),or[n]&&this.hostname&&!this.pathname&&(this.pathname=``),this},Xn.prototype.parseHost=function(e){let t=Qn.exec(e);t&&(t=t[0],t!==`:`&&(this.port=t.substr(1)),e=e.substr(0,e.length-t.length)),e&&(this.hostname=e)};var cr=g({decode:()=>Gn,encode:()=>Jn,format:()=>Yn,parse:()=>sr}),lr=/[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/,ur=/[\0-\x1F\x7F-\x9F]/,dr=/[\xAD\u0600-\u0605\u061C\u06DD\u070F\u0890\u0891\u08E2\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]|\uD804[\uDCBD\uDCCD]|\uD80D[\uDC30-\uDC3F]|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|\uDB40[\uDC01\uDC20-\uDC7F]/,fr=/[!-#%-\*,-\/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061D-\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1B7D\u1B7E\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4F\u2E52-\u2E5D\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDEAD\uDF55-\uDF59\uDF86-\uDF89]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5A\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDEB9\uDF3C-\uDF3E]|\uD806[\uDC3B\uDD44-\uDD46\uDDE2\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2\uDF00-\uDF09]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8\uDF43-\uDF4F\uDFFF]|\uD809[\uDC70-\uDC74]|\uD80B[\uDFF1\uDFF2]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDE97-\uDE9A\uDFE2]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]/,pr=/[\$\+<->\^`\|~\xA2-\xA6\xA8\xA9\xAC\xAE-\xB1\xB4\xB8\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u03F6\u0482\u058D-\u058F\u0606-\u0608\u060B\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u07FE\u07FF\u0888\u09F2\u09F3\u09FA\u09FB\u0AF1\u0B70\u0BF3-\u0BFA\u0C7F\u0D4F\u0D79\u0E3F\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u166D\u17DB\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u2044\u2052\u207A-\u207C\u208A-\u208C\u20A0-\u20C0\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F\u218A\u218B\u2190-\u2307\u230C-\u2328\u232B-\u2426\u2440-\u244A\u249C-\u24E9\u2500-\u2767\u2794-\u27C4\u27C7-\u27E5\u27F0-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2B73\u2B76-\u2B95\u2B97-\u2BFF\u2CE5-\u2CEA\u2E50\u2E51\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFF\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u309B\u309C\u3190\u3191\u3196-\u319F\u31C0-\u31E3\u31EF\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA700-\uA716\uA720\uA721\uA789\uA78A\uA828-\uA82B\uA836-\uA839\uAA77-\uAA79\uAB5B\uAB6A\uAB6B\uFB29\uFBB2-\uFBC2\uFD40-\uFD4F\uFDCF\uFDFC-\uFDFF\uFE62\uFE64-\uFE66\uFE69\uFF04\uFF0B\uFF1C-\uFF1E\uFF3E\uFF40\uFF5C\uFF5E\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFFC\uFFFD]|\uD800[\uDD37-\uDD3F\uDD79-\uDD89\uDD8C-\uDD8E\uDD90-\uDD9C\uDDA0\uDDD0-\uDDFC]|\uD802[\uDC77\uDC78\uDEC8]|\uD805\uDF3F|\uD807[\uDFD5-\uDFF1]|\uD81A[\uDF3C-\uDF3F\uDF45]|\uD82F\uDC9C|\uD833[\uDF50-\uDFC3]|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDEA\uDE00-\uDE41\uDE45\uDF00-\uDF56]|\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85\uDE86]|\uD838[\uDD4F\uDEFF]|\uD83B[\uDCAC\uDCB0\uDD2E\uDEF0\uDEF1]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD0D-\uDDAD\uDDE6-\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFF]|\uD83D[\uDC00-\uDED7\uDEDC-\uDEEC\uDEF0-\uDEFC\uDF00-\uDF76\uDF7B-\uDFD9\uDFE0-\uDFEB\uDFF0]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDCB0\uDCB1\uDD00-\uDE53\uDE60-\uDE6D\uDE70-\uDE7C\uDE80-\uDE88\uDE90-\uDEBD\uDEBF-\uDEC5\uDECE-\uDEDB\uDEE0-\uDEE8\uDEF0-\uDEF8\uDF00-\uDF92\uDF94-\uDFCA]/,mr=/[ \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/,hr=g({Any:()=>lr,Cc:()=>ur,Cf:()=>dr,P:()=>fr,S:()=>pr,Z:()=>mr}),gr=new Uint16Array(`ᵁ<Õıʊҝջאٵ۞ޢߖࠏ੊ઑඡ๭༉༦჊ረዡᐕᒝᓃᓟᔥ\0\0\0\0\0\0ᕫᛍᦍᰒᷝ὾⁠↰⊍⏀⏻⑂⠤⤒ⴈ⹈⿎〖㊺㘹㞬㣾㨨㩱㫠㬮ࠀEMabcfglmnoprstu\\bfms¦³¹ÈÏlig耻Æ䃆P耻&䀦cute耻Á䃁reve;䄂Āiyx}rc耻Â䃂;䐐r;쀀𝔄rave耻À䃀pha;䎑acr;䄀d;橓Āgp¡on;䄄f;쀀𝔸plyFunction;恡ing耻Å䃅Ācs¾Ãr;쀀𝒜ign;扔ilde耻Ã䃃ml耻Ä䃄ЀaceforsuåûþėĜĢħĪĀcrêòkslash;或Ŷöø;櫧ed;挆y;䐑ƀcrtąċĔause;戵noullis;愬a;䎒r;쀀𝔅pf;쀀𝔹eve;䋘còēmpeq;扎܀HOacdefhilorsuōőŖƀƞƢƵƷƺǜȕɳɸɾcy;䐧PY耻©䂩ƀcpyŝŢźute;䄆Ā;iŧŨ拒talDifferentialD;慅leys;愭ȀaeioƉƎƔƘron;䄌dil耻Ç䃇rc;䄈nint;戰ot;䄊ĀdnƧƭilla;䂸terDot;䂷òſi;䎧rcleȀDMPTǇǋǑǖot;抙inus;抖lus;投imes;抗oĀcsǢǸkwiseContourIntegral;戲eCurlyĀDQȃȏoubleQuote;思uote;怙ȀlnpuȞȨɇɕonĀ;eȥȦ户;橴ƀgitȯȶȺruent;扡nt;戯ourIntegral;戮ĀfrɌɎ;愂oduct;成nterClockwiseContourIntegral;戳oss;樯cr;쀀𝒞pĀ;Cʄʅ拓ap;才րDJSZacefiosʠʬʰʴʸˋ˗ˡ˦̳ҍĀ;oŹʥtrahd;椑cy;䐂cy;䐅cy;䐏ƀgrsʿ˄ˇger;怡r;憡hv;櫤Āayː˕ron;䄎;䐔lĀ;t˝˞戇a;䎔r;쀀𝔇Āaf˫̧Ācm˰̢riticalȀADGT̖̜̀̆cute;䂴oŴ̋̍;䋙bleAcute;䋝rave;䁠ilde;䋜ond;拄ferentialD;慆Ѱ̽\0\0\0͔͂\0Ѕf;쀀𝔻ƀ;DE͈͉͍䂨ot;惜qual;扐blèCDLRUVͣͲ΂ϏϢϸontourIntegraìȹoɴ͹\0\0ͻ»͉nArrow;懓Āeo·ΤftƀARTΐΖΡrrow;懐ightArrow;懔eåˊngĀLRΫτeftĀARγιrrow;柸ightArrow;柺ightArrow;柹ightĀATϘϞrrow;懒ee;抨pɁϩ\0\0ϯrrow;懑ownArrow;懕erticalBar;戥ǹABLRTaВЪаўѿͼrrowƀ;BUНОТ憓ar;椓pArrow;懵reve;䌑eft˒к\0ц\0ѐightVector;楐eeVector;楞ectorĀ;Bљњ憽ar;楖ightǔѧ\0ѱeeVector;楟ectorĀ;BѺѻ懁ar;楗eeĀ;A҆҇护rrow;憧ĀctҒҗr;쀀𝒟rok;䄐ࠀNTacdfglmopqstuxҽӀӄӋӞӢӧӮӵԡԯԶՒ՝ՠեG;䅊H耻Ð䃐cute耻É䃉ƀaiyӒӗӜron;䄚rc耻Ê䃊;䐭ot;䄖r;쀀𝔈rave耻È䃈ement;戈ĀapӺӾcr;䄒tyɓԆ\0\0ԒmallSquare;旻erySmallSquare;斫ĀgpԦԪon;䄘f;쀀𝔼silon;䎕uĀaiԼՉlĀ;TՂՃ橵ilde;扂librium;懌Āci՗՚r;愰m;橳a;䎗ml耻Ë䃋Āipժկsts;戃onentialE;慇ʀcfiosօֈ֍ֲ׌y;䐤r;쀀𝔉lledɓ֗\0\0֣mallSquare;旼erySmallSquare;斪Ͱֺ\0ֿ\0\0ׄf;쀀𝔽All;戀riertrf;愱cò׋؀JTabcdfgorstר׬ׯ׺؀ؒؖ؛؝أ٬ٲcy;䐃耻>䀾mmaĀ;d׷׸䎓;䏜reve;䄞ƀeiy؇،ؐdil;䄢rc;䄜;䐓ot;䄠r;쀀𝔊;拙pf;쀀𝔾eater̀EFGLSTصلَٖٛ٦qualĀ;Lؾؿ扥ess;招ullEqual;执reater;檢ess;扷lantEqual;橾ilde;扳cr;쀀𝒢;扫ЀAacfiosuڅڋږڛڞڪھۊRDcy;䐪Āctڐڔek;䋇;䁞irc;䄤r;愌lbertSpace;愋ǰگ\0ڲf;愍izontalLine;攀Āctۃۅòکrok;䄦mpńېۘownHumðįqual;扏܀EJOacdfgmnostuۺ۾܃܇܎ܚܞܡܨ݄ݸދޏޕcy;䐕lig;䄲cy;䐁cute耻Í䃍Āiyܓܘrc耻Î䃎;䐘ot;䄰r;愑rave耻Ì䃌ƀ;apܠܯܿĀcgܴܷr;䄪inaryI;慈lieóϝǴ݉\0ݢĀ;eݍݎ戬Āgrݓݘral;戫section;拂isibleĀCTݬݲomma;恣imes;恢ƀgptݿރވon;䄮f;쀀𝕀a;䎙cr;愐ilde;䄨ǫޚ\0ޞcy;䐆l耻Ï䃏ʀcfosuެ޷޼߂ߐĀiyޱ޵rc;䄴;䐙r;쀀𝔍pf;쀀𝕁ǣ߇\0ߌr;쀀𝒥rcy;䐈kcy;䐄΀HJacfosߤߨ߽߬߱ࠂࠈcy;䐥cy;䐌ppa;䎚Āey߶߻dil;䄶;䐚r;쀀𝔎pf;쀀𝕂cr;쀀𝒦րJTaceflmostࠥࠩࠬࡐࡣ঳সে্਷ੇcy;䐉耻<䀼ʀcmnpr࠷࠼ࡁࡄࡍute;䄹bda;䎛g;柪lacetrf;愒r;憞ƀaeyࡗ࡜ࡡron;䄽dil;䄻;䐛Āfsࡨ॰tԀACDFRTUVarࡾࢩࢱࣦ࣠ࣼयज़ΐ४Ānrࢃ࢏gleBracket;柨rowƀ;BR࢙࢚࢞憐ar;懤ightArrow;懆eiling;挈oǵࢷ\0ࣃbleBracket;柦nǔࣈ\0࣒eeVector;楡ectorĀ;Bࣛࣜ懃ar;楙loor;挊ightĀAV࣯ࣵrrow;憔ector;楎Āerँगeƀ;AVउऊऐ抣rrow;憤ector;楚iangleƀ;BEतथऩ抲ar;槏qual;抴pƀDTVषूौownVector;楑eeVector;楠ectorĀ;Bॖॗ憿ar;楘ectorĀ;B॥०憼ar;楒ightáΜs̀EFGLSTॾঋকঝঢভqualGreater;拚ullEqual;扦reater;扶ess;檡lantEqual;橽ilde;扲r;쀀𝔏Ā;eঽা拘ftarrow;懚idot;䄿ƀnpw৔ਖਛgȀLRlr৞৷ਂਐeftĀAR০৬rrow;柵ightArrow;柷ightArrow;柶eftĀarγਊightáοightáϊf;쀀𝕃erĀLRਢਬeftArrow;憙ightArrow;憘ƀchtਾੀੂòࡌ;憰rok;䅁;扪Ѐacefiosuਗ਼੝੠੷੼અઋ઎p;椅y;䐜Ādl੥੯iumSpace;恟lintrf;愳r;쀀𝔐nusPlus;戓pf;쀀𝕄cò੶;䎜ҀJacefostuણધભીଔଙඑ඗ඞcy;䐊cute;䅃ƀaey઴હાron;䅇dil;䅅;䐝ƀgswે૰଎ativeƀMTV૓૟૨ediumSpace;怋hiĀcn૦૘ë૙eryThiî૙tedĀGL૸ଆreaterGreateòٳessLesóੈLine;䀊r;쀀𝔑ȀBnptଢନଷ଺reak;恠BreakingSpace;䂠f;愕ڀ;CDEGHLNPRSTV୕ୖ୪୼஡௫ఄ౞಄ದ೘ൡඅ櫬Āou୛୤ngruent;扢pCap;扭oubleVerticalBar;戦ƀlqxஃஊ஛ement;戉ualĀ;Tஒஓ扠ilde;쀀≂̸ists;戄reater΀;EFGLSTஶஷ஽௉௓௘௥扯qual;扱ullEqual;쀀≧̸reater;쀀≫̸ess;批lantEqual;쀀⩾̸ilde;扵umpń௲௽ownHump;쀀≎̸qual;쀀≏̸eĀfsఊధtTriangleƀ;BEచఛడ拪ar;쀀⧏̸qual;括s̀;EGLSTవశ఼ౄోౘ扮qual;扰reater;扸ess;쀀≪̸lantEqual;쀀⩽̸ilde;扴estedĀGL౨౹reaterGreater;쀀⪢̸essLess;쀀⪡̸recedesƀ;ESಒಓಛ技qual;쀀⪯̸lantEqual;拠ĀeiಫಹverseElement;戌ghtTriangleƀ;BEೋೌ೒拫ar;쀀⧐̸qual;拭ĀquೝഌuareSuĀbp೨೹setĀ;E೰ೳ쀀⊏̸qual;拢ersetĀ;Eഃആ쀀⊐̸qual;拣ƀbcpഓതൎsetĀ;Eഛഞ쀀⊂⃒qual;抈ceedsȀ;ESTലള഻െ抁qual;쀀⪰̸lantEqual;拡ilde;쀀≿̸ersetĀ;E൘൛쀀⊃⃒qual;抉ildeȀ;EFT൮൯൵ൿ扁qual;扄ullEqual;扇ilde;扉erticalBar;戤cr;쀀𝒩ilde耻Ñ䃑;䎝܀Eacdfgmoprstuvලෂ෉෕ෛ෠෧෼ขภยา฿ไlig;䅒cute耻Ó䃓Āiy෎ීrc耻Ô䃔;䐞blac;䅐r;쀀𝔒rave耻Ò䃒ƀaei෮ෲ෶cr;䅌ga;䎩cron;䎟pf;쀀𝕆enCurlyĀDQฎบoubleQuote;怜uote;怘;橔Āclวฬr;쀀𝒪ash耻Ø䃘iŬื฼de耻Õ䃕es;樷ml耻Ö䃖erĀBP๋๠Āar๐๓r;怾acĀek๚๜;揞et;掴arenthesis;揜Ҁacfhilors๿ງຊຏຒດຝະ໼rtialD;戂y;䐟r;쀀𝔓i;䎦;䎠usMinus;䂱Āipຢອncareplanåڝf;愙Ȁ;eio຺ູ໠໤檻cedesȀ;EST່້໏໚扺qual;檯lantEqual;扼ilde;找me;怳Ādp໩໮uct;戏ortionĀ;aȥ໹l;戝Āci༁༆r;쀀𝒫;䎨ȀUfos༑༖༛༟OT耻"䀢r;쀀𝔔pf;愚cr;쀀𝒬؀BEacefhiorsu༾གྷཇའཱིྦྷྪྭ႖ႩႴႾarr;椐G耻®䂮ƀcnrཎནབute;䅔g;柫rĀ;tཛྷཝ憠l;椖ƀaeyཧཬཱron;䅘dil;䅖;䐠Ā;vླྀཹ愜erseĀEUྂྙĀlq྇ྎement;戋uilibrium;懋pEquilibrium;楯r»ཹo;䎡ghtЀACDFTUVa࿁࿫࿳ဢဨၛႇϘĀnr࿆࿒gleBracket;柩rowƀ;BL࿜࿝࿡憒ar;懥eftArrow;懄eiling;按oǵ࿹\0စbleBracket;柧nǔည\0နeeVector;楝ectorĀ;Bဝသ懂ar;楕loor;挋Āerိ၃eƀ;AVဵံြ抢rrow;憦ector;楛iangleƀ;BEၐၑၕ抳ar;槐qual;抵pƀDTVၣၮၸownVector;楏eeVector;楜ectorĀ;Bႂႃ憾ar;楔ectorĀ;B႑႒懀ar;楓Āpuႛ႞f;愝ndImplies;楰ightarrow;懛ĀchႹႼr;愛;憱leDelayed;槴ڀHOacfhimoqstuფჱჷჽᄙᄞᅑᅖᅡᅧᆵᆻᆿĀCcჩხHcy;䐩y;䐨FTcy;䐬cute;䅚ʀ;aeiyᄈᄉᄎᄓᄗ檼ron;䅠dil;䅞rc;䅜;䐡r;쀀𝔖ortȀDLRUᄪᄴᄾᅉownArrow»ОeftArrow»࢚ightArrow»࿝pArrow;憑gma;䎣allCircle;战pf;쀀𝕊ɲᅭ\0\0ᅰt;戚areȀ;ISUᅻᅼᆉᆯ斡ntersection;抓uĀbpᆏᆞsetĀ;Eᆗᆘ抏qual;抑ersetĀ;Eᆨᆩ抐qual;抒nion;抔cr;쀀𝒮ar;拆ȀbcmpᇈᇛሉላĀ;sᇍᇎ拐etĀ;Eᇍᇕqual;抆ĀchᇠህeedsȀ;ESTᇭᇮᇴᇿ扻qual;檰lantEqual;扽ilde;承Tháྌ;我ƀ;esሒሓሣ拑rsetĀ;Eሜም抃qual;抇et»ሓրHRSacfhiorsሾቄ቉ቕ቞ቱቶኟዂወዑORN耻Þ䃞ADE;愢ĀHc቎ቒcy;䐋y;䐦Ābuቚቜ;䀉;䎤ƀaeyብቪቯron;䅤dil;䅢;䐢r;쀀𝔗Āeiቻ኉ǲኀ\0ኇefore;戴a;䎘Ācn኎ኘkSpace;쀀  Space;怉ldeȀ;EFTካኬኲኼ戼qual;扃ullEqual;扅ilde;扈pf;쀀𝕋ipleDot;惛Āctዖዛr;쀀𝒯rok;䅦ૡዷጎጚጦ\0ጬጱ\0\0\0\0\0ጸጽ፷ᎅ\0᏿ᐄᐊᐐĀcrዻጁute耻Ú䃚rĀ;oጇገ憟cir;楉rǣጓ\0጖y;䐎ve;䅬Āiyጞጣrc耻Û䃛;䐣blac;䅰r;쀀𝔘rave耻Ù䃙acr;䅪Ādiፁ፩erĀBPፈ፝Āarፍፐr;䁟acĀekፗፙ;揟et;掵arenthesis;揝onĀ;P፰፱拃lus;抎Āgp፻፿on;䅲f;쀀𝕌ЀADETadps᎕ᎮᎸᏄϨᏒᏗᏳrrowƀ;BDᅐᎠᎤar;椒ownArrow;懅ownArrow;憕quilibrium;楮eeĀ;AᏋᏌ报rrow;憥ownáϳerĀLRᏞᏨeftArrow;憖ightArrow;憗iĀ;lᏹᏺ䏒on;䎥ing;䅮cr;쀀𝒰ilde;䅨ml耻Ü䃜ҀDbcdefosvᐧᐬᐰᐳᐾᒅᒊᒐᒖash;披ar;櫫y;䐒ashĀ;lᐻᐼ抩;櫦Āerᑃᑅ;拁ƀbtyᑌᑐᑺar;怖Ā;iᑏᑕcalȀBLSTᑡᑥᑪᑴar;戣ine;䁼eparator;杘ilde;所ThinSpace;怊r;쀀𝔙pf;쀀𝕍cr;쀀𝒱dash;抪ʀcefosᒧᒬᒱᒶᒼirc;䅴dge;拀r;쀀𝔚pf;쀀𝕎cr;쀀𝒲Ȁfiosᓋᓐᓒᓘr;쀀𝔛;䎞pf;쀀𝕏cr;쀀𝒳ҀAIUacfosuᓱᓵᓹᓽᔄᔏᔔᔚᔠcy;䐯cy;䐇cy;䐮cute耻Ý䃝Āiyᔉᔍrc;䅶;䐫r;쀀𝔜pf;쀀𝕐cr;쀀𝒴ml;䅸ЀHacdefosᔵᔹᔿᕋᕏᕝᕠᕤcy;䐖cute;䅹Āayᕄᕉron;䅽;䐗ot;䅻ǲᕔ\0ᕛoWidtè૙a;䎖r;愨pf;愤cr;쀀𝒵௡ᖃᖊᖐ\0ᖰᖶᖿ\0\0\0\0ᗆᗛᗫᙟ᙭\0ᚕ᚛ᚲᚹ\0ᚾcute耻á䃡reve;䄃̀;Ediuyᖜᖝᖡᖣᖨᖭ戾;쀀∾̳;房rc耻â䃢te肻´̆;䐰lig耻æ䃦Ā;r²ᖺ;쀀𝔞rave耻à䃠ĀepᗊᗖĀfpᗏᗔsym;愵èᗓha;䎱ĀapᗟcĀclᗤᗧr;䄁g;樿ɤᗰ\0\0ᘊʀ;adsvᗺᗻᗿᘁᘇ戧nd;橕;橜lope;橘;橚΀;elmrszᘘᘙᘛᘞᘿᙏᙙ戠;榤e»ᘙsdĀ;aᘥᘦ戡ѡᘰᘲᘴᘶᘸᘺᘼᘾ;榨;榩;榪;榫;榬;榭;榮;榯tĀ;vᙅᙆ戟bĀ;dᙌᙍ抾;榝Āptᙔᙗh;戢»¹arr;捼Āgpᙣᙧon;䄅f;쀀𝕒΀;Eaeiop዁ᙻᙽᚂᚄᚇᚊ;橰cir;橯;扊d;手s;䀧roxĀ;e዁ᚒñᚃing耻å䃥ƀctyᚡᚦᚨr;쀀𝒶;䀪mpĀ;e዁ᚯñʈilde耻ã䃣ml耻ä䃤Āciᛂᛈoninôɲnt;樑ࠀNabcdefiklnoprsu᛭ᛱᜰ᜼ᝃᝈ᝸᝽០៦ᠹᡐᜍ᤽᥈ᥰot;櫭Ācrᛶ᜞kȀcepsᜀᜅᜍᜓong;扌psilon;䏶rime;怵imĀ;e᜚᜛戽q;拍Ŷᜢᜦee;抽edĀ;gᜬᜭ挅e»ᜭrkĀ;t፜᜷brk;掶Āoyᜁᝁ;䐱quo;怞ʀcmprtᝓ᝛ᝡᝤᝨausĀ;eĊĉptyv;榰séᜌnoõēƀahwᝯ᝱ᝳ;䎲;愶een;扬r;쀀𝔟g΀costuvwឍឝឳេ៕៛៞ƀaiuបពរðݠrc;旯p»፱ƀdptឤឨឭot;樀lus;樁imes;樂ɱឹ\0\0ើcup;樆ar;昅riangleĀdu៍្own;施p;斳plus;樄eåᑄåᒭarow;植ƀako៭ᠦᠵĀcn៲ᠣkƀlst៺֫᠂ozenge;槫riangleȀ;dlr᠒᠓᠘᠝斴own;斾eft;旂ight;斸k;搣Ʊᠫ\0ᠳƲᠯ\0ᠱ;斒;斑4;斓ck;斈ĀeoᠾᡍĀ;qᡃᡆ쀀=⃥uiv;쀀≡⃥t;挐Ȁptwxᡙᡞᡧᡬf;쀀𝕓Ā;tᏋᡣom»Ꮜtie;拈؀DHUVbdhmptuvᢅᢖᢪᢻᣗᣛᣬ᣿ᤅᤊᤐᤡȀLRlrᢎᢐᢒᢔ;敗;敔;敖;敓ʀ;DUduᢡᢢᢤᢦᢨ敐;敦;敩;敤;敧ȀLRlrᢳᢵᢷᢹ;敝;敚;敜;教΀;HLRhlrᣊᣋᣍᣏᣑᣓᣕ救;敬;散;敠;敫;敢;敟ox;槉ȀLRlrᣤᣦᣨᣪ;敕;敒;攐;攌ʀ;DUduڽ᣷᣹᣻᣽;敥;敨;攬;攴inus;抟lus;択imes;抠ȀLRlrᤙᤛᤝ᤟;敛;敘;攘;攔΀;HLRhlrᤰᤱᤳᤵᤷ᤻᤹攂;敪;敡;敞;攼;攤;攜Āevģ᥂bar耻¦䂦Ȁceioᥑᥖᥚᥠr;쀀𝒷mi;恏mĀ;e᜚᜜lƀ;bhᥨᥩᥫ䁜;槅sub;柈Ŭᥴ᥾lĀ;e᥹᥺怢t»᥺pƀ;Eeįᦅᦇ;檮Ā;qۜۛೡᦧ\0᧨ᨑᨕᨲ\0ᨷᩐ\0\0᪴\0\0᫁\0\0ᬡᬮ᭍᭒\0᯽\0ᰌƀcpr᦭ᦲ᧝ute;䄇̀;abcdsᦿᧀᧄ᧊᧕᧙戩nd;橄rcup;橉Āau᧏᧒p;橋p;橇ot;橀;쀀∩︀Āeo᧢᧥t;恁îړȀaeiu᧰᧻ᨁᨅǰ᧵\0᧸s;橍on;䄍dil耻ç䃧rc;䄉psĀ;sᨌᨍ橌m;橐ot;䄋ƀdmnᨛᨠᨦil肻¸ƭptyv;榲t脀¢;eᨭᨮ䂢räƲr;쀀𝔠ƀceiᨽᩀᩍy;䑇ckĀ;mᩇᩈ朓ark»ᩈ;䏇r΀;Ecefms᩟᩠ᩢᩫ᪤᪪᪮旋;槃ƀ;elᩩᩪᩭ䋆q;扗eɡᩴ\0\0᪈rrowĀlr᩼᪁eft;憺ight;憻ʀRSacd᪒᪔᪖᪚᪟»ཇ;擈st;抛irc;抚ash;抝nint;樐id;櫯cir;槂ubsĀ;u᪻᪼晣it»᪼ˬ᫇᫔᫺\0ᬊonĀ;eᫍᫎ䀺Ā;qÇÆɭ᫙\0\0᫢aĀ;t᫞᫟䀬;䁀ƀ;fl᫨᫩᫫戁îᅠeĀmx᫱᫶ent»᫩eóɍǧ᫾\0ᬇĀ;dኻᬂot;橭nôɆƀfryᬐᬔᬗ;쀀𝕔oäɔ脀©;sŕᬝr;愗Āaoᬥᬩrr;憵ss;朗Ācuᬲᬷr;쀀𝒸Ābpᬼ᭄Ā;eᭁᭂ櫏;櫑Ā;eᭉᭊ櫐;櫒dot;拯΀delprvw᭠᭬᭷ᮂᮬᯔ᯹arrĀlr᭨᭪;椸;椵ɰ᭲\0\0᭵r;拞c;拟arrĀ;p᭿ᮀ憶;椽̀;bcdosᮏᮐᮖᮡᮥᮨ截rcap;橈Āauᮛᮞp;橆p;橊ot;抍r;橅;쀀∪︀Ȁalrv᮵ᮿᯞᯣrrĀ;mᮼᮽ憷;椼yƀevwᯇᯔᯘqɰᯎ\0\0ᯒreã᭳uã᭵ee;拎edge;拏en耻¤䂤earrowĀlrᯮ᯳eft»ᮀight»ᮽeäᯝĀciᰁᰇoninôǷnt;戱lcty;挭ঀAHabcdefhijlorstuwz᰸᰻᰿ᱝᱩᱵᲊᲞᲬᲷ᳻᳿ᴍᵻᶑᶫᶻ᷆᷍rò΁ar;楥Ȁglrs᱈ᱍ᱒᱔ger;怠eth;愸òᄳhĀ;vᱚᱛ怐»ऊūᱡᱧarow;椏aã̕Āayᱮᱳron;䄏;䐴ƀ;ao̲ᱼᲄĀgrʿᲁr;懊tseq;橷ƀglmᲑᲔᲘ耻°䂰ta;䎴ptyv;榱ĀirᲣᲨsht;楿;쀀𝔡arĀlrᲳᲵ»ࣜ»သʀaegsv᳂͸᳖᳜᳠mƀ;oș᳊᳔ndĀ;ș᳑uit;晦amma;䏝in;拲ƀ;io᳧᳨᳸䃷de脀÷;o᳧ᳰntimes;拇nø᳷cy;䑒cɯᴆ\0\0ᴊrn;挞op;挍ʀlptuwᴘᴝᴢᵉᵕlar;䀤f;쀀𝕕ʀ;emps̋ᴭᴷᴽᵂqĀ;d͒ᴳot;扑inus;戸lus;戔quare;抡blebarwedgåúnƀadhᄮᵝᵧownarrowóᲃarpoonĀlrᵲᵶefôᲴighôᲶŢᵿᶅkaro÷གɯᶊ\0\0ᶎrn;挟op;挌ƀcotᶘᶣᶦĀryᶝᶡ;쀀𝒹;䑕l;槶rok;䄑Ādrᶰᶴot;拱iĀ;fᶺ᠖斿Āah᷀᷃ròЩaòྦangle;榦Āci᷒ᷕy;䑟grarr;柿ऀDacdefglmnopqrstuxḁḉḙḸոḼṉṡṾấắẽỡἪἷὄ὎὚ĀDoḆᴴoôᲉĀcsḎḔute耻é䃩ter;橮ȀaioyḢḧḱḶron;䄛rĀ;cḭḮ扖耻ê䃪lon;払;䑍ot;䄗ĀDrṁṅot;扒;쀀𝔢ƀ;rsṐṑṗ檚ave耻è䃨Ā;dṜṝ檖ot;檘Ȁ;ilsṪṫṲṴ檙nters;揧;愓Ā;dṹṺ檕ot;檗ƀapsẅẉẗcr;䄓tyƀ;svẒẓẕ戅et»ẓpĀ1;ẝẤĳạả;怄;怅怃ĀgsẪẬ;䅋p;怂ĀgpẴẸon;䄙f;쀀𝕖ƀalsỄỎỒrĀ;sỊị拕l;槣us;橱iƀ;lvỚớở䎵on»ớ;䏵ȀcsuvỪỳἋἣĀioữḱrc»Ḯɩỹ\0\0ỻíՈantĀglἂἆtr»ṝess»Ṻƀaeiἒ἖Ἒls;䀽st;扟vĀ;DȵἠD;橸parsl;槥ĀDaἯἳot;打rr;楱ƀcdiἾὁỸr;愯oô͒ĀahὉὋ;䎷耻ð䃰Āmrὓὗl耻ë䃫o;悬ƀcipὡὤὧl;䀡sôծĀeoὬὴctatioîՙnentialåչৡᾒ\0ᾞ\0ᾡᾧ\0\0ῆῌ\0ΐ\0ῦῪ \0 ⁚llingdotseñṄy;䑄male;晀ƀilrᾭᾳ῁lig;耀ﬃɩᾹ\0\0᾽g;耀ﬀig;耀ﬄ;쀀𝔣lig;耀ﬁlig;쀀fjƀaltῙ῜ῡt;晭ig;耀ﬂns;斱of;䆒ǰ΅\0ῳf;쀀𝕗ĀakֿῷĀ;vῼ´拔;櫙artint;樍Āao‌⁕Ācs‑⁒α‚‰‸⁅⁈\0⁐β•‥‧‪‬\0‮耻½䂽;慓耻¼䂼;慕;慙;慛Ƴ‴\0‶;慔;慖ʴ‾⁁\0\0⁃耻¾䂾;慗;慜5;慘ƶ⁌\0⁎;慚;慝8;慞l;恄wn;挢cr;쀀𝒻ࢀEabcdefgijlnorstv₂₉₟₥₰₴⃰⃵⃺⃿℃ℒℸ̗ℾ⅒↞Ā;lٍ₇;檌ƀcmpₐₕ₝ute;䇵maĀ;dₜ᳚䎳;檆reve;䄟Āiy₪₮rc;䄝;䐳ot;䄡Ȁ;lqsؾق₽⃉ƀ;qsؾٌ⃄lanô٥Ȁ;cdl٥⃒⃥⃕c;檩otĀ;o⃜⃝檀Ā;l⃢⃣檂;檄Ā;e⃪⃭쀀⋛︀s;檔r;쀀𝔤Ā;gٳ؛mel;愷cy;䑓Ȁ;Eajٚℌℎℐ;檒;檥;檤ȀEaesℛℝ℩ℴ;扩pĀ;p℣ℤ檊rox»ℤĀ;q℮ℯ檈Ā;q℮ℛim;拧pf;쀀𝕘Āci⅃ⅆr;愊mƀ;el٫ⅎ⅐;檎;檐茀>;cdlqr׮ⅠⅪⅮⅳⅹĀciⅥⅧ;檧r;橺ot;拗Par;榕uest;橼ʀadelsↄⅪ←ٖ↛ǰ↉\0↎proø₞r;楸qĀlqؿ↖lesó₈ií٫Āen↣↭rtneqq;쀀≩︀Å↪ԀAabcefkosy⇄⇇⇱⇵⇺∘∝∯≨≽ròΠȀilmr⇐⇔⇗⇛rsðᒄf»․ilôکĀdr⇠⇤cy;䑊ƀ;cwࣴ⇫⇯ir;楈;憭ar;意irc;䄥ƀalr∁∎∓rtsĀ;u∉∊晥it»∊lip;怦con;抹r;쀀𝔥sĀew∣∩arow;椥arow;椦ʀamopr∺∾≃≞≣rr;懿tht;戻kĀlr≉≓eftarrow;憩ightarrow;憪f;쀀𝕙bar;怕ƀclt≯≴≸r;쀀𝒽asè⇴rok;䄧Ābp⊂⊇ull;恃hen»ᱛૡ⊣\0⊪\0⊸⋅⋎\0⋕⋳\0\0⋸⌢⍧⍢⍿\0⎆⎪⎴cute耻í䃭ƀ;iyݱ⊰⊵rc耻î䃮;䐸Ācx⊼⊿y;䐵cl耻¡䂡ĀfrΟ⋉;쀀𝔦rave耻ì䃬Ȁ;inoܾ⋝⋩⋮Āin⋢⋦nt;樌t;戭fin;槜ta;愩lig;䄳ƀaop⋾⌚⌝ƀcgt⌅⌈⌗r;䄫ƀelpܟ⌏⌓inåގarôܠh;䄱f;抷ed;䆵ʀ;cfotӴ⌬⌱⌽⍁are;愅inĀ;t⌸⌹戞ie;槝doô⌙ʀ;celpݗ⍌⍐⍛⍡al;抺Āgr⍕⍙eróᕣã⍍arhk;樗rod;樼Ȁcgpt⍯⍲⍶⍻y;䑑on;䄯f;쀀𝕚a;䎹uest耻¿䂿Āci⎊⎏r;쀀𝒾nʀ;EdsvӴ⎛⎝⎡ӳ;拹ot;拵Ā;v⎦⎧拴;拳Ā;iݷ⎮lde;䄩ǫ⎸\0⎼cy;䑖l耻ï䃯̀cfmosu⏌⏗⏜⏡⏧⏵Āiy⏑⏕rc;䄵;䐹r;쀀𝔧ath;䈷pf;쀀𝕛ǣ⏬\0⏱r;쀀𝒿rcy;䑘kcy;䑔Ѐacfghjos␋␖␢␧␭␱␵␻ppaĀ;v␓␔䎺;䏰Āey␛␠dil;䄷;䐺r;쀀𝔨reen;䄸cy;䑅cy;䑜pf;쀀𝕜cr;쀀𝓀஀ABEHabcdefghjlmnoprstuv⑰⒁⒆⒍⒑┎┽╚▀♎♞♥♹♽⚚⚲⛘❝❨➋⟀⠁⠒ƀart⑷⑺⑼rò৆òΕail;椛arr;椎Ā;gঔ⒋;檋ar;楢ॣ⒥\0⒪\0⒱\0\0\0\0\0⒵Ⓔ\0ⓆⓈⓍ\0⓹ute;䄺mptyv;榴raîࡌbda;䎻gƀ;dlࢎⓁⓃ;榑åࢎ;檅uo耻«䂫rЀ;bfhlpst࢙ⓞⓦⓩ⓫⓮⓱⓵Ā;f࢝ⓣs;椟s;椝ë≒p;憫l;椹im;楳l;憢ƀ;ae⓿─┄檫il;椙Ā;s┉┊檭;쀀⪭︀ƀabr┕┙┝rr;椌rk;杲Āak┢┬cĀek┨┪;䁻;䁛Āes┱┳;榋lĀdu┹┻;榏;榍Ȁaeuy╆╋╖╘ron;䄾Ādi═╔il;䄼ìࢰâ┩;䐻Ȁcqrs╣╦╭╽a;椶uoĀ;rนᝆĀdu╲╷har;楧shar;楋h;憲ʀ;fgqs▋▌উ◳◿扤tʀahlrt▘▤▷◂◨rrowĀ;t࢙□aé⓶arpoonĀdu▯▴own»њp»०eftarrows;懇ightƀahs◍◖◞rrowĀ;sࣴࢧarpoonó྘quigarro÷⇰hreetimes;拋ƀ;qs▋ও◺lanôবʀ;cdgsব☊☍☝☨c;檨otĀ;o☔☕橿Ā;r☚☛檁;檃Ā;e☢☥쀀⋚︀s;檓ʀadegs☳☹☽♉♋pproøⓆot;拖qĀgq♃♅ôউgtò⒌ôছiíলƀilr♕࣡♚sht;楼;쀀𝔩Ā;Eজ♣;檑š♩♶rĀdu▲♮Ā;l॥♳;楪lk;斄cy;䑙ʀ;achtੈ⚈⚋⚑⚖rò◁orneòᴈard;楫ri;旺Āio⚟⚤dot;䅀ustĀ;a⚬⚭掰che»⚭ȀEaes⚻⚽⛉⛔;扨pĀ;p⛃⛄檉rox»⛄Ā;q⛎⛏檇Ā;q⛎⚻im;拦Ѐabnoptwz⛩⛴⛷✚✯❁❇❐Ānr⛮⛱g;柬r;懽rëࣁgƀlmr⛿✍✔eftĀar০✇ightá৲apsto;柼ightá৽parrowĀlr✥✩efô⓭ight;憬ƀafl✶✹✽r;榅;쀀𝕝us;樭imes;樴š❋❏st;戗áፎƀ;ef❗❘᠀旊nge»❘arĀ;l❤❥䀨t;榓ʀachmt❳❶❼➅➇ròࢨorneòᶌarĀ;d྘➃;業;怎ri;抿̀achiqt➘➝ੀ➢➮➻quo;怹r;쀀𝓁mƀ;egল➪➬;檍;檏Ābu┪➳oĀ;rฟ➹;怚rok;䅂萀<;cdhilqrࠫ⟒☹⟜⟠⟥⟪⟰Āci⟗⟙;檦r;橹reå◲mes;拉arr;楶uest;橻ĀPi⟵⟹ar;榖ƀ;ef⠀भ᠛旃rĀdu⠇⠍shar;楊har;楦Āen⠗⠡rtneqq;쀀≨︀Å⠞܀Dacdefhilnopsu⡀⡅⢂⢎⢓⢠⢥⢨⣚⣢⣤ઃ⣳⤂Dot;戺Ȁclpr⡎⡒⡣⡽r耻¯䂯Āet⡗⡙;時Ā;e⡞⡟朠se»⡟Ā;sျ⡨toȀ;dluျ⡳⡷⡻owîҌefôएðᏑker;斮Āoy⢇⢌mma;権;䐼ash;怔asuredangle»ᘦr;쀀𝔪o;愧ƀcdn⢯⢴⣉ro耻µ䂵Ȁ;acdᑤ⢽⣀⣄sôᚧir;櫰ot肻·Ƶusƀ;bd⣒ᤃ⣓戒Ā;uᴼ⣘;横ţ⣞⣡p;櫛ò−ðઁĀdp⣩⣮els;抧f;쀀𝕞Āct⣸⣽r;쀀𝓂pos»ᖝƀ;lm⤉⤊⤍䎼timap;抸ఀGLRVabcdefghijlmoprstuvw⥂⥓⥾⦉⦘⧚⧩⨕⨚⩘⩝⪃⪕⪤⪨⬄⬇⭄⭿⮮ⰴⱧⱼ⳩Āgt⥇⥋;쀀⋙̸Ā;v⥐௏쀀≫⃒ƀelt⥚⥲⥶ftĀar⥡⥧rrow;懍ightarrow;懎;쀀⋘̸Ā;v⥻ే쀀≪⃒ightarrow;懏ĀDd⦎⦓ash;抯ash;抮ʀbcnpt⦣⦧⦬⦱⧌la»˞ute;䅄g;쀀∠⃒ʀ;Eiop඄⦼⧀⧅⧈;쀀⩰̸d;쀀≋̸s;䅉roø඄urĀ;a⧓⧔普lĀ;s⧓ସǳ⧟\0⧣p肻\xA0ଷmpĀ;e௹ఀʀaeouy⧴⧾⨃⨐⨓ǰ⧹\0⧻;橃on;䅈dil;䅆ngĀ;dൾ⨊ot;쀀⩭̸p;橂;䐽ash;怓΀;Aadqsxஒ⨩⨭⨻⩁⩅⩐rr;懗rĀhr⨳⨶k;椤Ā;oᏲᏰot;쀀≐̸uiöୣĀei⩊⩎ar;椨í஘istĀ;s஠டr;쀀𝔫ȀEest௅⩦⩹⩼ƀ;qs஼⩭௡ƀ;qs஼௅⩴lanô௢ií௪Ā;rஶ⪁»ஷƀAap⪊⪍⪑rò⥱rr;憮ar;櫲ƀ;svྍ⪜ྌĀ;d⪡⪢拼;拺cy;䑚΀AEadest⪷⪺⪾⫂⫅⫶⫹rò⥦;쀀≦̸rr;憚r;急Ȁ;fqs఻⫎⫣⫯tĀar⫔⫙rro÷⫁ightarro÷⪐ƀ;qs఻⪺⫪lanôౕĀ;sౕ⫴»శiíౝĀ;rవ⫾iĀ;eచథiäඐĀpt⬌⬑f;쀀𝕟膀¬;in⬙⬚⬶䂬nȀ;Edvஉ⬤⬨⬮;쀀⋹̸ot;쀀⋵̸ǡஉ⬳⬵;拷;拶iĀ;vಸ⬼ǡಸ⭁⭃;拾;拽ƀaor⭋⭣⭩rȀ;ast୻⭕⭚⭟lleì୻l;쀀⫽⃥;쀀∂̸lint;樔ƀ;ceಒ⭰⭳uåಥĀ;cಘ⭸Ā;eಒ⭽ñಘȀAait⮈⮋⮝⮧rò⦈rrƀ;cw⮔⮕⮙憛;쀀⤳̸;쀀↝̸ghtarrow»⮕riĀ;eೋೖ΀chimpqu⮽⯍⯙⬄୸⯤⯯Ȁ;cerല⯆ഷ⯉uå൅;쀀𝓃ortɭ⬅\0\0⯖ará⭖mĀ;e൮⯟Ā;q൴൳suĀbp⯫⯭å೸åഋƀbcp⯶ⰑⰙȀ;Ees⯿ⰀഢⰄ抄;쀀⫅̸etĀ;eഛⰋqĀ;qണⰀcĀ;eലⰗñസȀ;EesⰢⰣൟⰧ抅;쀀⫆̸etĀ;e൘ⰮqĀ;qൠⰣȀgilrⰽⰿⱅⱇìௗlde耻ñ䃱çృiangleĀlrⱒⱜeftĀ;eచⱚñదightĀ;eೋⱥñ೗Ā;mⱬⱭ䎽ƀ;esⱴⱵⱹ䀣ro;愖p;怇ҀDHadgilrsⲏⲔⲙⲞⲣⲰⲶⳓⳣash;抭arr;椄p;쀀≍⃒ash;抬ĀetⲨⲬ;쀀≥⃒;쀀>⃒nfin;槞ƀAetⲽⳁⳅrr;椂;쀀≤⃒Ā;rⳊⳍ쀀<⃒ie;쀀⊴⃒ĀAtⳘⳜrr;椃rie;쀀⊵⃒im;쀀∼⃒ƀAan⳰⳴ⴂrr;懖rĀhr⳺⳽k;椣Ā;oᏧᏥear;椧ቓ᪕\0\0\0\0\0\0\0\0\0\0\0\0\0ⴭ\0ⴸⵈⵠⵥ⵲ⶄᬇ\0\0ⶍⶫ\0ⷈⷎ\0ⷜ⸙⸫⸾⹃Ācsⴱ᪗ute耻ó䃳ĀiyⴼⵅrĀ;c᪞ⵂ耻ô䃴;䐾ʀabios᪠ⵒⵗǈⵚlac;䅑v;樸old;榼lig;䅓Ācr⵩⵭ir;榿;쀀𝔬ͯ⵹\0\0⵼\0ⶂn;䋛ave耻ò䃲;槁Ābmⶈ෴ar;榵Ȁacitⶕ⶘ⶥⶨrò᪀Āir⶝ⶠr;榾oss;榻nå๒;槀ƀaeiⶱⶵⶹcr;䅍ga;䏉ƀcdnⷀⷅǍron;䎿;榶pf;쀀𝕠ƀaelⷔ⷗ǒr;榷rp;榹΀;adiosvⷪⷫⷮ⸈⸍⸐⸖戨rò᪆Ȁ;efmⷷⷸ⸂⸅橝rĀ;oⷾⷿ愴f»ⷿ耻ª䂪耻º䂺gof;抶r;橖lope;橗;橛ƀclo⸟⸡⸧ò⸁ash耻ø䃸l;折iŬⸯ⸴de耻õ䃵esĀ;aǛ⸺s;樶ml耻ö䃶bar;挽ૡ⹞\0⹽\0⺀⺝\0⺢⺹\0\0⻋ຜ\0⼓\0\0⼫⾼\0⿈rȀ;astЃ⹧⹲຅脀¶;l⹭⹮䂶leìЃɩ⹸\0\0⹻m;櫳;櫽y;䐿rʀcimpt⺋⺏⺓ᡥ⺗nt;䀥od;䀮il;怰enk;怱r;쀀𝔭ƀimo⺨⺰⺴Ā;v⺭⺮䏆;䏕maô੶ne;明ƀ;tv⺿⻀⻈䏀chfork»´;䏖Āau⻏⻟nĀck⻕⻝kĀ;h⇴⻛;愎ö⇴sҀ;abcdemst⻳⻴ᤈ⻹⻽⼄⼆⼊⼎䀫cir;樣ir;樢Āouᵀ⼂;樥;橲n肻±ຝim;樦wo;樧ƀipu⼙⼠⼥ntint;樕f;쀀𝕡nd耻£䂣Ԁ;Eaceinosu່⼿⽁⽄⽇⾁⾉⾒⽾⾶;檳p;檷uå໙Ā;c໎⽌̀;acens່⽙⽟⽦⽨⽾pproø⽃urlyeñ໙ñ໎ƀaes⽯⽶⽺pprox;檹qq;檵im;拨iíໟmeĀ;s⾈ຮ怲ƀEas⽸⾐⽺ð⽵ƀdfp໬⾙⾯ƀals⾠⾥⾪lar;挮ine;挒urf;挓Ā;t໻⾴ï໻rel;抰Āci⿀⿅r;쀀𝓅;䏈ncsp;怈̀fiopsu⿚⋢⿟⿥⿫⿱r;쀀𝔮pf;쀀𝕢rime;恗cr;쀀𝓆ƀaeo⿸〉〓tĀei⿾々rnionóڰnt;樖stĀ;e【】䀿ñἙô༔઀ABHabcdefhilmnoprstux぀けさすムㄎㄫㅇㅢㅲㆎ㈆㈕㈤㈩㉘㉮㉲㊐㊰㊷ƀartぇおがròႳòϝail;検aròᱥar;楤΀cdenqrtとふへみわゔヌĀeuねぱ;쀀∽̱te;䅕iãᅮmptyv;榳gȀ;del࿑らるろ;榒;榥å࿑uo耻»䂻rր;abcfhlpstw࿜ガクシスゼゾダッデナp;極Ā;f࿠ゴs;椠;椳s;椞ë≝ð✮l;楅im;楴l;憣;憝Āaiパフil;椚oĀ;nホボ戶aló༞ƀabrョリヮrò៥rk;杳ĀakンヽcĀekヹ・;䁽;䁝Āes㄂㄄;榌lĀduㄊㄌ;榎;榐Ȁaeuyㄗㄜㄧㄩron;䅙Ādiㄡㄥil;䅗ì࿲âヺ;䑀Ȁclqsㄴㄷㄽㅄa;椷dhar;楩uoĀ;rȎȍh;憳ƀacgㅎㅟངlȀ;ipsླྀㅘㅛႜnåႻarôྩt;断ƀilrㅩဣㅮsht;楽;쀀𝔯ĀaoㅷㆆrĀduㅽㅿ»ѻĀ;l႑ㆄ;楬Ā;vㆋㆌ䏁;䏱ƀgns㆕ㇹㇼht̀ahlrstㆤㆰ㇂㇘㇤㇮rrowĀ;t࿜ㆭaéトarpoonĀduㆻㆿowîㅾp»႒eftĀah㇊㇐rrowó࿪arpoonóՑightarrows;應quigarro÷ニhreetimes;拌g;䋚ingdotseñἲƀahm㈍㈐㈓rò࿪aòՑ;怏oustĀ;a㈞㈟掱che»㈟mid;櫮Ȁabpt㈲㈽㉀㉒Ānr㈷㈺g;柭r;懾rëဃƀafl㉇㉊㉎r;榆;쀀𝕣us;樮imes;樵Āap㉝㉧rĀ;g㉣㉤䀩t;榔olint;樒arò㇣Ȁachq㉻㊀Ⴜ㊅quo;怺r;쀀𝓇Ābu・㊊oĀ;rȔȓƀhir㊗㊛㊠reåㇸmes;拊iȀ;efl㊪ၙᠡ㊫方tri;槎luhar;楨;愞ൡ㋕㋛㋟㌬㌸㍱\0㍺㎤\0\0㏬㏰\0㐨㑈㑚㒭㒱㓊㓱\0㘖\0\0㘳cute;䅛quï➺Ԁ;Eaceinpsyᇭ㋳㋵㋿㌂㌋㌏㌟㌦㌩;檴ǰ㋺\0㋼;檸on;䅡uåᇾĀ;dᇳ㌇il;䅟rc;䅝ƀEas㌖㌘㌛;檶p;檺im;择olint;樓iíሄ;䑁otƀ;be㌴ᵇ㌵担;橦΀Aacmstx㍆㍊㍗㍛㍞㍣㍭rr;懘rĀhr㍐㍒ë∨Ā;oਸ਼਴t耻§䂧i;䀻war;椩mĀin㍩ðnuóñt;朶rĀ;o㍶⁕쀀𝔰Ȁacoy㎂㎆㎑㎠rp;景Āhy㎋㎏cy;䑉;䑈rtɭ㎙\0\0㎜iäᑤaraì⹯耻­䂭Āgm㎨㎴maƀ;fv㎱㎲㎲䏃;䏂Ѐ;deglnprካ㏅㏉㏎㏖㏞㏡㏦ot;橪Ā;q኱ኰĀ;E㏓㏔檞;檠Ā;E㏛㏜檝;檟e;扆lus;樤arr;楲aròᄽȀaeit㏸㐈㐏㐗Āls㏽㐄lsetmé㍪hp;樳parsl;槤Ādlᑣ㐔e;挣Ā;e㐜㐝檪Ā;s㐢㐣檬;쀀⪬︀ƀflp㐮㐳㑂tcy;䑌Ā;b㐸㐹䀯Ā;a㐾㐿槄r;挿f;쀀𝕤aĀdr㑍ЂesĀ;u㑔㑕晠it»㑕ƀcsu㑠㑹㒟Āau㑥㑯pĀ;sᆈ㑫;쀀⊓︀pĀ;sᆴ㑵;쀀⊔︀uĀbp㑿㒏ƀ;esᆗᆜ㒆etĀ;eᆗ㒍ñᆝƀ;esᆨᆭ㒖etĀ;eᆨ㒝ñᆮƀ;afᅻ㒦ְrť㒫ֱ»ᅼaròᅈȀcemt㒹㒾㓂㓅r;쀀𝓈tmîñiì㐕aræᆾĀar㓎㓕rĀ;f㓔ឿ昆Āan㓚㓭ightĀep㓣㓪psiloîỠhé⺯s»⡒ʀbcmnp㓻㕞ሉ㖋㖎Ҁ;Edemnprs㔎㔏㔑㔕㔞㔣㔬㔱㔶抂;櫅ot;檽Ā;dᇚ㔚ot;櫃ult;櫁ĀEe㔨㔪;櫋;把lus;檿arr;楹ƀeiu㔽㕒㕕tƀ;en㔎㕅㕋qĀ;qᇚ㔏eqĀ;q㔫㔨m;櫇Ābp㕚㕜;櫕;櫓c̀;acensᇭ㕬㕲㕹㕻㌦pproø㋺urlyeñᇾñᇳƀaes㖂㖈㌛pproø㌚qñ㌗g;晪ڀ123;Edehlmnps㖩㖬㖯ሜ㖲㖴㗀㗉㗕㗚㗟㗨㗭耻¹䂹耻²䂲耻³䂳;櫆Āos㖹㖼t;檾ub;櫘Ā;dሢ㗅ot;櫄sĀou㗏㗒l;柉b;櫗arr;楻ult;櫂ĀEe㗤㗦;櫌;抋lus;櫀ƀeiu㗴㘉㘌tƀ;enሜ㗼㘂qĀ;qሢ㖲eqĀ;q㗧㗤m;櫈Ābp㘑㘓;櫔;櫖ƀAan㘜㘠㘭rr;懙rĀhr㘦㘨ë∮Ā;oਫ਩war;椪lig耻ß䃟௡㙑㙝㙠ዎ㙳㙹\0㙾㛂\0\0\0\0\0㛛㜃\0㜉㝬\0\0\0㞇ɲ㙖\0\0㙛get;挖;䏄rë๟ƀaey㙦㙫㙰ron;䅥dil;䅣;䑂lrec;挕r;쀀𝔱Ȁeiko㚆㚝㚵㚼ǲ㚋\0㚑eĀ4fኄኁaƀ;sv㚘㚙㚛䎸ym;䏑Ācn㚢㚲kĀas㚨㚮pproø዁im»ኬsðኞĀas㚺㚮ð዁rn耻þ䃾Ǭ̟㛆⋧es膀×;bd㛏㛐㛘䃗Ā;aᤏ㛕r;樱;樰ƀeps㛡㛣㜀á⩍Ȁ;bcf҆㛬㛰㛴ot;挶ir;櫱Ā;o㛹㛼쀀𝕥rk;櫚á㍢rime;怴ƀaip㜏㜒㝤dåቈ΀adempst㜡㝍㝀㝑㝗㝜㝟ngleʀ;dlqr㜰㜱㜶㝀㝂斵own»ᶻeftĀ;e⠀㜾ñम;扜ightĀ;e㊪㝋ñၚot;旬inus;樺lus;樹b;槍ime;樻ezium;揢ƀcht㝲㝽㞁Āry㝷㝻;쀀𝓉;䑆cy;䑛rok;䅧Āio㞋㞎xô᝷headĀlr㞗㞠eftarro÷ࡏightarrow»ཝऀAHabcdfghlmoprstuw㟐㟓㟗㟤㟰㟼㠎㠜㠣㠴㡑㡝㡫㢩㣌㣒㣪㣶ròϭar;楣Ācr㟜㟢ute耻ú䃺òᅐrǣ㟪\0㟭y;䑞ve;䅭Āiy㟵㟺rc耻û䃻;䑃ƀabh㠃㠆㠋ròᎭlac;䅱aòᏃĀir㠓㠘sht;楾;쀀𝔲rave耻ù䃹š㠧㠱rĀlr㠬㠮»ॗ»ႃlk;斀Āct㠹㡍ɯ㠿\0\0㡊rnĀ;e㡅㡆挜r»㡆op;挏ri;旸Āal㡖㡚cr;䅫肻¨͉Āgp㡢㡦on;䅳f;쀀𝕦̀adhlsuᅋ㡸㡽፲㢑㢠ownáᎳarpoonĀlr㢈㢌efô㠭ighô㠯iƀ;hl㢙㢚㢜䏅»ᏺon»㢚parrows;懈ƀcit㢰㣄㣈ɯ㢶\0\0㣁rnĀ;e㢼㢽挝r»㢽op;挎ng;䅯ri;旹cr;쀀𝓊ƀdir㣙㣝㣢ot;拰lde;䅩iĀ;f㜰㣨»᠓Āam㣯㣲rò㢨l耻ü䃼angle;榧ހABDacdeflnoprsz㤜㤟㤩㤭㦵㦸㦽㧟㧤㧨㧳㧹㧽㨁㨠ròϷarĀ;v㤦㤧櫨;櫩asèϡĀnr㤲㤷grt;榜΀eknprst㓣㥆㥋㥒㥝㥤㦖appá␕othinçẖƀhir㓫⻈㥙opô⾵Ā;hᎷ㥢ïㆍĀiu㥩㥭gmá㎳Ābp㥲㦄setneqĀ;q㥽㦀쀀⊊︀;쀀⫋︀setneqĀ;q㦏㦒쀀⊋︀;쀀⫌︀Āhr㦛㦟etá㚜iangleĀlr㦪㦯eft»थight»ၑy;䐲ash»ံƀelr㧄㧒㧗ƀ;beⷪ㧋㧏ar;抻q;扚lip;拮Ābt㧜ᑨaòᑩr;쀀𝔳tré㦮suĀbp㧯㧱»ജ»൙pf;쀀𝕧roð໻tré㦴Ācu㨆㨋r;쀀𝓋Ābp㨐㨘nĀEe㦀㨖»㥾nĀEe㦒㨞»㦐igzag;榚΀cefoprs㨶㨻㩖㩛㩔㩡㩪irc;䅵Ādi㩀㩑Ābg㩅㩉ar;機eĀ;qᗺ㩏;扙erp;愘r;쀀𝔴pf;쀀𝕨Ā;eᑹ㩦atèᑹcr;쀀𝓌ૣណ㪇\0㪋\0㪐㪛\0\0㪝㪨㪫㪯\0\0㫃㫎\0㫘ៜ៟tré៑r;쀀𝔵ĀAa㪔㪗ròσrò৶;䎾ĀAa㪡㪤ròθrò৫að✓is;拻ƀdptឤ㪵㪾Āfl㪺ឩ;쀀𝕩imåឲĀAa㫇㫊ròώròਁĀcq㫒ីr;쀀𝓍Āpt៖㫜ré។Ѐacefiosu㫰㫽㬈㬌㬑㬕㬛㬡cĀuy㫶㫻te耻ý䃽;䑏Āiy㬂㬆rc;䅷;䑋n耻¥䂥r;쀀𝔶cy;䑗pf;쀀𝕪cr;쀀𝓎Ācm㬦㬩y;䑎l耻ÿ䃿Ԁacdefhiosw㭂㭈㭔㭘㭤㭩㭭㭴㭺㮀cute;䅺Āay㭍㭒ron;䅾;䐷ot;䅼Āet㭝㭡træᕟa;䎶r;쀀𝔷cy;䐶grarr;懝pf;쀀𝕫cr;쀀𝓏Ājn㮅㮇;怍j;怌`.split(``).map(e=>e.charCodeAt(0))),_r=new Uint16Array(`Ȁaglq	\x1Bɭ\0\0p;䀦os;䀧t;䀾t;䀼uot;䀢`.split(``).map(e=>e.charCodeAt(0))),vr=new Map([[0,65533],[128,8364],[130,8218],[131,402],[132,8222],[133,8230],[134,8224],[135,8225],[136,710],[137,8240],[138,352],[139,8249],[140,338],[142,381],[145,8216],[146,8217],[147,8220],[148,8221],[149,8226],[150,8211],[151,8212],[152,732],[153,8482],[154,353],[155,8250],[156,339],[158,382],[159,376]]),yr=String.fromCodePoint??function(e){let t=``;return e>65535&&(e-=65536,t+=String.fromCharCode(e>>>10&1023|55296),e=56320|e&1023),t+=String.fromCharCode(e),t};function br(e){return e>=55296&&e<=57343||e>1114111?65533:vr.get(e)??e}var T;(function(e){e[e.NUM=35]=`NUM`,e[e.SEMI=59]=`SEMI`,e[e.EQUALS=61]=`EQUALS`,e[e.ZERO=48]=`ZERO`,e[e.NINE=57]=`NINE`,e[e.LOWER_A=97]=`LOWER_A`,e[e.LOWER_F=102]=`LOWER_F`,e[e.LOWER_X=120]=`LOWER_X`,e[e.LOWER_Z=122]=`LOWER_Z`,e[e.UPPER_A=65]=`UPPER_A`,e[e.UPPER_F=70]=`UPPER_F`,e[e.UPPER_Z=90]=`UPPER_Z`})(T||={});var xr=32,E;(function(e){e[e.VALUE_LENGTH=49152]=`VALUE_LENGTH`,e[e.BRANCH_LENGTH=16256]=`BRANCH_LENGTH`,e[e.JUMP_TABLE=127]=`JUMP_TABLE`})(E||={});function Sr(e){return e>=T.ZERO&&e<=T.NINE}function Cr(e){return e>=T.UPPER_A&&e<=T.UPPER_F||e>=T.LOWER_A&&e<=T.LOWER_F}function wr(e){return e>=T.UPPER_A&&e<=T.UPPER_Z||e>=T.LOWER_A&&e<=T.LOWER_Z||Sr(e)}function Tr(e){return e===T.EQUALS||wr(e)}var D;(function(e){e[e.EntityStart=0]=`EntityStart`,e[e.NumericStart=1]=`NumericStart`,e[e.NumericDecimal=2]=`NumericDecimal`,e[e.NumericHex=3]=`NumericHex`,e[e.NamedEntity=4]=`NamedEntity`})(D||={});var O;(function(e){e[e.Legacy=0]=`Legacy`,e[e.Strict=1]=`Strict`,e[e.Attribute=2]=`Attribute`})(O||={});var Er=class{constructor(e,t,n){this.decodeTree=e,this.emitCodePoint=t,this.errors=n,this.state=D.EntityStart,this.consumed=1,this.result=0,this.treeIndex=0,this.excess=1,this.decodeMode=O.Strict}startEntity(e){this.decodeMode=e,this.state=D.EntityStart,this.result=0,this.treeIndex=0,this.excess=1,this.consumed=1}write(e,t){switch(this.state){case D.EntityStart:return e.charCodeAt(t)===T.NUM?(this.state=D.NumericStart,this.consumed+=1,this.stateNumericStart(e,t+1)):(this.state=D.NamedEntity,this.stateNamedEntity(e,t));case D.NumericStart:return this.stateNumericStart(e,t);case D.NumericDecimal:return this.stateNumericDecimal(e,t);case D.NumericHex:return this.stateNumericHex(e,t);case D.NamedEntity:return this.stateNamedEntity(e,t)}}stateNumericStart(e,t){return t>=e.length?-1:(e.charCodeAt(t)|xr)===T.LOWER_X?(this.state=D.NumericHex,this.consumed+=1,this.stateNumericHex(e,t+1)):(this.state=D.NumericDecimal,this.stateNumericDecimal(e,t))}addToNumericResult(e,t,n,r){if(t!==n){let i=n-t;this.result=this.result*r**+i+parseInt(e.substr(t,i),r),this.consumed+=i}}stateNumericHex(e,t){let n=t;for(;t<e.length;){let r=e.charCodeAt(t);if(Sr(r)||Cr(r))t+=1;else return this.addToNumericResult(e,n,t,16),this.emitNumericEntity(r,3)}return this.addToNumericResult(e,n,t,16),-1}stateNumericDecimal(e,t){let n=t;for(;t<e.length;){let r=e.charCodeAt(t);if(Sr(r))t+=1;else return this.addToNumericResult(e,n,t,10),this.emitNumericEntity(r,2)}return this.addToNumericResult(e,n,t,10),-1}emitNumericEntity(e,t){var n;if(this.consumed<=t)return(n=this.errors)==null||n.absenceOfDigitsInNumericCharacterReference(this.consumed),0;if(e===T.SEMI)this.consumed+=1;else if(this.decodeMode===O.Strict)return 0;return this.emitCodePoint(br(this.result),this.consumed),this.errors&&(e!==T.SEMI&&this.errors.missingSemicolonAfterCharacterReference(),this.errors.validateNumericCharacterReference(this.result)),this.consumed}stateNamedEntity(e,t){let{decodeTree:n}=this,r=n[this.treeIndex],i=(r&E.VALUE_LENGTH)>>14;for(;t<e.length;t++,this.excess++){let a=e.charCodeAt(t);if(this.treeIndex=Or(n,r,this.treeIndex+Math.max(1,i),a),this.treeIndex<0)return this.result===0||this.decodeMode===O.Attribute&&(i===0||Tr(a))?0:this.emitNotTerminatedNamedEntity();if(r=n[this.treeIndex],i=(r&E.VALUE_LENGTH)>>14,i!==0){if(a===T.SEMI)return this.emitNamedEntityData(this.treeIndex,i,this.consumed+this.excess);this.decodeMode!==O.Strict&&(this.result=this.treeIndex,this.consumed+=this.excess,this.excess=0)}}return-1}emitNotTerminatedNamedEntity(){var e;let{result:t,decodeTree:n}=this,r=(n[t]&E.VALUE_LENGTH)>>14;return this.emitNamedEntityData(t,r,this.consumed),(e=this.errors)==null||e.missingSemicolonAfterCharacterReference(),this.consumed}emitNamedEntityData(e,t,n){let{decodeTree:r}=this;return this.emitCodePoint(t===1?r[e]&~E.VALUE_LENGTH:r[e+1],n),t===3&&this.emitCodePoint(r[e+2],n),n}end(){var e;switch(this.state){case D.NamedEntity:return this.result!==0&&(this.decodeMode!==O.Attribute||this.result===this.treeIndex)?this.emitNotTerminatedNamedEntity():0;case D.NumericDecimal:return this.emitNumericEntity(0,2);case D.NumericHex:return this.emitNumericEntity(0,3);case D.NumericStart:return(e=this.errors)==null||e.absenceOfDigitsInNumericCharacterReference(this.consumed),0;case D.EntityStart:return 0}}};function Dr(e){let t=``,n=new Er(e,e=>t+=yr(e));return function(e,r){let i=0,a=0;for(;(a=e.indexOf(`&`,a))>=0;){t+=e.slice(i,a),n.startEntity(r);let o=n.write(e,a+1);if(o<0){i=a+n.end();break}i=a+o,a=o===0?i+1:i}let o=t+e.slice(i);return t=``,o}}function Or(e,t,n,r){let i=(t&E.BRANCH_LENGTH)>>7,a=t&E.JUMP_TABLE;if(i===0)return a!==0&&r===a?n:-1;if(a){let t=r-a;return t<0||t>=i?-1:e[n+t]-1}let o=n,s=o+i-1;for(;o<=s;){let t=o+s>>>1,n=e[t];if(n<r)o=t+1;else if(n>r)s=t-1;else return e[t+i]}return-1}var kr=Dr(gr);Dr(_r);function Ar(e,t=O.Legacy){return kr(e,t)}var jr=g({arrayReplaceAt:()=>Lr,assign:()=>Ir,escapeHtml:()=>k,escapeRE:()=>Zr,fromCodePoint:()=>zr,has:()=>Fr,isMdAsciiPunct:()=>ei,isPunctChar:()=>$r,isSpace:()=>A,isString:()=>Nr,isValidEntityCode:()=>Rr,isWhiteSpace:()=>Qr,lib:()=>ni,normalizeReference:()=>ti,unescapeAll:()=>Gr,unescapeMd:()=>Wr});function Mr(e){return Object.prototype.toString.call(e)}function Nr(e){return Mr(e)===`[object String]`}var Pr=Object.prototype.hasOwnProperty;function Fr(e,t){return Pr.call(e,t)}function Ir(e){return Array.prototype.slice.call(arguments,1).forEach(function(t){if(t){if(typeof t!=`object`)throw TypeError(t+`must be object`);Object.keys(t).forEach(function(n){e[n]=t[n]})}}),e}function Lr(e,t,n){return[].concat(e.slice(0,t),n,e.slice(t+1))}function Rr(e){return!(e>=55296&&e<=57343||e>=64976&&e<=65007||(e&65535)==65535||(e&65535)==65534||e>=0&&e<=8||e===11||e>=14&&e<=31||e>=127&&e<=159||e>1114111)}function zr(e){if(e>65535){e-=65536;let t=55296+(e>>10),n=56320+(e&1023);return String.fromCharCode(t,n)}return String.fromCharCode(e)}var Br=/\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g,Vr=RegExp(Br.source+`|&([a-z#][a-z0-9]{1,31});`,`gi`),Hr=/^#((?:x[a-f0-9]{1,8}|[0-9]{1,8}))$/i;function Ur(e,t){if(t.charCodeAt(0)===35&&Hr.test(t)){let n=t[1].toLowerCase()===`x`?parseInt(t.slice(2),16):parseInt(t.slice(1),10);return Rr(n)?zr(n):e}let n=Ar(e);return n===e?e:n}function Wr(e){return e.indexOf(`\\`)<0?e:e.replace(Br,`$1`)}function Gr(e){return e.indexOf(`\\`)<0&&e.indexOf(`&`)<0?e:e.replace(Vr,function(e,t,n){return t||Ur(e,n)})}var Kr=/[&<>"]/,qr=/[&<>"]/g,Jr={"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`};function Yr(e){return Jr[e]}function k(e){return Kr.test(e)?e.replace(qr,Yr):e}var Xr=/[.?*+^$[\]\\(){}|-]/g;function Zr(e){return e.replace(Xr,`\\$&`)}function A(e){switch(e){case 9:case 32:return!0}return!1}function Qr(e){if(e>=8192&&e<=8202)return!0;switch(e){case 9:case 10:case 11:case 12:case 13:case 32:case 160:case 5760:case 8239:case 8287:case 12288:return!0}return!1}function $r(e){return fr.test(e)||pr.test(e)}function ei(e){switch(e){case 33:case 34:case 35:case 36:case 37:case 38:case 39:case 40:case 41:case 42:case 43:case 44:case 45:case 46:case 47:case 58:case 59:case 60:case 61:case 62:case 63:case 64:case 91:case 92:case 93:case 94:case 95:case 96:case 123:case 124:case 125:case 126:return!0;default:return!1}}function ti(e){return e=e.trim().replace(/\s+/g,` `),e.toLowerCase().toUpperCase()}var ni={mdurl:cr,ucmicro:hr};function ri(e,t,n){let r,i,a,o,s=e.posMax,c=e.pos;for(e.pos=t+1,r=1;e.pos<s;){if(a=e.src.charCodeAt(e.pos),a===93&&(r--,r===0)){i=!0;break}if(o=e.pos,e.md.inline.skipToken(e),a===91){if(o===e.pos-1)r++;else if(n)return e.pos=c,-1}}let l=-1;return i&&(l=e.pos),e.pos=c,l}function ii(e,t,n){let r,i=t,a={ok:!1,pos:0,str:``};if(e.charCodeAt(i)===60){for(i++;i<n;){if(r=e.charCodeAt(i),r===10||r===60)return a;if(r===62)return a.pos=i+1,a.str=Gr(e.slice(t+1,i)),a.ok=!0,a;if(r===92&&i+1<n){i+=2;continue}i++}return a}let o=0;for(;i<n&&(r=e.charCodeAt(i),!(r===32||r<32||r===127));){if(r===92&&i+1<n){if(e.charCodeAt(i+1)===32)break;i+=2;continue}if(r===40&&(o++,o>32))return a;if(r===41){if(o===0)break;o--}i++}return t===i||o!==0?a:(a.str=Gr(e.slice(t,i)),a.pos=i,a.ok=!0,a)}function ai(e,t,n,r){let i,a=t,o={ok:!1,can_continue:!1,pos:0,str:``,marker:0};if(r)o.str=r.str,o.marker=r.marker;else{if(a>=n)return o;let r=e.charCodeAt(a);if(r!==34&&r!==39&&r!==40)return o;t++,a++,r===40&&(r=41),o.marker=r}for(;a<n;){if(i=e.charCodeAt(a),i===o.marker)return o.pos=a+1,o.str+=Gr(e.slice(t,a)),o.ok=!0,o;if(i===40&&o.marker===41)return o;i===92&&a+1<n&&a++,a++}return o.can_continue=!0,o.str+=Gr(e.slice(t,a)),o}var oi=g({parseLinkDestination:()=>ii,parseLinkLabel:()=>ri,parseLinkTitle:()=>ai}),j={};j.code_inline=function(e,t,n,r,i){let a=e[t];return`<code`+i.renderAttrs(a)+`>`+k(a.content)+`</code>`},j.code_block=function(e,t,n,r,i){let a=e[t];return`<pre`+i.renderAttrs(a)+`><code>`+k(e[t].content)+`</code></pre>
`},j.fence=function(e,t,n,r,i){let a=e[t],o=a.info?Gr(a.info).trim():``,s=``,c=``;if(o){let e=o.split(/(\s+)/g);s=e[0],c=e.slice(2).join(``)}let l;if(l=n.highlight&&n.highlight(a.content,s,c)||k(a.content),l.indexOf(`<pre`)===0)return l+`
`;if(o){let e=a.attrIndex(`class`),t=a.attrs?a.attrs.slice():[];e<0?t.push([`class`,n.langPrefix+s]):(t[e]=t[e].slice(),t[e][1]+=` `+n.langPrefix+s);let r={attrs:t};return`<pre><code${i.renderAttrs(r)}>${l}</code></pre>\n`}return`<pre><code${i.renderAttrs(a)}>${l}</code></pre>\n`},j.image=function(e,t,n,r,i){let a=e[t];return a.attrs[a.attrIndex(`alt`)][1]=i.renderInlineAsText(a.children,n,r),i.renderToken(e,t,n)},j.hardbreak=function(e,t,n){return n.xhtmlOut?`<br />
`:`<br>
`},j.softbreak=function(e,t,n){return n.breaks?n.xhtmlOut?`<br />
`:`<br>
`:`
`},j.text=function(e,t){return k(e[t].content)},j.html_block=function(e,t){return e[t].content},j.html_inline=function(e,t){return e[t].content};function M(){this.rules=Ir({},j)}M.prototype.renderAttrs=function(e){let t,n,r;if(!e.attrs)return``;for(r=``,t=0,n=e.attrs.length;t<n;t++)r+=` `+k(e.attrs[t][0])+`="`+k(e.attrs[t][1])+`"`;return r},M.prototype.renderToken=function(e,t,n){let r=e[t],i=``;if(r.hidden)return``;r.block&&r.nesting!==-1&&t&&e[t-1].hidden&&(i+=`
`),i+=(r.nesting===-1?`</`:`<`)+r.tag,i+=this.renderAttrs(r),r.nesting===0&&n.xhtmlOut&&(i+=` /`);let a=!1;if(r.block&&(a=!0,r.nesting===1&&t+1<e.length)){let n=e[t+1];(n.type===`inline`||n.hidden||n.nesting===-1&&n.tag===r.tag)&&(a=!1)}return i+=a?`>
`:`>`,i},M.prototype.renderInline=function(e,t,n){let r=``,i=this.rules;for(let a=0,o=e.length;a<o;a++){let o=e[a].type;i[o]===void 0?r+=this.renderToken(e,a,t):r+=i[o](e,a,t,n,this)}return r},M.prototype.renderInlineAsText=function(e,t,n){let r=``;for(let i=0,a=e.length;i<a;i++)switch(e[i].type){case`text`:r+=e[i].content;break;case`image`:r+=this.renderInlineAsText(e[i].children,t,n);break;case`html_inline`:case`html_block`:r+=e[i].content;break;case`softbreak`:case`hardbreak`:r+=`
`;break;default:}return r},M.prototype.render=function(e,t,n){let r=``,i=this.rules;for(let a=0,o=e.length;a<o;a++){let o=e[a].type;o===`inline`?r+=this.renderInline(e[a].children,t,n):i[o]===void 0?r+=this.renderToken(e,a,t,n):r+=i[o](e,a,t,n,this)}return r};function N(){this.__rules__=[],this.__cache__=null}N.prototype.__find__=function(e){for(let t=0;t<this.__rules__.length;t++)if(this.__rules__[t].name===e)return t;return-1},N.prototype.__compile__=function(){let e=this,t=[``];e.__rules__.forEach(function(e){e.enabled&&e.alt.forEach(function(e){t.indexOf(e)<0&&t.push(e)})}),e.__cache__={},t.forEach(function(t){e.__cache__[t]=[],e.__rules__.forEach(function(n){n.enabled&&(t&&n.alt.indexOf(t)<0||e.__cache__[t].push(n.fn))})})},N.prototype.at=function(e,t,n){let r=this.__find__(e),i=n||{};if(r===-1)throw Error(`Parser rule not found: `+e);this.__rules__[r].fn=t,this.__rules__[r].alt=i.alt||[],this.__cache__=null},N.prototype.before=function(e,t,n,r){let i=this.__find__(e),a=r||{};if(i===-1)throw Error(`Parser rule not found: `+e);this.__rules__.splice(i,0,{name:t,enabled:!0,fn:n,alt:a.alt||[]}),this.__cache__=null},N.prototype.after=function(e,t,n,r){let i=this.__find__(e),a=r||{};if(i===-1)throw Error(`Parser rule not found: `+e);this.__rules__.splice(i+1,0,{name:t,enabled:!0,fn:n,alt:a.alt||[]}),this.__cache__=null},N.prototype.push=function(e,t,n){let r=n||{};this.__rules__.push({name:e,enabled:!0,fn:t,alt:r.alt||[]}),this.__cache__=null},N.prototype.enable=function(e,t){Array.isArray(e)||(e=[e]);let n=[];return e.forEach(function(e){let r=this.__find__(e);if(r<0){if(t)return;throw Error(`Rules manager: invalid rule name `+e)}this.__rules__[r].enabled=!0,n.push(e)},this),this.__cache__=null,n},N.prototype.enableOnly=function(e,t){Array.isArray(e)||(e=[e]),this.__rules__.forEach(function(e){e.enabled=!1}),this.enable(e,t)},N.prototype.disable=function(e,t){Array.isArray(e)||(e=[e]);let n=[];return e.forEach(function(e){let r=this.__find__(e);if(r<0){if(t)return;throw Error(`Rules manager: invalid rule name `+e)}this.__rules__[r].enabled=!1,n.push(e)},this),this.__cache__=null,n},N.prototype.getRules=function(e){return this.__cache__===null&&this.__compile__(),this.__cache__[e]||[]};function P(e,t,n){this.type=e,this.tag=t,this.attrs=null,this.map=null,this.nesting=n,this.level=0,this.children=null,this.content=``,this.markup=``,this.info=``,this.meta=null,this.block=!1,this.hidden=!1}P.prototype.attrIndex=function(e){if(!this.attrs)return-1;let t=this.attrs;for(let n=0,r=t.length;n<r;n++)if(t[n][0]===e)return n;return-1},P.prototype.attrPush=function(e){this.attrs?this.attrs.push(e):this.attrs=[e]},P.prototype.attrSet=function(e,t){let n=this.attrIndex(e),r=[e,t];n<0?this.attrPush(r):this.attrs[n]=r},P.prototype.attrGet=function(e){let t=this.attrIndex(e),n=null;return t>=0&&(n=this.attrs[t][1]),n},P.prototype.attrJoin=function(e,t){let n=this.attrIndex(e);n<0?this.attrPush([e,t]):this.attrs[n][1]=this.attrs[n][1]+` `+t};function si(e,t,n){this.src=e,this.env=n,this.tokens=[],this.inlineMode=!1,this.md=t}si.prototype.Token=P;var ci=/\r\n?|\n/g,li=/\0/g;function ui(e){let t;t=e.src.replace(ci,`
`),t=t.replace(li,`�`),e.src=t}function di(e){let t;e.inlineMode?(t=new e.Token(`inline`,``,0),t.content=e.src,t.map=[0,1],t.children=[],e.tokens.push(t)):e.md.block.parse(e.src,e.md,e.env,e.tokens)}function fi(e){let t=e.tokens;for(let n=0,r=t.length;n<r;n++){let r=t[n];r.type===`inline`&&e.md.inline.parse(r.content,e.md,e.env,r.children)}}function pi(e){return/^<a[>\s]/i.test(e)}function mi(e){return/^<\/a\s*>/i.test(e)}function hi(e){let t=e.tokens;if(e.md.options.linkify)for(let n=0,r=t.length;n<r;n++){if(t[n].type!==`inline`||!e.md.linkify.pretest(t[n].content))continue;let r=t[n].children,i=0;for(let a=r.length-1;a>=0;a--){let o=r[a];if(o.type===`link_close`){for(a--;r[a].level!==o.level&&r[a].type!==`link_open`;)a--;continue}if(o.type===`html_inline`&&(pi(o.content)&&i>0&&i--,mi(o.content)&&i++),!(i>0)&&o.type===`text`&&e.md.linkify.test(o.content)){let i=o.content,s=e.md.linkify.match(i),c=[],l=o.level,u=0;s.length>0&&s[0].index===0&&a>0&&r[a-1].type===`text_special`&&(s=s.slice(1));for(let t=0;t<s.length;t++){let n=s[t].url,r=e.md.normalizeLink(n);if(!e.md.validateLink(r))continue;let a=s[t].text;a=s[t].schema?s[t].schema===`mailto:`&&!/^mailto:/i.test(a)?e.md.normalizeLinkText(`mailto:`+a).replace(/^mailto:/,``):e.md.normalizeLinkText(a):e.md.normalizeLinkText(`http://`+a).replace(/^http:\/\//,``);let o=s[t].index;if(o>u){let t=new e.Token(`text`,``,0);t.content=i.slice(u,o),t.level=l,c.push(t)}let d=new e.Token(`link_open`,`a`,1);d.attrs=[[`href`,r]],d.level=l++,d.markup=`linkify`,d.info=`auto`,c.push(d);let f=new e.Token(`text`,``,0);f.content=a,f.level=l,c.push(f);let p=new e.Token(`link_close`,`a`,-1);p.level=--l,p.markup=`linkify`,p.info=`auto`,c.push(p),u=s[t].lastIndex}if(u<i.length){let t=new e.Token(`text`,``,0);t.content=i.slice(u),t.level=l,c.push(t)}t[n].children=r=Lr(r,a,c)}}}}var gi=/\+-|\.\.|\?\?\?\?|!!!!|,,|--/,_i=/\((c|tm|r)\)/i,vi=/\((c|tm|r)\)/gi,yi={c:`©`,r:`®`,tm:`™`};function bi(e,t){return yi[t.toLowerCase()]}function xi(e){let t=0;for(let n=e.length-1;n>=0;n--){let r=e[n];r.type===`text`&&!t&&(r.content=r.content.replace(vi,bi)),r.type===`link_open`&&r.info===`auto`&&t--,r.type===`link_close`&&r.info===`auto`&&t++}}function Si(e){let t=0;for(let n=e.length-1;n>=0;n--){let r=e[n];r.type===`text`&&!t&&gi.test(r.content)&&(r.content=r.content.replace(/\+-/g,`±`).replace(/\.{2,}/g,`…`).replace(/([?!])…/g,`$1..`).replace(/([?!]){4,}/g,`$1$1$1`).replace(/,{2,}/g,`,`).replace(/(^|[^-])---(?=[^-]|$)/gm,`$1—`).replace(/(^|\s)--(?=\s|$)/gm,`$1–`).replace(/(^|[^-\s])--(?=[^-\s]|$)/gm,`$1–`)),r.type===`link_open`&&r.info===`auto`&&t--,r.type===`link_close`&&r.info===`auto`&&t++}}function Ci(e){let t;if(e.md.options.typographer)for(t=e.tokens.length-1;t>=0;t--)e.tokens[t].type===`inline`&&(_i.test(e.tokens[t].content)&&xi(e.tokens[t].children),gi.test(e.tokens[t].content)&&Si(e.tokens[t].children))}var wi=/['"]/,Ti=/['"]/g,Ei=`’`;function Di(e,t,n){return e.slice(0,t)+n+e.slice(t+1)}function Oi(e,t){let n,r=[];for(let i=0;i<e.length;i++){let a=e[i],o=e[i].level;for(n=r.length-1;n>=0&&!(r[n].level<=o);n--);if(r.length=n+1,a.type!==`text`)continue;let s=a.content,c=0,l=s.length;OUTER:for(;c<l;){Ti.lastIndex=c;let u=Ti.exec(s);if(!u)break;let d=!0,f=!0;c=u.index+1;let p=u[0]===`'`,m=32;if(u.index-1>=0)m=s.charCodeAt(u.index-1);else for(n=i-1;n>=0&&!(e[n].type===`softbreak`||e[n].type===`hardbreak`);n--)if(e[n].content){m=e[n].content.charCodeAt(e[n].content.length-1);break}let h=32;if(c<l)h=s.charCodeAt(c);else for(n=i+1;n<e.length&&!(e[n].type===`softbreak`||e[n].type===`hardbreak`);n++)if(e[n].content){h=e[n].content.charCodeAt(0);break}let g=ei(m)||$r(String.fromCharCode(m)),_=ei(h)||$r(String.fromCharCode(h)),v=Qr(m),y=Qr(h);if(y?d=!1:_&&(v||g||(d=!1)),v?f=!1:g&&(y||_||(f=!1)),h===34&&u[0]===`"`&&m>=48&&m<=57&&(f=d=!1),d&&f&&(d=g,f=_),!d&&!f){p&&(a.content=Di(a.content,u.index,Ei));continue}if(f)for(n=r.length-1;n>=0;n--){let d=r[n];if(r[n].level<o)break;if(d.single===p&&r[n].level===o){d=r[n];let o,f;p?(o=t.md.options.quotes[2],f=t.md.options.quotes[3]):(o=t.md.options.quotes[0],f=t.md.options.quotes[1]),a.content=Di(a.content,u.index,f),e[d.token].content=Di(e[d.token].content,d.pos,o),c+=f.length-1,d.token===i&&(c+=o.length-1),s=a.content,l=s.length,r.length=n;continue OUTER}}d?r.push({token:i,pos:u.index,single:p,level:o}):f&&p&&(a.content=Di(a.content,u.index,Ei))}}}function ki(e){if(e.md.options.typographer)for(let t=e.tokens.length-1;t>=0;t--)e.tokens[t].type!==`inline`||!wi.test(e.tokens[t].content)||Oi(e.tokens[t].children,e)}function Ai(e){let t,n,r=e.tokens,i=r.length;for(let e=0;e<i;e++){if(r[e].type!==`inline`)continue;let i=r[e].children,a=i.length;for(t=0;t<a;t++)i[t].type===`text_special`&&(i[t].type=`text`);for(t=n=0;t<a;t++)i[t].type===`text`&&t+1<a&&i[t+1].type===`text`?i[t+1].content=i[t].content+i[t+1].content:(t!==n&&(i[n]=i[t]),n++);t!==n&&(i.length=n)}}var ji=[[`normalize`,ui],[`block`,di],[`inline`,fi],[`linkify`,hi],[`replacements`,Ci],[`smartquotes`,ki],[`text_join`,Ai]];function Mi(){this.ruler=new N;for(let e=0;e<ji.length;e++)this.ruler.push(ji[e][0],ji[e][1])}Mi.prototype.process=function(e){let t=this.ruler.getRules(``);for(let n=0,r=t.length;n<r;n++)t[n](e)},Mi.prototype.State=si;function F(e,t,n,r){this.src=e,this.md=t,this.env=n,this.tokens=r,this.bMarks=[],this.eMarks=[],this.tShift=[],this.sCount=[],this.bsCount=[],this.blkIndent=0,this.line=0,this.lineMax=0,this.tight=!1,this.ddIndent=-1,this.listIndent=-1,this.parentType=`root`,this.level=0;let i=this.src;for(let e=0,t=0,n=0,r=0,a=i.length,o=!1;t<a;t++){let s=i.charCodeAt(t);if(!o)if(A(s)){n++,s===9?r+=4-r%4:r++;continue}else o=!0;(s===10||t===a-1)&&(s!==10&&t++,this.bMarks.push(e),this.eMarks.push(t),this.tShift.push(n),this.sCount.push(r),this.bsCount.push(0),o=!1,n=0,r=0,e=t+1)}this.bMarks.push(i.length),this.eMarks.push(i.length),this.tShift.push(0),this.sCount.push(0),this.bsCount.push(0),this.lineMax=this.bMarks.length-1}F.prototype.push=function(e,t,n){let r=new P(e,t,n);return r.block=!0,n<0&&this.level--,r.level=this.level,n>0&&this.level++,this.tokens.push(r),r},F.prototype.isEmpty=function(e){return this.bMarks[e]+this.tShift[e]>=this.eMarks[e]},F.prototype.skipEmptyLines=function(e){for(let t=this.lineMax;e<t&&!(this.bMarks[e]+this.tShift[e]<this.eMarks[e]);e++);return e},F.prototype.skipSpaces=function(e){for(let t=this.src.length;e<t&&A(this.src.charCodeAt(e));e++);return e},F.prototype.skipSpacesBack=function(e,t){if(e<=t)return e;for(;e>t;)if(!A(this.src.charCodeAt(--e)))return e+1;return e},F.prototype.skipChars=function(e,t){for(let n=this.src.length;e<n&&this.src.charCodeAt(e)===t;e++);return e},F.prototype.skipCharsBack=function(e,t,n){if(e<=n)return e;for(;e>n;)if(t!==this.src.charCodeAt(--e))return e+1;return e},F.prototype.getLines=function(e,t,n,r){if(e>=t)return``;let i=Array(t-e);for(let a=0,o=e;o<t;o++,a++){let e=0,s=this.bMarks[o],c=s,l;for(l=o+1<t||r?this.eMarks[o]+1:this.eMarks[o];c<l&&e<n;){let t=this.src.charCodeAt(c);if(A(t))t===9?e+=4-(e+this.bsCount[o])%4:e++;else if(c-s<this.tShift[o])e++;else break;c++}e>n?i[a]=Array(e-n+1).join(` `)+this.src.slice(c,l):i[a]=this.src.slice(c,l)}return i.join(``)},F.prototype.Token=P;var Ni=65536;function Pi(e,t){let n=e.bMarks[t]+e.tShift[t],r=e.eMarks[t];return e.src.slice(n,r)}function Fi(e){let t=[],n=e.length,r=0,i=e.charCodeAt(r),a=!1,o=0,s=``;for(;r<n;)i===124&&(a?(s+=e.substring(o,r-1),o=r):(t.push(s+e.substring(o,r)),s=``,o=r+1)),a=i===92,r++,i=e.charCodeAt(r);return t.push(s+e.substring(o)),t}function Ii(e,t,n,r){if(t+2>n)return!1;let i=t+1;if(e.sCount[i]<e.blkIndent||e.sCount[i]-e.blkIndent>=4)return!1;let a=e.bMarks[i]+e.tShift[i];if(a>=e.eMarks[i])return!1;let o=e.src.charCodeAt(a++);if(o!==124&&o!==45&&o!==58||a>=e.eMarks[i])return!1;let s=e.src.charCodeAt(a++);if(s!==124&&s!==45&&s!==58&&!A(s)||o===45&&A(s))return!1;for(;a<e.eMarks[i];){let t=e.src.charCodeAt(a);if(t!==124&&t!==45&&t!==58&&!A(t))return!1;a++}let c=Pi(e,t+1),l=c.split(`|`),u=[];for(let e=0;e<l.length;e++){let t=l[e].trim();if(!t){if(e===0||e===l.length-1)continue;return!1}if(!/^:?-+:?$/.test(t))return!1;t.charCodeAt(t.length-1)===58?u.push(t.charCodeAt(0)===58?`center`:`right`):t.charCodeAt(0)===58?u.push(`left`):u.push(``)}if(c=Pi(e,t).trim(),c.indexOf(`|`)===-1||e.sCount[t]-e.blkIndent>=4)return!1;l=Fi(c),l.length&&l[0]===``&&l.shift(),l.length&&l[l.length-1]===``&&l.pop();let d=l.length;if(d===0||d!==u.length)return!1;if(r)return!0;let f=e.parentType;e.parentType=`table`;let p=e.md.block.ruler.getRules(`blockquote`),m=e.push(`table_open`,`table`,1),h=[t,0];m.map=h;let g=e.push(`thead_open`,`thead`,1);g.map=[t,t+1];let _=e.push(`tr_open`,`tr`,1);_.map=[t,t+1];for(let t=0;t<l.length;t++){let n=e.push(`th_open`,`th`,1);u[t]&&(n.attrs=[[`style`,`text-align:`+u[t]]]);let r=e.push(`inline`,``,0);r.content=l[t].trim(),r.children=[],e.push(`th_close`,`th`,-1)}e.push(`tr_close`,`tr`,-1),e.push(`thead_close`,`thead`,-1);let v,y=0;for(i=t+2;i<n&&!(e.sCount[i]<e.blkIndent);i++){let r=!1;for(let t=0,a=p.length;t<a;t++)if(p[t](e,i,n,!0)){r=!0;break}if(r||(c=Pi(e,i).trim(),!c)||e.sCount[i]-e.blkIndent>=4||(l=Fi(c),l.length&&l[0]===``&&l.shift(),l.length&&l[l.length-1]===``&&l.pop(),y+=d-l.length,y>Ni))break;if(i===t+2){let n=e.push(`tbody_open`,`tbody`,1);n.map=v=[t+2,0]}let a=e.push(`tr_open`,`tr`,1);a.map=[i,i+1];for(let t=0;t<d;t++){let n=e.push(`td_open`,`td`,1);u[t]&&(n.attrs=[[`style`,`text-align:`+u[t]]]);let r=e.push(`inline`,``,0);r.content=l[t]?l[t].trim():``,r.children=[],e.push(`td_close`,`td`,-1)}e.push(`tr_close`,`tr`,-1)}return v&&(e.push(`tbody_close`,`tbody`,-1),v[1]=i),e.push(`table_close`,`table`,-1),h[1]=i,e.parentType=f,e.line=i,!0}function Li(e,t,n){if(e.sCount[t]-e.blkIndent<4)return!1;let r=t+1,i=r;for(;r<n;){if(e.isEmpty(r)){r++;continue}if(e.sCount[r]-e.blkIndent>=4){r++,i=r;continue}break}e.line=i;let a=e.push(`code_block`,`code`,0);return a.content=e.getLines(t,i,4+e.blkIndent,!1)+`
`,a.map=[t,e.line],!0}function Ri(e,t,n,r){let i=e.bMarks[t]+e.tShift[t],a=e.eMarks[t];if(e.sCount[t]-e.blkIndent>=4||i+3>a)return!1;let o=e.src.charCodeAt(i);if(o!==126&&o!==96)return!1;let s=i;i=e.skipChars(i,o);let c=i-s;if(c<3)return!1;let l=e.src.slice(s,i),u=e.src.slice(i,a);if(o===96&&u.indexOf(String.fromCharCode(o))>=0)return!1;if(r)return!0;let d=t,f=!1;for(;d++,!(d>=n||(i=s=e.bMarks[d]+e.tShift[d],a=e.eMarks[d],i<a&&e.sCount[d]<e.blkIndent));)if(e.src.charCodeAt(i)===o&&!(e.sCount[d]-e.blkIndent>=4)&&(i=e.skipChars(i,o),!(i-s<c)&&(i=e.skipSpaces(i),!(i<a)))){f=!0;break}c=e.sCount[t],e.line=d+ +!!f;let p=e.push(`fence`,`code`,0);return p.info=u,p.content=e.getLines(t+1,d,c,!0),p.markup=l,p.map=[t,e.line],!0}function zi(e,t,n,r){let i=e.bMarks[t]+e.tShift[t],a=e.eMarks[t],o=e.lineMax;if(e.sCount[t]-e.blkIndent>=4||e.src.charCodeAt(i)!==62)return!1;if(r)return!0;let s=[],c=[],l=[],u=[],d=e.md.block.ruler.getRules(`blockquote`),f=e.parentType;e.parentType=`blockquote`;let p=!1,m;for(m=t;m<n;m++){let t=e.sCount[m]<e.blkIndent;if(i=e.bMarks[m]+e.tShift[m],a=e.eMarks[m],i>=a)break;if(e.src.charCodeAt(i++)===62&&!t){let t=e.sCount[m]+1,n,r;e.src.charCodeAt(i)===32?(i++,t++,r=!1,n=!0):e.src.charCodeAt(i)===9?(n=!0,(e.bsCount[m]+t)%4==3?(i++,t++,r=!1):r=!0):n=!1;let o=t;for(s.push(e.bMarks[m]),e.bMarks[m]=i;i<a;){let t=e.src.charCodeAt(i);if(A(t))t===9?o+=4-(o+e.bsCount[m]+ +!!r)%4:o++;else break;i++}p=i>=a,c.push(e.bsCount[m]),e.bsCount[m]=e.sCount[m]+1+ +!!n,l.push(e.sCount[m]),e.sCount[m]=o-t,u.push(e.tShift[m]),e.tShift[m]=i-e.bMarks[m];continue}if(p)break;let r=!1;for(let t=0,i=d.length;t<i;t++)if(d[t](e,m,n,!0)){r=!0;break}if(r){e.lineMax=m,e.blkIndent!==0&&(s.push(e.bMarks[m]),c.push(e.bsCount[m]),u.push(e.tShift[m]),l.push(e.sCount[m]),e.sCount[m]-=e.blkIndent);break}s.push(e.bMarks[m]),c.push(e.bsCount[m]),u.push(e.tShift[m]),l.push(e.sCount[m]),e.sCount[m]=-1}let h=e.blkIndent;e.blkIndent=0;let g=e.push(`blockquote_open`,`blockquote`,1);g.markup=`>`;let _=[t,0];g.map=_,e.md.block.tokenize(e,t,m);let v=e.push(`blockquote_close`,`blockquote`,-1);v.markup=`>`,e.lineMax=o,e.parentType=f,_[1]=e.line;for(let n=0;n<u.length;n++)e.bMarks[n+t]=s[n],e.tShift[n+t]=u[n],e.sCount[n+t]=l[n],e.bsCount[n+t]=c[n];return e.blkIndent=h,!0}function Bi(e,t,n,r){let i=e.eMarks[t];if(e.sCount[t]-e.blkIndent>=4)return!1;let a=e.bMarks[t]+e.tShift[t],o=e.src.charCodeAt(a++);if(o!==42&&o!==45&&o!==95)return!1;let s=1;for(;a<i;){let t=e.src.charCodeAt(a++);if(t!==o&&!A(t))return!1;t===o&&s++}if(s<3)return!1;if(r)return!0;e.line=t+1;let c=e.push(`hr`,`hr`,0);return c.map=[t,e.line],c.markup=Array(s+1).join(String.fromCharCode(o)),!0}function Vi(e,t){let n=e.eMarks[t],r=e.bMarks[t]+e.tShift[t],i=e.src.charCodeAt(r++);return i!==42&&i!==45&&i!==43||r<n&&!A(e.src.charCodeAt(r))?-1:r}function Hi(e,t){let n=e.bMarks[t]+e.tShift[t],r=e.eMarks[t],i=n;if(i+1>=r)return-1;let a=e.src.charCodeAt(i++);if(a<48||a>57)return-1;for(;;){if(i>=r)return-1;if(a=e.src.charCodeAt(i++),a>=48&&a<=57){if(i-n>=10)return-1;continue}if(a===41||a===46)break;return-1}return i<r&&(a=e.src.charCodeAt(i),!A(a))?-1:i}function Ui(e,t){let n=e.level+2;for(let r=t+2,i=e.tokens.length-2;r<i;r++)e.tokens[r].level===n&&e.tokens[r].type===`paragraph_open`&&(e.tokens[r+2].hidden=!0,e.tokens[r].hidden=!0,r+=2)}function Wi(e,t,n,r){let i,a,o,s,c=t,l=!0;if(e.sCount[c]-e.blkIndent>=4||e.listIndent>=0&&e.sCount[c]-e.listIndent>=4&&e.sCount[c]<e.blkIndent)return!1;let u=!1;r&&e.parentType===`paragraph`&&e.sCount[c]>=e.blkIndent&&(u=!0);let d,f,p;if((p=Hi(e,c))>=0){if(d=!0,o=e.bMarks[c]+e.tShift[c],f=Number(e.src.slice(o,p-1)),u&&f!==1)return!1}else if((p=Vi(e,c))>=0)d=!1;else return!1;if(u&&e.skipSpaces(p)>=e.eMarks[c])return!1;if(r)return!0;let m=e.src.charCodeAt(p-1),h=e.tokens.length;d?(s=e.push(`ordered_list_open`,`ol`,1),f!==1&&(s.attrs=[[`start`,f]])):s=e.push(`bullet_list_open`,`ul`,1);let g=[c,0];s.map=g,s.markup=String.fromCharCode(m);let _=!1,v=e.md.block.ruler.getRules(`list`),y=e.parentType;for(e.parentType=`list`;c<n;){a=p,i=e.eMarks[c];let t=e.sCount[c]+p-(e.bMarks[c]+e.tShift[c]),r=t;for(;a<i;){let t=e.src.charCodeAt(a);if(t===9)r+=4-(r+e.bsCount[c])%4;else if(t===32)r++;else break;a++}let u=a,f;f=u>=i?1:r-t,f>4&&(f=1);let h=t+f;s=e.push(`list_item_open`,`li`,1),s.markup=String.fromCharCode(m);let g=[c,0];s.map=g,d&&(s.info=e.src.slice(o,p-1));let y=e.tight,b=e.tShift[c],ee=e.sCount[c],te=e.listIndent;if(e.listIndent=e.blkIndent,e.blkIndent=h,e.tight=!0,e.tShift[c]=u-e.bMarks[c],e.sCount[c]=r,u>=i&&e.isEmpty(c+1)?e.line=Math.min(e.line+2,n):e.md.block.tokenize(e,c,n,!0),(!e.tight||_)&&(l=!1),_=e.line-c>1&&e.isEmpty(e.line-1),e.blkIndent=e.listIndent,e.listIndent=te,e.tShift[c]=b,e.sCount[c]=ee,e.tight=y,s=e.push(`list_item_close`,`li`,-1),s.markup=String.fromCharCode(m),c=e.line,g[1]=c,c>=n||e.sCount[c]<e.blkIndent||e.sCount[c]-e.blkIndent>=4)break;let ne=!1;for(let t=0,r=v.length;t<r;t++)if(v[t](e,c,n,!0)){ne=!0;break}if(ne)break;if(d){if(p=Hi(e,c),p<0)break;o=e.bMarks[c]+e.tShift[c]}else if(p=Vi(e,c),p<0)break;if(m!==e.src.charCodeAt(p-1))break}return s=d?e.push(`ordered_list_close`,`ol`,-1):e.push(`bullet_list_close`,`ul`,-1),s.markup=String.fromCharCode(m),g[1]=c,e.line=c,e.parentType=y,l&&Ui(e,h),!0}function Gi(e,t,n,r){let i=e.bMarks[t]+e.tShift[t],a=e.eMarks[t],o=t+1;if(e.sCount[t]-e.blkIndent>=4||e.src.charCodeAt(i)!==91)return!1;function s(t){let n=e.lineMax;if(t>=n||e.isEmpty(t))return null;let r=!1;if(e.sCount[t]-e.blkIndent>3&&(r=!0),e.sCount[t]<0&&(r=!0),!r){let r=e.md.block.ruler.getRules(`reference`),i=e.parentType;e.parentType=`reference`;let a=!1;for(let i=0,o=r.length;i<o;i++)if(r[i](e,t,n,!0)){a=!0;break}if(e.parentType=i,a)return null}let i=e.bMarks[t]+e.tShift[t],a=e.eMarks[t];return e.src.slice(i,a+1)}let c=e.src.slice(i,a+1);a=c.length;let l=-1;for(i=1;i<a;i++){let e=c.charCodeAt(i);if(e===91)return!1;if(e===93){l=i;break}else if(e===10){let e=s(o);e!==null&&(c+=e,a=c.length,o++)}else if(e===92&&(i++,i<a&&c.charCodeAt(i)===10)){let e=s(o);e!==null&&(c+=e,a=c.length,o++)}}if(l<0||c.charCodeAt(l+1)!==58)return!1;for(i=l+2;i<a;i++){let e=c.charCodeAt(i);if(e===10){let e=s(o);e!==null&&(c+=e,a=c.length,o++)}else if(!A(e))break}let u=e.md.helpers.parseLinkDestination(c,i,a);if(!u.ok)return!1;let d=e.md.normalizeLink(u.str);if(!e.md.validateLink(d))return!1;i=u.pos;let f=i,p=o,m=i;for(;i<a;i++){let e=c.charCodeAt(i);if(e===10){let e=s(o);e!==null&&(c+=e,a=c.length,o++)}else if(!A(e))break}let h=e.md.helpers.parseLinkTitle(c,i,a);for(;h.can_continue;){let t=s(o);if(t===null)break;c+=t,i=a,a=c.length,o++,h=e.md.helpers.parseLinkTitle(c,i,a,h)}let g;for(i<a&&m!==i&&h.ok?(g=h.str,i=h.pos):(g=``,i=f,o=p);i<a&&A(c.charCodeAt(i));)i++;if(i<a&&c.charCodeAt(i)!==10&&g)for(g=``,i=f,o=p;i<a&&A(c.charCodeAt(i));)i++;if(i<a&&c.charCodeAt(i)!==10)return!1;let _=ti(c.slice(1,l));return _?r?!0:(e.env.references===void 0&&(e.env.references={}),e.env.references[_]===void 0&&(e.env.references[_]={title:g,href:d}),e.line=o,!0):!1}var Ki=`address.article.aside.base.basefont.blockquote.body.caption.center.col.colgroup.dd.details.dialog.dir.div.dl.dt.fieldset.figcaption.figure.footer.form.frame.frameset.h1.h2.h3.h4.h5.h6.head.header.hr.html.iframe.legend.li.link.main.menu.menuitem.nav.noframes.ol.optgroup.option.p.param.search.section.summary.table.tbody.td.tfoot.th.thead.title.tr.track.ul`.split(`.`),qi=`<[A-Za-z][A-Za-z0-9\\-]*(?:\\s+[a-zA-Z_:][a-zA-Z0-9:._-]*(?:\\s*=\\s*(?:[^"'=<>\`\\x00-\\x20]+|'[^']*'|"[^"]*"))?)*\\s*\\/?>`,Ji=RegExp(`^(?:`+qi+`|<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>|<!---?>|<!--(?:[^-]|-[^-]|--[^>])*-->|<[?][\\s\\S]*?[?]>|<![A-Za-z][^>]*>|<!\\[CDATA\\[[\\s\\S]*?\\]\\]>)`),Yi=RegExp(`^(?:`+qi+`|<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>)`),Xi=[[/^<(script|pre|style|textarea)(?=(\s|>|$))/i,/<\/(script|pre|style|textarea)>/i,!0],[/^<!--/,/-->/,!0],[/^<\?/,/\?>/,!0],[/^<![A-Z]/,/>/,!0],[/^<!\[CDATA\[/,/\]\]>/,!0],[RegExp(`^</?(`+Ki.join(`|`)+`)(?=(\\s|/?>|$))`,`i`),/^$/,!0],[RegExp(Yi.source+`\\s*$`),/^$/,!1]];function Zi(e,t,n,r){let i=e.bMarks[t]+e.tShift[t],a=e.eMarks[t];if(e.sCount[t]-e.blkIndent>=4||!e.md.options.html||e.src.charCodeAt(i)!==60)return!1;let o=e.src.slice(i,a),s=0;for(;s<Xi.length&&!Xi[s][0].test(o);s++);if(s===Xi.length)return!1;if(r)return Xi[s][2];let c=t+1;if(!Xi[s][1].test(o)){for(;c<n&&!(e.sCount[c]<e.blkIndent);c++)if(i=e.bMarks[c]+e.tShift[c],a=e.eMarks[c],o=e.src.slice(i,a),Xi[s][1].test(o)){o.length!==0&&c++;break}}e.line=c;let l=e.push(`html_block`,``,0);return l.map=[t,c],l.content=e.getLines(t,c,e.blkIndent,!0),!0}function Qi(e,t,n,r){let i=e.bMarks[t]+e.tShift[t],a=e.eMarks[t];if(e.sCount[t]-e.blkIndent>=4)return!1;let o=e.src.charCodeAt(i);if(o!==35||i>=a)return!1;let s=1;for(o=e.src.charCodeAt(++i);o===35&&i<a&&s<=6;)s++,o=e.src.charCodeAt(++i);if(s>6||i<a&&!A(o))return!1;if(r)return!0;a=e.skipSpacesBack(a,i);let c=e.skipCharsBack(a,35,i);c>i&&A(e.src.charCodeAt(c-1))&&(a=c),e.line=t+1;let l=e.push(`heading_open`,`h`+String(s),1);l.markup=`########`.slice(0,s),l.map=[t,e.line];let u=e.push(`inline`,``,0);u.content=e.src.slice(i,a).trim(),u.map=[t,e.line],u.children=[];let d=e.push(`heading_close`,`h`+String(s),-1);return d.markup=`########`.slice(0,s),!0}function $i(e,t,n){let r=e.md.block.ruler.getRules(`paragraph`);if(e.sCount[t]-e.blkIndent>=4)return!1;let i=e.parentType;e.parentType=`paragraph`;let a=0,o,s=t+1;for(;s<n&&!e.isEmpty(s);s++){if(e.sCount[s]-e.blkIndent>3)continue;if(e.sCount[s]>=e.blkIndent){let t=e.bMarks[s]+e.tShift[s],n=e.eMarks[s];if(t<n&&(o=e.src.charCodeAt(t),(o===45||o===61)&&(t=e.skipChars(t,o),t=e.skipSpaces(t),t>=n))){a=o===61?1:2;break}}if(e.sCount[s]<0)continue;let t=!1;for(let i=0,a=r.length;i<a;i++)if(r[i](e,s,n,!0)){t=!0;break}if(t)break}if(!a)return!1;let c=e.getLines(t,s,e.blkIndent,!1).trim();e.line=s+1;let l=e.push(`heading_open`,`h`+String(a),1);l.markup=String.fromCharCode(o),l.map=[t,e.line];let u=e.push(`inline`,``,0);u.content=c,u.map=[t,e.line-1],u.children=[];let d=e.push(`heading_close`,`h`+String(a),-1);return d.markup=String.fromCharCode(o),e.parentType=i,!0}function ea(e,t,n){let r=e.md.block.ruler.getRules(`paragraph`),i=e.parentType,a=t+1;for(e.parentType=`paragraph`;a<n&&!e.isEmpty(a);a++){if(e.sCount[a]-e.blkIndent>3||e.sCount[a]<0)continue;let t=!1;for(let i=0,o=r.length;i<o;i++)if(r[i](e,a,n,!0)){t=!0;break}if(t)break}let o=e.getLines(t,a,e.blkIndent,!1).trim();e.line=a;let s=e.push(`paragraph_open`,`p`,1);s.map=[t,e.line];let c=e.push(`inline`,``,0);return c.content=o,c.map=[t,e.line],c.children=[],e.push(`paragraph_close`,`p`,-1),e.parentType=i,!0}var ta=[[`table`,Ii,[`paragraph`,`reference`]],[`code`,Li],[`fence`,Ri,[`paragraph`,`reference`,`blockquote`,`list`]],[`blockquote`,zi,[`paragraph`,`reference`,`blockquote`,`list`]],[`hr`,Bi,[`paragraph`,`reference`,`blockquote`,`list`]],[`list`,Wi,[`paragraph`,`reference`,`blockquote`]],[`reference`,Gi],[`html_block`,Zi,[`paragraph`,`reference`,`blockquote`]],[`heading`,Qi,[`paragraph`,`reference`,`blockquote`]],[`lheading`,$i],[`paragraph`,ea]];function na(){this.ruler=new N;for(let e=0;e<ta.length;e++)this.ruler.push(ta[e][0],ta[e][1],{alt:(ta[e][2]||[]).slice()})}na.prototype.tokenize=function(e,t,n){let r=this.ruler.getRules(``),i=r.length,a=e.md.options.maxNesting,o=t,s=!1;for(;o<n&&(e.line=o=e.skipEmptyLines(o),!(o>=n||e.sCount[o]<e.blkIndent));){if(e.level>=a){e.line=n;break}let t=e.line,c=!1;for(let a=0;a<i;a++)if(c=r[a](e,o,n,!1),c){if(t>=e.line)throw Error(`block rule didn't increment state.line`);break}if(!c)throw Error(`none of the block rules matched`);e.tight=!s,e.isEmpty(e.line-1)&&(s=!0),o=e.line,o<n&&e.isEmpty(o)&&(s=!0,o++,e.line=o)}},na.prototype.parse=function(e,t,n,r){if(!e)return;let i=new this.State(e,t,n,r);this.tokenize(i,i.line,i.lineMax)},na.prototype.State=F;function ra(e,t,n,r){this.src=e,this.env=n,this.md=t,this.tokens=r,this.tokens_meta=Array(r.length),this.pos=0,this.posMax=this.src.length,this.level=0,this.pending=``,this.pendingLevel=0,this.cache={},this.delimiters=[],this._prev_delimiters=[],this.backticks={},this.backticksScanned=!1,this.linkLevel=0}ra.prototype.pushPending=function(){let e=new P(`text`,``,0);return e.content=this.pending,e.level=this.pendingLevel,this.tokens.push(e),this.pending=``,e},ra.prototype.push=function(e,t,n){this.pending&&this.pushPending();let r=new P(e,t,n),i=null;return n<0&&(this.level--,this.delimiters=this._prev_delimiters.pop()),r.level=this.level,n>0&&(this.level++,this._prev_delimiters.push(this.delimiters),this.delimiters=[],i={delimiters:this.delimiters}),this.pendingLevel=this.level,this.tokens.push(r),this.tokens_meta.push(i),r},ra.prototype.scanDelims=function(e,t){let n=this.posMax,r=this.src.charCodeAt(e),i=e>0?this.src.charCodeAt(e-1):32,a=e;for(;a<n&&this.src.charCodeAt(a)===r;)a++;let o=a-e,s=a<n?this.src.charCodeAt(a):32,c=ei(i)||$r(String.fromCharCode(i)),l=ei(s)||$r(String.fromCharCode(s)),u=Qr(i),d=Qr(s),f=!d&&(!l||u||c),p=!u&&(!c||d||l);return{can_open:f&&(t||!p||c),can_close:p&&(t||!f||l),length:o}},ra.prototype.Token=P;function ia(e){switch(e){case 10:case 33:case 35:case 36:case 37:case 38:case 42:case 43:case 45:case 58:case 60:case 61:case 62:case 64:case 91:case 92:case 93:case 94:case 95:case 96:case 123:case 125:case 126:return!0;default:return!1}}function aa(e,t){let n=e.pos;for(;n<e.posMax&&!ia(e.src.charCodeAt(n));)n++;return n===e.pos?!1:(t||(e.pending+=e.src.slice(e.pos,n)),e.pos=n,!0)}var oa=/(?:^|[^a-z0-9.+-])([a-z][a-z0-9.+-]*)$/i;function sa(e,t){if(!e.md.options.linkify||e.linkLevel>0)return!1;let n=e.pos,r=e.posMax;if(n+3>r||e.src.charCodeAt(n)!==58||e.src.charCodeAt(n+1)!==47||e.src.charCodeAt(n+2)!==47)return!1;let i=e.pending.match(oa);if(!i)return!1;let a=i[1],o=e.md.linkify.matchAtStart(e.src.slice(n-a.length));if(!o)return!1;let s=o.url;if(s.length<=a.length)return!1;let c=s.length;for(;c>0&&s.charCodeAt(c-1)===42;)c--;c!==s.length&&(s=s.slice(0,c));let l=e.md.normalizeLink(s);if(!e.md.validateLink(l))return!1;if(!t){e.pending=e.pending.slice(0,-a.length);let t=e.push(`link_open`,`a`,1);t.attrs=[[`href`,l]],t.markup=`linkify`,t.info=`auto`;let n=e.push(`text`,``,0);n.content=e.md.normalizeLinkText(s);let r=e.push(`link_close`,`a`,-1);r.markup=`linkify`,r.info=`auto`}return e.pos+=s.length-a.length,!0}function ca(e,t){let n=e.pos;if(e.src.charCodeAt(n)!==10)return!1;let r=e.pending.length-1,i=e.posMax;if(!t)if(r>=0&&e.pending.charCodeAt(r)===32)if(r>=1&&e.pending.charCodeAt(r-1)===32){let t=r-1;for(;t>=1&&e.pending.charCodeAt(t-1)===32;)t--;e.pending=e.pending.slice(0,t),e.push(`hardbreak`,`br`,0)}else e.pending=e.pending.slice(0,-1),e.push(`softbreak`,`br`,0);else e.push(`softbreak`,`br`,0);for(n++;n<i&&A(e.src.charCodeAt(n));)n++;return e.pos=n,!0}var la=[];for(let e=0;e<256;e++)la.push(0);`\\!"#$%&'()*+,./:;<=>?@[]^_\`{|}~-`.split(``).forEach(function(e){la[e.charCodeAt(0)]=1});function ua(e,t){let n=e.pos,r=e.posMax;if(e.src.charCodeAt(n)!==92||(n++,n>=r))return!1;let i=e.src.charCodeAt(n);if(i===10){for(t||e.push(`hardbreak`,`br`,0),n++;n<r&&(i=e.src.charCodeAt(n),A(i));)n++;return e.pos=n,!0}let a=e.src[n];if(i>=55296&&i<=56319&&n+1<r){let t=e.src.charCodeAt(n+1);t>=56320&&t<=57343&&(a+=e.src[n+1],n++)}let o=`\\`+a;if(!t){let t=e.push(`text_special`,``,0);i<256&&la[i]!==0?t.content=a:t.content=o,t.markup=o,t.info=`escape`}return e.pos=n+1,!0}function da(e,t){let n=e.pos;if(e.src.charCodeAt(n)!==96)return!1;let r=n;n++;let i=e.posMax;for(;n<i&&e.src.charCodeAt(n)===96;)n++;let a=e.src.slice(r,n),o=a.length;if(e.backticksScanned&&(e.backticks[o]||0)<=r)return t||(e.pending+=a),e.pos+=o,!0;let s=n,c;for(;(c=e.src.indexOf("`",s))!==-1;){for(s=c+1;s<i&&e.src.charCodeAt(s)===96;)s++;let r=s-c;if(r===o){if(!t){let t=e.push(`code_inline`,`code`,0);t.markup=a,t.content=e.src.slice(n,c).replace(/\n/g,` `).replace(/^ (.+) $/,`$1`)}return e.pos=s,!0}e.backticks[r]=c}return e.backticksScanned=!0,t||(e.pending+=a),e.pos+=o,!0}function fa(e,t){let n=e.pos,r=e.src.charCodeAt(n);if(t||r!==126)return!1;let i=e.scanDelims(e.pos,!0),a=i.length,o=String.fromCharCode(r);if(a<2)return!1;let s;a%2&&(s=e.push(`text`,``,0),s.content=o,a--);for(let t=0;t<a;t+=2)s=e.push(`text`,``,0),s.content=o+o,e.delimiters.push({marker:r,length:0,token:e.tokens.length-1,end:-1,open:i.can_open,close:i.can_close});return e.pos+=i.length,!0}function pa(e,t){let n,r=[],i=t.length;for(let a=0;a<i;a++){let i=t[a];if(i.marker!==126||i.end===-1)continue;let o=t[i.end];n=e.tokens[i.token],n.type=`s_open`,n.tag=`s`,n.nesting=1,n.markup=`~~`,n.content=``,n=e.tokens[o.token],n.type=`s_close`,n.tag=`s`,n.nesting=-1,n.markup=`~~`,n.content=``,e.tokens[o.token-1].type===`text`&&e.tokens[o.token-1].content===`~`&&r.push(o.token-1)}for(;r.length;){let t=r.pop(),i=t+1;for(;i<e.tokens.length&&e.tokens[i].type===`s_close`;)i++;i--,t!==i&&(n=e.tokens[i],e.tokens[i]=e.tokens[t],e.tokens[t]=n)}}function ma(e){let t=e.tokens_meta,n=e.tokens_meta.length;pa(e,e.delimiters);for(let r=0;r<n;r++)t[r]&&t[r].delimiters&&pa(e,t[r].delimiters)}var ha={tokenize:fa,postProcess:ma};function ga(e,t){let n=e.pos,r=e.src.charCodeAt(n);if(t||r!==95&&r!==42)return!1;let i=e.scanDelims(e.pos,r===42);for(let t=0;t<i.length;t++){let t=e.push(`text`,``,0);t.content=String.fromCharCode(r),e.delimiters.push({marker:r,length:i.length,token:e.tokens.length-1,end:-1,open:i.can_open,close:i.can_close})}return e.pos+=i.length,!0}function _a(e,t){let n=t.length;for(let r=n-1;r>=0;r--){let n=t[r];if(n.marker!==95&&n.marker!==42||n.end===-1)continue;let i=t[n.end],a=r>0&&t[r-1].end===n.end+1&&t[r-1].marker===n.marker&&t[r-1].token===n.token-1&&t[n.end+1].token===i.token+1,o=String.fromCharCode(n.marker),s=e.tokens[n.token];s.type=a?`strong_open`:`em_open`,s.tag=a?`strong`:`em`,s.nesting=1,s.markup=a?o+o:o,s.content=``;let c=e.tokens[i.token];c.type=a?`strong_close`:`em_close`,c.tag=a?`strong`:`em`,c.nesting=-1,c.markup=a?o+o:o,c.content=``,a&&(e.tokens[t[r-1].token].content=``,e.tokens[t[n.end+1].token].content=``,r--)}}function va(e){let t=e.tokens_meta,n=e.tokens_meta.length;_a(e,e.delimiters);for(let r=0;r<n;r++)t[r]&&t[r].delimiters&&_a(e,t[r].delimiters)}var ya={tokenize:ga,postProcess:va};function ba(e,t){let n,r,i,a,o=``,s=``,c=e.pos,l=!0;if(e.src.charCodeAt(e.pos)!==91)return!1;let u=e.pos,d=e.posMax,f=e.pos+1,p=e.md.helpers.parseLinkLabel(e,e.pos,!0);if(p<0)return!1;let m=p+1;if(m<d&&e.src.charCodeAt(m)===40){for(l=!1,m++;m<d&&(n=e.src.charCodeAt(m),!(!A(n)&&n!==10));m++);if(m>=d)return!1;if(c=m,i=e.md.helpers.parseLinkDestination(e.src,m,e.posMax),i.ok){for(o=e.md.normalizeLink(i.str),e.md.validateLink(o)?m=i.pos:o=``,c=m;m<d&&(n=e.src.charCodeAt(m),!(!A(n)&&n!==10));m++);if(i=e.md.helpers.parseLinkTitle(e.src,m,e.posMax),m<d&&c!==m&&i.ok)for(s=i.str,m=i.pos;m<d&&(n=e.src.charCodeAt(m),!(!A(n)&&n!==10));m++);}(m>=d||e.src.charCodeAt(m)!==41)&&(l=!0),m++}if(l){if(e.env.references===void 0)return!1;if(m<d&&e.src.charCodeAt(m)===91?(c=m+1,m=e.md.helpers.parseLinkLabel(e,m),m>=0?r=e.src.slice(c,m++):m=p+1):m=p+1,r||=e.src.slice(f,p),a=e.env.references[ti(r)],!a)return e.pos=u,!1;o=a.href,s=a.title}if(!t){e.pos=f,e.posMax=p;let t=e.push(`link_open`,`a`,1),n=[[`href`,o]];t.attrs=n,s&&n.push([`title`,s]),e.linkLevel++,e.md.inline.tokenize(e),e.linkLevel--,e.push(`link_close`,`a`,-1)}return e.pos=m,e.posMax=d,!0}function xa(e,t){let n,r,i,a,o,s,c,l,u=``,d=e.pos,f=e.posMax;if(e.src.charCodeAt(e.pos)!==33||e.src.charCodeAt(e.pos+1)!==91)return!1;let p=e.pos+2,m=e.md.helpers.parseLinkLabel(e,e.pos+1,!1);if(m<0)return!1;if(a=m+1,a<f&&e.src.charCodeAt(a)===40){for(a++;a<f&&(n=e.src.charCodeAt(a),!(!A(n)&&n!==10));a++);if(a>=f)return!1;for(l=a,s=e.md.helpers.parseLinkDestination(e.src,a,e.posMax),s.ok&&(u=e.md.normalizeLink(s.str),e.md.validateLink(u)?a=s.pos:u=``),l=a;a<f&&(n=e.src.charCodeAt(a),!(!A(n)&&n!==10));a++);if(s=e.md.helpers.parseLinkTitle(e.src,a,e.posMax),a<f&&l!==a&&s.ok)for(c=s.str,a=s.pos;a<f&&(n=e.src.charCodeAt(a),!(!A(n)&&n!==10));a++);else c=``;if(a>=f||e.src.charCodeAt(a)!==41)return e.pos=d,!1;a++}else{if(e.env.references===void 0)return!1;if(a<f&&e.src.charCodeAt(a)===91?(l=a+1,a=e.md.helpers.parseLinkLabel(e,a),a>=0?i=e.src.slice(l,a++):a=m+1):a=m+1,i||=e.src.slice(p,m),o=e.env.references[ti(i)],!o)return e.pos=d,!1;u=o.href,c=o.title}if(!t){r=e.src.slice(p,m);let t=[];e.md.inline.parse(r,e.md,e.env,t);let n=e.push(`image`,`img`,0),i=[[`src`,u],[`alt`,``]];n.attrs=i,n.children=t,n.content=r,c&&i.push([`title`,c])}return e.pos=a,e.posMax=f,!0}var Sa=/^([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)$/,Ca=/^([a-zA-Z][a-zA-Z0-9+.-]{1,31}):([^<>\x00-\x20]*)$/;function wa(e,t){let n=e.pos;if(e.src.charCodeAt(n)!==60)return!1;let r=e.pos,i=e.posMax;for(;;){if(++n>=i)return!1;let t=e.src.charCodeAt(n);if(t===60)return!1;if(t===62)break}let a=e.src.slice(r+1,n);if(Ca.test(a)){let n=e.md.normalizeLink(a);if(!e.md.validateLink(n))return!1;if(!t){let t=e.push(`link_open`,`a`,1);t.attrs=[[`href`,n]],t.markup=`autolink`,t.info=`auto`;let r=e.push(`text`,``,0);r.content=e.md.normalizeLinkText(a);let i=e.push(`link_close`,`a`,-1);i.markup=`autolink`,i.info=`auto`}return e.pos+=a.length+2,!0}if(Sa.test(a)){let n=e.md.normalizeLink(`mailto:`+a);if(!e.md.validateLink(n))return!1;if(!t){let t=e.push(`link_open`,`a`,1);t.attrs=[[`href`,n]],t.markup=`autolink`,t.info=`auto`;let r=e.push(`text`,``,0);r.content=e.md.normalizeLinkText(a);let i=e.push(`link_close`,`a`,-1);i.markup=`autolink`,i.info=`auto`}return e.pos+=a.length+2,!0}return!1}function Ta(e){return/^<a[>\s]/i.test(e)}function Ea(e){return/^<\/a\s*>/i.test(e)}function Da(e){let t=e|32;return t>=97&&t<=122}function Oa(e,t){if(!e.md.options.html)return!1;let n=e.posMax,r=e.pos;if(e.src.charCodeAt(r)!==60||r+2>=n)return!1;let i=e.src.charCodeAt(r+1);if(i!==33&&i!==63&&i!==47&&!Da(i))return!1;let a=e.src.slice(r).match(Ji);if(!a)return!1;if(!t){let t=e.push(`html_inline`,``,0);t.content=a[0],Ta(t.content)&&e.linkLevel++,Ea(t.content)&&e.linkLevel--}return e.pos+=a[0].length,!0}var ka=/^&#((?:x[a-f0-9]{1,6}|[0-9]{1,7}));/i,Aa=/^&([a-z][a-z0-9]{1,31});/i;function ja(e,t){let n=e.pos,r=e.posMax;if(e.src.charCodeAt(n)!==38||n+1>=r)return!1;if(e.src.charCodeAt(n+1)===35){let r=e.src.slice(n).match(ka);if(r){if(!t){let t=r[1][0].toLowerCase()===`x`?parseInt(r[1].slice(1),16):parseInt(r[1],10),n=e.push(`text_special`,``,0);n.content=Rr(t)?zr(t):zr(65533),n.markup=r[0],n.info=`entity`}return e.pos+=r[0].length,!0}}else{let r=e.src.slice(n).match(Aa);if(r){let n=Ar(r[0]);if(n!==r[0]){if(!t){let t=e.push(`text_special`,``,0);t.content=n,t.markup=r[0],t.info=`entity`}return e.pos+=r[0].length,!0}}}return!1}function Ma(e){let t={},n=e.length;if(!n)return;let r=0,i=-2,a=[];for(let o=0;o<n;o++){let n=e[o];if(a.push(0),(e[r].marker!==n.marker||i!==n.token-1)&&(r=o),i=n.token,n.length=n.length||0,!n.close)continue;t.hasOwnProperty(n.marker)||(t[n.marker]=[-1,-1,-1,-1,-1,-1]);let s=t[n.marker][(n.open?3:0)+n.length%3],c=r-a[r]-1,l=c;for(;c>s;c-=a[c]+1){let t=e[c];if(t.marker===n.marker&&t.open&&t.end<0){let r=!1;if((t.close||n.open)&&(t.length+n.length)%3==0&&(t.length%3!=0||n.length%3!=0)&&(r=!0),!r){let r=c>0&&!e[c-1].open?a[c-1]+1:0;a[o]=o-c+r,a[c]=r,n.open=!1,t.end=o,t.close=!1,l=-1,i=-2;break}}}l!==-1&&(t[n.marker][(n.open?3:0)+(n.length||0)%3]=l)}}function Na(e){let t=e.tokens_meta,n=e.tokens_meta.length;Ma(e.delimiters);for(let e=0;e<n;e++)t[e]&&t[e].delimiters&&Ma(t[e].delimiters)}function Pa(e){let t,n,r=0,i=e.tokens,a=e.tokens.length;for(t=n=0;t<a;t++)i[t].nesting<0&&r--,i[t].level=r,i[t].nesting>0&&r++,i[t].type===`text`&&t+1<a&&i[t+1].type===`text`?i[t+1].content=i[t].content+i[t+1].content:(t!==n&&(i[n]=i[t]),n++);t!==n&&(i.length=n)}var Fa=[[`text`,aa],[`linkify`,sa],[`newline`,ca],[`escape`,ua],[`backticks`,da],[`strikethrough`,ha.tokenize],[`emphasis`,ya.tokenize],[`link`,ba],[`image`,xa],[`autolink`,wa],[`html_inline`,Oa],[`entity`,ja]],Ia=[[`balance_pairs`,Na],[`strikethrough`,ha.postProcess],[`emphasis`,ya.postProcess],[`fragments_join`,Pa]];function La(){this.ruler=new N;for(let e=0;e<Fa.length;e++)this.ruler.push(Fa[e][0],Fa[e][1]);this.ruler2=new N;for(let e=0;e<Ia.length;e++)this.ruler2.push(Ia[e][0],Ia[e][1])}La.prototype.skipToken=function(e){let t=e.pos,n=this.ruler.getRules(``),r=n.length,i=e.md.options.maxNesting,a=e.cache;if(a[t]!==void 0){e.pos=a[t];return}let o=!1;if(e.level<i){for(let i=0;i<r;i++)if(e.level++,o=n[i](e,!0),e.level--,o){if(t>=e.pos)throw Error(`inline rule didn't increment state.pos`);break}}else e.pos=e.posMax;o||e.pos++,a[t]=e.pos},La.prototype.tokenize=function(e){let t=this.ruler.getRules(``),n=t.length,r=e.posMax,i=e.md.options.maxNesting;for(;e.pos<r;){let a=e.pos,o=!1;if(e.level<i){for(let r=0;r<n;r++)if(o=t[r](e,!1),o){if(a>=e.pos)throw Error(`inline rule didn't increment state.pos`);break}}if(o){if(e.pos>=r)break;continue}e.pending+=e.src[e.pos++]}e.pending&&e.pushPending()},La.prototype.parse=function(e,t,n,r){let i=new this.State(e,t,n,r);this.tokenize(i);let a=this.ruler2.getRules(``),o=a.length;for(let e=0;e<o;e++)a[e](i)},La.prototype.State=ra;function Ra(e){let t={};e||={},t.src_Any=lr.source,t.src_Cc=ur.source,t.src_Z=mr.source,t.src_P=fr.source,t.src_ZPCc=[t.src_Z,t.src_P,t.src_Cc].join(`|`),t.src_ZCc=[t.src_Z,t.src_Cc].join(`|`);let n=`[><｜]`;return t.src_pseudo_letter=`(?:(?!`+n+`|`+t.src_ZPCc+`)`+t.src_Any+`)`,t.src_ip4=`(?:(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)`,t.src_auth=`(?:(?:(?!`+t.src_ZCc+`|[@/\\[\\]()]).)+@)?`,t.src_port=`(?::(?:6(?:[0-4]\\d{3}|5(?:[0-4]\\d{2}|5(?:[0-2]\\d|3[0-5])))|[1-5]?\\d{1,4}))?`,t.src_host_terminator=`(?=$|`+n+`|`+t.src_ZPCc+`)(?!`+(e[`---`]?`-(?!--)|`:`-|`)+`_|:\\d|\\.-|\\.(?!$|`+t.src_ZPCc+`))`,t.src_path=`(?:[/?#](?:(?!`+t.src_ZCc+`|[><｜]|[()[\\]{}.,"'?!\\-;]).|\\[(?:(?!`+t.src_ZCc+`|\\]).)*\\]|\\((?:(?!`+t.src_ZCc+`|[)]).)*\\)|\\{(?:(?!`+t.src_ZCc+`|[}]).)*\\}|\\"(?:(?!`+t.src_ZCc+`|["]).)+\\"|\\'(?:(?!`+t.src_ZCc+`|[']).)+\\'|\\'(?=`+t.src_pseudo_letter+`|[-])|\\.{2,}[a-zA-Z0-9%/&]|\\.(?!`+t.src_ZCc+`|[.]|$)|`+(e[`---`]?`\\-(?!--(?:[^-]|$))(?:-*)|`:`\\-+|`)+`,(?!`+t.src_ZCc+`|$)|;(?!`+t.src_ZCc+`|$)|\\!+(?!`+t.src_ZCc+`|[!]|$)|\\?(?!`+t.src_ZCc+`|[?]|$))+|\\/)?`,t.src_email_name=`[\\-;:&=\\+\\$,\\.a-zA-Z0-9_][\\-;:&=\\+\\$,\\"\\.a-zA-Z0-9_]*`,t.src_xn=`xn--[a-z0-9\\-]{1,59}`,t.src_domain_root=`(?:`+t.src_xn+`|`+t.src_pseudo_letter+`{1,63})`,t.src_domain=`(?:`+t.src_xn+`|(?:`+t.src_pseudo_letter+`)|(?:`+t.src_pseudo_letter+`(?:-|`+t.src_pseudo_letter+`){0,61}`+t.src_pseudo_letter+`))`,t.src_host=`(?:(?:(?:(?:`+t.src_domain+`)\\.)*`+t.src_domain+`))`,t.tpl_host_fuzzy=`(?:`+t.src_ip4+`|(?:(?:(?:`+t.src_domain+`)\\.)+(?:%TLDS%)))`,t.tpl_host_no_ip_fuzzy=`(?:(?:(?:`+t.src_domain+`)\\.)+(?:%TLDS%))`,t.src_host_strict=t.src_host+t.src_host_terminator,t.tpl_host_fuzzy_strict=t.tpl_host_fuzzy+t.src_host_terminator,t.src_host_port_strict=t.src_host+t.src_port+t.src_host_terminator,t.tpl_host_port_fuzzy_strict=t.tpl_host_fuzzy+t.src_port+t.src_host_terminator,t.tpl_host_port_no_ip_fuzzy_strict=t.tpl_host_no_ip_fuzzy+t.src_port+t.src_host_terminator,t.tpl_host_fuzzy_test=`localhost|www\\.|\\.\\d{1,3}\\.|(?:\\.(?:%TLDS%)(?:`+t.src_ZPCc+`|>|$))`,t.tpl_email_fuzzy=`(^|`+n+`|"|\\(|`+t.src_ZCc+`)(`+t.src_email_name+`@`+t.tpl_host_fuzzy_strict+`)`,t.tpl_link_fuzzy="(^|(?![.:/\\-_@])(?:[$+<=>^`|｜]|"+t.src_ZPCc+"))((?![$+<=>^`|｜])"+t.tpl_host_port_fuzzy_strict+t.src_path+`)`,t.tpl_link_no_ip_fuzzy="(^|(?![.:/\\-_@])(?:[$+<=>^`|｜]|"+t.src_ZPCc+"))((?![$+<=>^`|｜])"+t.tpl_host_port_no_ip_fuzzy_strict+t.src_path+`)`,t}function za(e){return Array.prototype.slice.call(arguments,1).forEach(function(t){t&&Object.keys(t).forEach(function(n){e[n]=t[n]})}),e}function Ba(e){return Object.prototype.toString.call(e)}function Va(e){return Ba(e)===`[object String]`}function Ha(e){return Ba(e)===`[object Object]`}function Ua(e){return Ba(e)===`[object RegExp]`}function Wa(e){return Ba(e)===`[object Function]`}function Ga(e){return e.replace(/[.?*+^$[\]\\(){}|-]/g,`\\$&`)}var Ka={fuzzyLink:!0,fuzzyEmail:!0,fuzzyIP:!1};function qa(e){return Object.keys(e||{}).reduce(function(e,t){return e||Ka.hasOwnProperty(t)},!1)}var Ja={"http:":{validate:function(e,t,n){let r=e.slice(t);return n.re.http||(n.re.http=RegExp(`^\\/\\/`+n.re.src_auth+n.re.src_host_port_strict+n.re.src_path,`i`)),n.re.http.test(r)?r.match(n.re.http)[0].length:0}},"https:":`http:`,"ftp:":`http:`,"//":{validate:function(e,t,n){let r=e.slice(t);return n.re.no_http||(n.re.no_http=RegExp(`^`+n.re.src_auth+`(?:localhost|(?:(?:`+n.re.src_domain+`)\\.)+`+n.re.src_domain_root+`)`+n.re.src_port+n.re.src_host_terminator+n.re.src_path,`i`)),n.re.no_http.test(r)?t>=3&&e[t-3]===`:`||t>=3&&e[t-3]===`/`?0:r.match(n.re.no_http)[0].length:0}},"mailto:":{validate:function(e,t,n){let r=e.slice(t);return n.re.mailto||(n.re.mailto=RegExp(`^`+n.re.src_email_name+`@`+n.re.src_host_strict,`i`)),n.re.mailto.test(r)?r.match(n.re.mailto)[0].length:0}}},Ya=`a[cdefgilmnoqrstuwxz]|b[abdefghijmnorstvwyz]|c[acdfghiklmnoruvwxyz]|d[ejkmoz]|e[cegrstu]|f[ijkmor]|g[abdefghilmnpqrstuwy]|h[kmnrtu]|i[delmnoqrst]|j[emop]|k[eghimnprwyz]|l[abcikrstuvy]|m[acdeghklmnopqrstuvwxyz]|n[acefgilopruz]|om|p[aefghklmnrstwy]|qa|r[eosuw]|s[abcdeghijklmnortuvxyz]|t[cdfghjklmnortvwz]|u[agksyz]|v[aceginu]|w[fs]|y[et]|z[amw]`,Xa=`biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|рф`.split(`|`);function Za(e){e.__index__=-1,e.__text_cache__=``}function Qa(e){return function(t,n){let r=t.slice(n);return e.test(r)?r.match(e)[0].length:0}}function $a(){return function(e,t){t.normalize(e)}}function eo(e){let t=e.re=Ra(e.__opts__),n=e.__tlds__.slice();e.onCompile(),e.__tlds_replaced__||n.push(Ya),n.push(t.src_xn),t.src_tlds=n.join(`|`);function r(e){return e.replace(`%TLDS%`,t.src_tlds)}t.email_fuzzy=RegExp(r(t.tpl_email_fuzzy),`i`),t.link_fuzzy=RegExp(r(t.tpl_link_fuzzy),`i`),t.link_no_ip_fuzzy=RegExp(r(t.tpl_link_no_ip_fuzzy),`i`),t.host_fuzzy_test=RegExp(r(t.tpl_host_fuzzy_test),`i`);let i=[];e.__compiled__={};function a(e,t){throw Error(`(LinkifyIt) Invalid schema "`+e+`": `+t)}Object.keys(e.__schemas__).forEach(function(t){let n=e.__schemas__[t];if(n===null)return;let r={validate:null,link:null};if(e.__compiled__[t]=r,Ha(n)){Ua(n.validate)?r.validate=Qa(n.validate):Wa(n.validate)?r.validate=n.validate:a(t,n),Wa(n.normalize)?r.normalize=n.normalize:n.normalize?a(t,n):r.normalize=$a();return}if(Va(n)){i.push(t);return}a(t,n)}),i.forEach(function(t){e.__compiled__[e.__schemas__[t]]&&(e.__compiled__[t].validate=e.__compiled__[e.__schemas__[t]].validate,e.__compiled__[t].normalize=e.__compiled__[e.__schemas__[t]].normalize)}),e.__compiled__[``]={validate:null,normalize:$a()};let o=Object.keys(e.__compiled__).filter(function(t){return t.length>0&&e.__compiled__[t]}).map(Ga).join(`|`);e.re.schema_test=RegExp(`(^|(?!_)(?:[><｜]|`+t.src_ZPCc+`))(`+o+`)`,`i`),e.re.schema_search=RegExp(`(^|(?!_)(?:[><｜]|`+t.src_ZPCc+`))(`+o+`)`,`ig`),e.re.schema_at_start=RegExp(`^`+e.re.schema_search.source,`i`),e.re.pretest=RegExp(`(`+e.re.schema_test.source+`)|(`+e.re.host_fuzzy_test.source+`)|@`,`i`),Za(e)}function to(e,t){let n=e.__index__,r=e.__last_index__,i=e.__text_cache__.slice(n,r);this.schema=e.__schema__.toLowerCase(),this.index=n+t,this.lastIndex=r+t,this.raw=i,this.text=i,this.url=i}function no(e,t){let n=new to(e,t);return e.__compiled__[n.schema].normalize(n,e),n}function I(e,t){if(!(this instanceof I))return new I(e,t);t||qa(e)&&(t=e,e={}),this.__opts__=za({},Ka,t),this.__index__=-1,this.__last_index__=-1,this.__schema__=``,this.__text_cache__=``,this.__schemas__=za({},Ja,e),this.__compiled__={},this.__tlds__=Xa,this.__tlds_replaced__=!1,this.re={},eo(this)}I.prototype.add=function(e,t){return this.__schemas__[e]=t,eo(this),this},I.prototype.set=function(e){return this.__opts__=za(this.__opts__,e),this},I.prototype.test=function(e){if(this.__text_cache__=e,this.__index__=-1,!e.length)return!1;let t,n,r,i,a,o,s,c,l;if(this.re.schema_test.test(e)){for(s=this.re.schema_search,s.lastIndex=0;(t=s.exec(e))!==null;)if(i=this.testSchemaAt(e,t[2],s.lastIndex),i){this.__schema__=t[2],this.__index__=t.index+t[1].length,this.__last_index__=t.index+t[0].length+i;break}}return this.__opts__.fuzzyLink&&this.__compiled__[`http:`]&&(c=e.search(this.re.host_fuzzy_test),c>=0&&(this.__index__<0||c<this.__index__)&&(n=e.match(this.__opts__.fuzzyIP?this.re.link_fuzzy:this.re.link_no_ip_fuzzy))!==null&&(a=n.index+n[1].length,(this.__index__<0||a<this.__index__)&&(this.__schema__=``,this.__index__=a,this.__last_index__=n.index+n[0].length))),this.__opts__.fuzzyEmail&&this.__compiled__[`mailto:`]&&(l=e.indexOf(`@`),l>=0&&(r=e.match(this.re.email_fuzzy))!==null&&(a=r.index+r[1].length,o=r.index+r[0].length,(this.__index__<0||a<this.__index__||a===this.__index__&&o>this.__last_index__)&&(this.__schema__=`mailto:`,this.__index__=a,this.__last_index__=o))),this.__index__>=0},I.prototype.pretest=function(e){return this.re.pretest.test(e)},I.prototype.testSchemaAt=function(e,t,n){return this.__compiled__[t.toLowerCase()]?this.__compiled__[t.toLowerCase()].validate(e,n,this):0},I.prototype.match=function(e){let t=[],n=0;this.__index__>=0&&this.__text_cache__===e&&(t.push(no(this,n)),n=this.__last_index__);let r=n?e.slice(n):e;for(;this.test(r);)t.push(no(this,n)),r=r.slice(this.__last_index__),n+=this.__last_index__;return t.length?t:null},I.prototype.matchAtStart=function(e){if(this.__text_cache__=e,this.__index__=-1,!e.length)return null;let t=this.re.schema_at_start.exec(e);if(!t)return null;let n=this.testSchemaAt(e,t[2],t[0].length);return n?(this.__schema__=t[2],this.__index__=t.index+t[1].length,this.__last_index__=t.index+t[0].length+n,no(this,0)):null},I.prototype.tlds=function(e,t){return e=Array.isArray(e)?e:[e],t?(this.__tlds__=this.__tlds__.concat(e).sort().filter(function(e,t,n){return e!==n[t-1]}).reverse(),eo(this),this):(this.__tlds__=e.slice(),this.__tlds_replaced__=!0,eo(this),this)},I.prototype.normalize=function(e){e.schema||(e.url=`http://`+e.url),e.schema===`mailto:`&&!/^mailto:/i.test(e.url)&&(e.url=`mailto:`+e.url)},I.prototype.onCompile=function(){};var L=2147483647,R=36,ro=1,io=26,ao=38,oo=700,so=72,co=128,lo=`-`,uo=/^xn--/,fo=/[^\0-\x7F]/,po=/[\x2E\u3002\uFF0E\uFF61]/g,mo={overflow:`Overflow: input needs wider integers to process`,"not-basic":`Illegal input >= 0x80 (not a basic code point)`,"invalid-input":`Invalid input`},ho=R-ro,z=Math.floor,go=String.fromCharCode;function B(e){throw RangeError(mo[e])}function _o(e,t){let n=[],r=e.length;for(;r--;)n[r]=t(e[r]);return n}function vo(e,t){let n=e.split(`@`),r=``;n.length>1&&(r=n[0]+`@`,e=n[1]),e=e.replace(po,`.`);let i=_o(e.split(`.`),t).join(`.`);return r+i}function yo(e){let t=[],n=0,r=e.length;for(;n<r;){let i=e.charCodeAt(n++);if(i>=55296&&i<=56319&&n<r){let r=e.charCodeAt(n++);(r&64512)==56320?t.push(((i&1023)<<10)+(r&1023)+65536):(t.push(i),n--)}else t.push(i)}return t}var bo=e=>String.fromCodePoint(...e),xo=function(e){return e>=48&&e<58?26+(e-48):e>=65&&e<91?e-65:e>=97&&e<123?e-97:R},So=function(e,t){return e+22+75*(e<26)-((t!=0)<<5)},Co=function(e,t,n){let r=0;for(e=n?z(e/oo):e>>1,e+=z(e/t);e>ho*io>>1;r+=R)e=z(e/ho);return z(r+(ho+1)*e/(e+ao))},wo=function(e){let t=[],n=e.length,r=0,i=co,a=so,o=e.lastIndexOf(lo);o<0&&(o=0);for(let n=0;n<o;++n)e.charCodeAt(n)>=128&&B(`not-basic`),t.push(e.charCodeAt(n));for(let s=o>0?o+1:0;s<n;){let o=r;for(let t=1,i=R;;i+=R){s>=n&&B(`invalid-input`);let o=xo(e.charCodeAt(s++));o>=R&&B(`invalid-input`),o>z((L-r)/t)&&B(`overflow`),r+=o*t;let c=i<=a?ro:i>=a+io?io:i-a;if(o<c)break;let l=R-c;t>z(L/l)&&B(`overflow`),t*=l}let c=t.length+1;a=Co(r-o,c,o==0),z(r/c)>L-i&&B(`overflow`),i+=z(r/c),r%=c,t.splice(r++,0,i)}return String.fromCodePoint(...t)},To=function(e){let t=[];e=yo(e);let n=e.length,r=co,i=0,a=so;for(let n of e)n<128&&t.push(go(n));let o=t.length,s=o;for(o&&t.push(lo);s<n;){let n=L;for(let t of e)t>=r&&t<n&&(n=t);let c=s+1;n-r>z((L-i)/c)&&B(`overflow`),i+=(n-r)*c,r=n;for(let n of e)if(n<r&&++i>L&&B(`overflow`),n===r){let e=i;for(let n=R;;n+=R){let r=n<=a?ro:n>=a+io?io:n-a;if(e<r)break;let i=e-r,o=R-r;t.push(go(So(r+i%o,0))),e=z(i/o)}t.push(go(So(e,0))),a=Co(i,c,s===o),i=0,++s}++i,++r}return t.join(``)},Eo={version:`2.3.1`,ucs2:{decode:yo,encode:bo},decode:wo,encode:To,toASCII:function(e){return vo(e,function(e){return fo.test(e)?`xn--`+To(e):e})},toUnicode:function(e){return vo(e,function(e){return uo.test(e)?wo(e.slice(4).toLowerCase()):e})}},Do={default:{options:{html:!1,xhtmlOut:!1,breaks:!1,langPrefix:`language-`,linkify:!1,typographer:!1,quotes:`“”‘’`,highlight:null,maxNesting:100},components:{core:{},block:{},inline:{}}},zero:{options:{html:!1,xhtmlOut:!1,breaks:!1,langPrefix:`language-`,linkify:!1,typographer:!1,quotes:`“”‘’`,highlight:null,maxNesting:20},components:{core:{rules:[`normalize`,`block`,`inline`,`text_join`]},block:{rules:[`paragraph`]},inline:{rules:[`text`],rules2:[`balance_pairs`,`fragments_join`]}}},commonmark:{options:{html:!0,xhtmlOut:!0,breaks:!1,langPrefix:`language-`,linkify:!1,typographer:!1,quotes:`“”‘’`,highlight:null,maxNesting:20},components:{core:{rules:[`normalize`,`block`,`inline`,`text_join`]},block:{rules:[`blockquote`,`code`,`fence`,`heading`,`hr`,`html_block`,`lheading`,`list`,`reference`,`paragraph`]},inline:{rules:[`autolink`,`backticks`,`emphasis`,`entity`,`escape`,`html_inline`,`image`,`link`,`newline`,`text`],rules2:[`balance_pairs`,`emphasis`,`fragments_join`]}}}},Oo=/^(vbscript|javascript|file|data):/,ko=/^data:image\/(gif|png|jpeg|webp);/;function Ao(e){let t=e.trim().toLowerCase();return Oo.test(t)?ko.test(t):!0}var jo=[`http:`,`https:`,`mailto:`];function Mo(e){let t=sr(e,!0);if(t.hostname&&(!t.protocol||jo.indexOf(t.protocol)>=0))try{t.hostname=Eo.toASCII(t.hostname)}catch{}return Jn(Yn(t))}function No(e){let t=sr(e,!0);if(t.hostname&&(!t.protocol||jo.indexOf(t.protocol)>=0))try{t.hostname=Eo.toUnicode(t.hostname)}catch{}return Gn(Yn(t),Gn.defaultChars+`%`)}function V(e,t){if(!(this instanceof V))return new V(e,t);t||Nr(e)||(t=e||{},e=`default`),this.inline=new La,this.block=new na,this.core=new Mi,this.renderer=new M,this.linkify=new I,this.validateLink=Ao,this.normalizeLink=Mo,this.normalizeLinkText=No,this.utils=jr,this.helpers=Ir({},oi),this.options={},this.configure(e),t&&this.set(t)}V.prototype.set=function(e){return Ir(this.options,e),this},V.prototype.configure=function(e){let t=this;if(Nr(e)){let t=e;if(e=Do[t],!e)throw Error('Wrong `markdown-it` preset "'+t+`", check name`)}if(!e)throw Error("Wrong `markdown-it` preset, can't be empty");return e.options&&t.set(e.options),e.components&&Object.keys(e.components).forEach(function(n){e.components[n].rules&&t[n].ruler.enableOnly(e.components[n].rules),e.components[n].rules2&&t[n].ruler2.enableOnly(e.components[n].rules2)}),this},V.prototype.enable=function(e,t){let n=[];Array.isArray(e)||(e=[e]),[`core`,`block`,`inline`].forEach(function(t){n=n.concat(this[t].ruler.enable(e,!0))},this),n=n.concat(this.inline.ruler2.enable(e,!0));let r=e.filter(function(e){return n.indexOf(e)<0});if(r.length&&!t)throw Error(`MarkdownIt. Failed to enable unknown rule(s): `+r);return this},V.prototype.disable=function(e,t){let n=[];Array.isArray(e)||(e=[e]),[`core`,`block`,`inline`].forEach(function(t){n=n.concat(this[t].ruler.disable(e,!0))},this),n=n.concat(this.inline.ruler2.disable(e,!0));let r=e.filter(function(e){return n.indexOf(e)<0});if(r.length&&!t)throw Error(`MarkdownIt. Failed to disable unknown rule(s): `+r);return this},V.prototype.use=function(e){let t=[this].concat(Array.prototype.slice.call(arguments,1));return e.apply(e,t),this},V.prototype.parse=function(e,t){if(typeof e!=`string`)throw Error(`Input data should be a String`);let n=new this.core.State(e,this,t);return this.core.process(n),n.tokens},V.prototype.render=function(e,t){return t||={},this.renderer.render(this.parse(e,t),this.options,t)},V.prototype.parseInline=function(e,t){let n=new this.core.State(e,this,t);return n.inlineMode=!0,this.core.process(n),n.tokens},V.prototype.renderInline=function(e,t){return t||={},this.renderer.render(this.parseInline(e,t),this.options,t)};function H(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function U(e){return H(String(e))}function Po(e){return e.trim().replace(/_/g,`-`).replace(/[^a-zA-Z0-9-]/g,``).replace(/^-+/,``).replace(/-+$/,``).toLowerCase()}function W(e){return Object.entries(e).map(([e,t])=>{let n=Po(e);return n?`data-${n}="${U(t)}"`:``}).filter(Boolean).join(` `)}function G(e,t){return`<div class="vt-directive-error" data-directive="${H(e)}" data-reason="${H(t)}">Invalid ${H(e)} directive: ${H(t)}</div>`}function Fo(e,t){return`<pre class="vt-directive-raw" data-reason="${H(t)}"><code>${H(e)}</code></pre>`}function Io(e){return H(e).replace(/\n/g,`<br>`)}var Lo=new Set(`video.video-player.before-after.image-card.captioned-image.note.warning.tip.section-gap.section-break.featured-works.work-card.pagecard-grid.pagecard.markdown-box.gallery-strip.home-section.product-cta.product-trust.product-specs.product-catalog.product-variants.store-nav.inquiry-form.claim-portal.portfolio-hero.work-summary.role-stack.case-section.metric-card.tool-stack.quote-block.case-gallery.case-gallery-item.related-works.editorial-title.editorial-columns.field-spec.demo-frame`.split(`.`));function Ro(e){let t=e.trim();return t===`true`?!0:t===`false`?!1:/^-?\d+(\.\d+)?$/.test(t)?Number(t):t}function zo(e){let t=e.slice(1,-1),n=t.findIndex(e=>e.trim()===`::`);return n>=0?{attrLines:t.slice(0,n),bodyLines:t.slice(n+1)}:{attrLines:t,bodyLines:[]}}function Bo(e){let t=e.replace(/\r\n/g,`
`).trimEnd().split(`
`),n=t[0]?.trim()||``,r=t[t.length-1]?.trim()||``,i=n.match(/^::([a-z0-9-]+)\s*$/);if(!i)return{ok:!1,reason:`missing_directive_open`,raw:e};if(r!==`::`)return{ok:!1,reason:`missing_directive_close`,raw:e};let a=i[1];if(!Lo.has(a))return{ok:!1,reason:`unknown_directive:${a}`,raw:e};let o={},s=[],{attrLines:c,bodyLines:l}=zo(t);for(let e of c){let t=e.match(/^([a-zA-Z][a-zA-Z0-9_-]*):\s*(.*)$/);if(t){o[t[1]]=Ro(t[2]);continue}s.push(e)}return s.push(...l),{ok:!0,directive:{name:a,rawName:a,attrs:o,body:s.join(`
`).trim(),raw:e}}}function Vo(e){if(e==null||e===``)return 50;let t=Number(e);return Number.isFinite(t)?Math.min(100,Math.max(0,t)):50}function Ho(e){let{attrs:t}=e;return!t.before||typeof t.before!=`string`?G(`before-after`,`missing_before`):!t.after||typeof t.after!=`string`?G(`before-after`,`missing_after`):`<before-after-wiper ${W({...t,initial:Vo(t.initial)})}></before-after-wiper>`}function Uo(e){let{name:t,attrs:n,body:r}=e,i=typeof n.title==`string`&&n.title.trim().length>0,a=r.trim().length>0;return!i&&!a?G(t,`missing_body_or_title`):`<callout-box data-type="${t}" ${W(n)}>${Io(r)}</callout-box>`}function Wo(e){let t={...e.attrs};if(!t.src||typeof t.src!=`string`)return G(`captioned-image`,`missing_src`);if(t.lightbox!==void 0&&typeof t.lightbox!=`boolean`)return G(`captioned-image`,`invalid_lightbox`);if(t.tag!==void 0&&typeof t.tag!=`string`)return G(`captioned-image`,`invalid_tag`);if(t.tag&&typeof t.tag==`string`&&!dt(t.tag))return G(`captioned-image`,`unknown_tag:${t.tag}`);if(t.caption!==void 0&&typeof t.caption!=`string`)return G(`captioned-image`,`invalid_caption`);if(typeof t.caption==`string`){let e=ft(t.caption);t.caption=e.caption,!t.tag&&e.tag&&(t.tag=e.tag)}return t.lightbox===void 0&&(t.lightbox=!0),`<captioned-image ${W(t)}></captioned-image>`}function Go(e,t){return`<div class="vt-directive-error" data-directive="${H(e)}" data-reason="${H(t)}">Invalid ${H(e)} directive: ${H(t)}</div>`}function Ko(e){let t={...e.attrs};return t.limit!==void 0&&typeof t.limit!=`number`?Go(`featured-works`,`invalid_limit`):(typeof t.limit==`number`&&(t.limit=Math.max(1,Math.min(24,t.limit))),`<featured-works ${W(t)}></featured-works>`)}function qo(e){let{attrs:t}=e;return!t.src||typeof t.src!=`string`?G(`image-card`,`missing_src`):`<image-card ${W(t)}></image-card>`}var Jo=new Set([`quiet`,`accent`,`ink`]);function Yo(e,t){return`<div class="vt-directive-error" data-directive="${H(e)}" data-reason="${H(t)}">Invalid ${H(e)} directive: ${H(t)}</div>`}function Xo(e){return Object.entries(e).reduce((e,[t,n])=>(e[t]=n,e),{})}function Zo(e){let t=Xo(e.attrs);return t.tone!==void 0&&(typeof t.tone!=`string`||!Jo.has(t.tone))?Yo(`section-break`,`invalid_tone`):`<section-break ${W(t)}></section-break>`}var Qo=new Set([`sm`,`md`,`lg`,`xl`]);function $o(e,t){return`<div class="vt-directive-error" data-directive="${H(e)}" data-reason="${H(t)}">Invalid ${H(e)} directive: ${H(t)}</div>`}function es(e){return Object.entries(e).reduce((e,[t,n])=>(e[t]=n,e),{})}function ts(e){let t=es(e.attrs);if(t.size!==void 0&&(typeof t.size!=`string`||!Qo.has(t.size)))return $o(`section-gap`,`invalid_size`);if(t.height!==void 0){if(typeof t.height!=`number`)return $o(`section-gap`,`invalid_height`);t.height=Math.min(240,Math.max(12,t.height))}return`<section-gap ${W(t)}></section-gap>`}function ns(e){let{attrs:t}=e,n=typeof t.src==`string`&&t.src.trim().length>0,r=typeof t.stream==`string`&&t.stream.trim().length>0;return!n&&!r?G(e.rawName||`video-player`,`missing_src_or_stream`):`<video-player ${W(t)}></video-player>`}function rs(e){return ns(e)}function is(e,t){return`<div class="vt-directive-error" data-directive="${H(e)}" data-reason="${H(t)}">Invalid ${H(e)} directive: ${H(t)}</div>`}function as(e){let t={...e.attrs},n=typeof t.slug==`string`&&t.slug.length>0,r=typeof t.title==`string`&&t.title.length>0;return!n&&!r?is(`work-card`,`missing_slug_or_title`):`<work-card ${W(t)}></work-card>`}var os=new Set([`auto`,`compact`,`wide`]),ss=new Set([`manual`,`title`,`order`,`date`]);function cs(e){if(typeof e==`boolean`)return e;if(typeof e==`string`){if(e===`true`)return!0;if(e===`false`)return!1}}function ls(e){if(e===void 0||e===``)return;let t=Number(e);if(Number.isFinite(t))return Math.max(1,Math.min(24,Math.floor(t)))}function us(e){let t=e.trim(),n=t.charAt(0),r=t.charAt(t.length-1);return n===`"`&&r===`"`||n===`'`&&r===`'`?t.slice(1,-1).trim():t}function ds(e){let t=e.trim().replace(/^\{/,``).replace(/\}$/,``).trim();if(!t)return null;let n={href:``};for(let e of t.split(`,`)){let[t,...r]=e.split(`:`),i=t?.trim(),a=us(r.join(`:`));!i||!a||(i===`href`||i===`title`||i===`description`||i===`thumbnail`||i===`tag`)&&(n[i]=a)}return n.href?n:null}function fs(e){let t=e.replace(/\r\n/g,`
`).split(`
`),n=[],r=null;function i(){r?.href&&n.push(r),r=null}for(let e of t){let t=e.trim();if(!t||t===`items:`)continue;let n=t.match(/^-\s*(.*)$/);if(n){i();let e=n[1].trim();r=(e.startsWith(`{`)?ds(e):null)||(/^href:/i.test(e)?{href:us(e.replace(/^href:\s*/i,``))}:{href:us(e)});continue}let a=t.match(/^(href|title|description|thumbnail|tag):\s*(.*)$/);if(a&&r){let e=a[1];r[e]=us(a[2])}}return i(),n.filter(e=>e.href)}function ps(e){return typeof e!=`string`||!e.trim()?[]:e.split(`,`).map(e=>({href:us(e)})).filter(e=>e.href)}function ms(e){return U(JSON.stringify(e))}function hs(e){let t={...e.attrs},n=[...ps(t.items),...fs(e.body)],r=typeof t.query==`string`?t.query.trim():``,i=typeof t.tag==`string`?t.tag.trim():``,a=typeof t.section==`string`?t.section.trim():``,o=cs(t.featured);if(!(n.length>0||r||i||a||o===!0))return G(`pagecard-grid`,`missing_source`);let s=ls(t.limit),c=typeof t.sort==`string`&&ss.has(t.sort)?t.sort:`manual`,l=typeof t.columns==`string`&&os.has(t.columns)?t.columns:`auto`;return`<pagecard-grid ${[`data-items="${ms(n)}"`,r?`data-query="${U(r)}"`:``,i?`data-tag="${U(i)}"`:``,a?`data-section="${U(a)}"`:``,o===void 0?``:`data-featured="${U(o)}"`,s===void 0?``:`data-limit="${U(s)}"`,`data-sort="${U(c)}"`,`data-columns="${U(l)}"`].filter(Boolean).join(` `)}></pagecard-grid>`}function K(e){return typeof e==`string`?e.trim():``}function gs(e){let t=K(e.attrs.id),n=K(e.attrs.title);return t?n?`<pagecard ${[`data-id="${U(t)}"`,`data-title="${U(n)}"`,K(e.attrs.description)?`data-description="${U(K(e.attrs.description))}"`:``,K(e.attrs.href)?`data-href="${U(K(e.attrs.href))}"`:``,K(e.attrs.tag)?`data-tag="${U(K(e.attrs.tag))}"`:``,K(e.attrs.image)?`data-image="${U(K(e.attrs.image))}"`:``,K(e.attrs.imageAssetId)?`data-image-asset-id="${U(K(e.attrs.imageAssetId))}"`:``,K(e.attrs.alt)?`data-alt="${U(K(e.attrs.alt))}"`:``].filter(Boolean).join(` `)}></pagecard>`:G(`pagecard`,`missing_title`):G(`pagecard`,`missing_id`)}var _s=new Set([`captioned-image`,`before-after`,`pagecard-grid`,`markdown-box`,`section-gap`,`section-break`,`image-card`,`featured-works`,`work-card`,`video`,`video-player`,`note`,`warning`,`tip`]),vs=/^::(?<name>[a-zA-Z][\w-]*)\s*$/;function ys(e,t={}){let n=[],r=e.replace(/\r\n/g,`
`).split(`
`),i=!1;for(let e=0;e<r.length;e+=1){let a=r[e]||``;if(/^\s*(```|~~~)/.test(a)){i=!i;continue}if(i)continue;let o=a.trim().match(vs)?.groups?.name;if(!o)continue;let s=(t.baseLine||1)+e;if(o===`markdown-box`){n.push({code:`nested_markdown_box`,directive:o,line:s,message:`markdown-box cannot be nested inside another markdown-box.`});continue}if(_s.has(o)){n.push({code:`nested_vue_directive_in_markdown_box`,directive:o,line:s,message:`markdown-box body does not support nested Vue markdown directive: ${o}.`});continue}n.push({code:`unknown_nested_directive`,directive:o,line:s,message:`markdown-box body contains an unknown directive-like block: ${o}.`})}return{warnings:n}}var bs=new Set([`note`,`tip`,`warning`,`danger`,`quote`,`decision`,`ssot`]),xs=new Set([`neutral`,`blue`,`amber`,`red`,`green`,`ink`]),Ss=new V({html:!1,linkify:!0,typographer:!0});function Cs(e){return typeof e==`string`?e.trim():``}function ws(e,t){if(typeof e==`boolean`)return e;if(typeof e==`string`){if(e===`true`)return!0;if(e===`false`)return!1}return t}function Ts(e,t){return`data-${e}="${U(t)}"`}function Es(e){return`nested_directive_not_supported:${[...new Set(e)].sort().join(`,`)}`}function Ds(e){let t=e.attrs,n=Cs(t.type)||`note`,r=bs.has(n)?n:`note`,i=Cs(t.tone),a=i&&xs.has(i)?i:``,o=Cs(t.title),s=Cs(t.icon),c=ws(t.collapsible,!1),l=ws(t.defaultOpen,!0),u=e.body.trim();if(!u&&!o)return G(`markdown-box`,`missing_body_or_title`);let d=ys(u);if(d.warnings.length)return G(`markdown-box`,Es(d.warnings.map(e=>e.directive)));let f=u?Ss.render(u):``;return`<markdown-box ${[Ts(`type`,r),o?Ts(`title`,o):``,a?Ts(`tone`,a):``,s?Ts(`icon`,s):``,Ts(`collapsible`,c),Ts(`default-open`,l)].filter(Boolean).join(` `)}><template data-markdown-box-html>${f}</template></markdown-box>`}var Os=new V({html:!1,linkify:!0,typographer:!0});function q(e){return typeof e==`string`?e.trim():``}function ks(e){if(typeof e==`boolean`)return e;if(typeof e==`string`){let t=e.trim().toLowerCase();if(t===`true`)return!0;if(t===`false`)return!1}}function As(e){let t=q(e.tag),n=q(e.badge),r=t||n;if(r){if(!dt(r))throw Error(`invalid_tag:${r}`);return r}let i=ks(e.required);return i===!0?`필수`:i===!1?`선택`:`기타`}function js(e,t){return`data-${e}="${U(t)}"`}function Ms(e,t){return t?`<div class="vt-field-spec__meta-row"><dt>${H(e)}</dt><dd>${H(t)}</dd></div>`:``}function Ns(e){let t=e.attrs,n=q(t.name);if(!n)return G(`field-spec`,`missing_name`);let r;try{r=As(t)}catch(e){return G(`field-spec`,e instanceof Error?e.message:`invalid_tag`)}let i=ks(t.required),a=q(t.type),o=q(t.default),s=q(t.ssot),c=q(t.usedBy)||q(t.usedby),l=q(t.note),u=e.body.trim(),d=u?Os.render(u):``,f=i===void 0?``:String(i),p=[js(`tag`,r),f?js(`required`,f):``].filter(Boolean).join(` `),m=[Ms(`type`,a),Ms(`default`,o),Ms(`SSOT`,s),Ms(`used by`,c),Ms(`note`,l)].filter(Boolean).join(``);return[`<section class="vt-field-spec" ${p}>`,`<header class="vt-field-spec__header">`,`<code class="vt-field-spec__name">${H(n)}</code>`,`<span class="vt-field-spec__tag" data-type="${U(r)}">${H(r)}</span>`,`</header>`,m?`<dl class="vt-field-spec__meta">${m}</dl>`:``,d?`<div class="vt-field-spec__body">${d}</div>`:``,`</section>`].filter(Boolean).join(``)}var Ps=new V({html:!1,linkify:!0,typographer:!0});function J(e){return typeof e==`string`?e.trim():``}function Fs(e){if(typeof e==`boolean`)return e;if(typeof e==`string`){let t=e.trim().toLowerCase();if(t===`true`)return!0;if(t===`false`)return!1}}function Is(e){if(typeof e==`number`)return e;if(typeof e==`string`){let t=Number(e.trim());if(Number.isFinite(t))return t}}function Y(e,t){return t===void 0||t===``?``:`data-${e}="${U(t)}"`}function Ls(e){let t=e.attrs,n=J(t.id),r=J(t.src);if(!n&&!r)return G(`demo-frame`,`missing_id_or_src`);let i=J(t.stackJson)||J(t.stack),a=Fs(t.allowFullscreen)??Fs(t.fullscreen),o=Fs(t.autoResize),s=Is(t.minHeight),c=Is(t.maxHeight),l=e.body.trim(),u=l?Ps.render(l):``;return`<demo-frame ${[Y(`id`,n),Y(`src`,r),Y(`title`,J(t.title)),Y(`ratio`,J(t.ratio)),Y(`status`,J(t.status)),Y(`description`,J(t.description)),Y(`stack-json`,i),Y(`sandbox`,J(t.sandbox)),Y(`allow-fullscreen`,a),Y(`auto-resize`,o),Y(`min-height`,s),Y(`max-height`,c)].filter(Boolean).join(` `)}><template data-demo-frame-html>${u}</template></demo-frame>`}function Rs(e){let{attrs:t,body:n}=e;return gt(n).length?`<gallery-strip ${W(t)}><template data-gallery-strip-items>${H(n)}</template></gallery-strip>`:G(`gallery-strip`,`missing_items`)}var zs=new Set([`products`,`works`,`tools`,`lab`,`all`]),Bs=new Set([`product-grid`,`card-grid`,`compact-list`]),Vs=new Set([`notice`,`hide`]);function Hs(e){if(typeof e==`boolean`)return e;if(typeof e==`string`){if(e===`true`)return!0;if(e===`false`)return!1}}function Us(e){if(e===void 0||e===``)return;let t=Number(e);if(Number.isFinite(t))return Math.max(1,Math.min(24,Math.floor(t)))}function Ws(e){return typeof e==`string`?e.split(`,`).map(e=>e.trim()).filter(Boolean).join(`,`):``}function Gs(e){return typeof e==`string`?e.trim():``}function Ks(e){let t={...e.attrs},n=typeof t.source==`string`&&zs.has(t.source)?t.source:``,r=typeof t.title==`string`?t.title.trim():``;if(!n)return G(`home-section`,`invalid_source`);if(!r)return G(`home-section`,`missing_title`);let i=Hs(t.featured),a=Hs(t.showUnavailable),o=Us(t.limit),s=typeof t.layout==`string`&&Bs.has(t.layout)?t.layout:`card-grid`,c=Ws(t.tags),l=typeof t.emptyMode==`string`&&Vs.has(t.emptyMode)?t.emptyMode:`notice`,u=Gs(t.emptyTitle),d=Gs(t.emptyBody),f=Gs(t.emptyHref),p=Gs(t.emptyLabel);return`<home-section ${[W({title:r,source:n,layout:s}),i===void 0?``:`data-featured="${U(i)}"`,a===void 0?``:`data-show-unavailable="${U(a)}"`,o===void 0?``:`data-limit="${U(o)}"`,typeof t.status==`string`?`data-status="${U(t.status)}"`:``,c?`data-tags="${U(c)}"`:``,`data-empty-mode="${U(l)}"`,u?`data-empty-title="${U(u)}"`:``,d?`data-empty-body="${U(d)}"`:``,f?`data-empty-href="${U(f)}"`:``,p?`data-empty-label="${U(p)}"`:``].filter(Boolean).join(` `)}></home-section>`}function qs(e){return`<product-cta></product-cta>`}function Js(e){return`<product-trust></product-trust>`}function Ys(e){return`<product-specs></product-specs>`}var Xs=new Set([`order`,`newest`,`oldest`,`title`,`price-low`,`price-high`]);function Zs(e){if(typeof e==`boolean`)return e;if(typeof e==`string`){if(e===`true`)return!0;if(e===`false`)return!1}}function Qs(e){if(e===void 0||e===``)return;let t=Number(e);if(Number.isFinite(t))return Math.max(1,Math.min(96,Math.floor(t)))}function X(e){return typeof e==`string`?e.trim():``}function $s(e,t){return t===void 0?``:`${e}="${U(t)}"`}function ec(e){let t={...e.attrs},n=Qs(t.limit),r=Zs(t.showUnavailable),i=Zs(t.showCategoryFilter),a=Zs(t.showSubcategoryFilter),o=Zs(t.showCollectionFilter),s=typeof t.defaultSort==`string`&&Xs.has(t.defaultSort)?t.defaultSort:`order`;return`<product-catalog ${[X(t.title)?`data-title="${U(X(t.title))}"`:``,X(t.intro)?`data-intro="${U(X(t.intro))}"`:``,n===void 0?``:`data-limit="${U(n)}"`,$s(`data-show-unavailable`,r),$s(`data-show-category-filter`,i),$s(`data-show-subcategory-filter`,a),$s(`data-show-collection-filter`,o),X(t.defaultStatus)?`data-default-status="${U(X(t.defaultStatus))}"`:``,X(t.defaultType)?`data-default-type="${U(X(t.defaultType))}"`:``,X(t.defaultCategory)?`data-default-category="${U(X(t.defaultCategory))}"`:``,X(t.defaultSubcategory)?`data-default-subcategory="${U(X(t.defaultSubcategory))}"`:``,X(t.defaultCollection)?`data-default-collection="${U(X(t.defaultCollection))}"`:``,X(t.defaultTag)?`data-default-tag="${U(X(t.defaultTag))}"`:``,X(t.defaultQuery)?`data-default-query="${U(X(t.defaultQuery))}"`:``,`data-default-sort="${U(s)}"`,X(t.emptyTitle)?`data-empty-title="${U(X(t.emptyTitle))}"`:``,X(t.emptyBody)?`data-empty-body="${U(X(t.emptyBody))}"`:``].filter(Boolean).join(` `)}></product-catalog>`}function tc(e){return String(e??``).replace(/"/g,`&quot;`)}function nc(e){return`<product-variant-selector data-title="${tc(e.attrs.title||`Choose a license option`)}" data-show-price="${e.attrs.showPrice===!1?`false`:`true`}"></product-variant-selector>`}function rc(e){if(typeof e==`boolean`)return e;if(typeof e==`string`){if(e===`true`)return!0;if(e===`false`)return!1}}function Z(e){return typeof e==`string`?e.trim():``}function ic(e){return e===`collections`||e===`mixed`?e:`categories`}function ac(e,t){return t===void 0?``:`${e}="${U(t)}"`}function oc(e){let t={...e.attrs},n=ic(t.mode),r=rc(t.showCounts),i=rc(t.showEmpty),a=rc(t.includeAllLink);return`<store-navigation-rail ${[Z(t.title)?`data-title="${U(Z(t.title))}"`:``,Z(t.intro)?`data-intro="${U(Z(t.intro))}"`:``,`data-mode="${U(n)}"`,Z(t.currentCategory)?`data-current-category="${U(Z(t.currentCategory))}"`:``,Z(t.currentCollection)?`data-current-collection="${U(Z(t.currentCollection))}"`:``,ac(`data-show-counts`,r),ac(`data-show-empty`,i),ac(`data-include-all-link`,a),Z(t.allHref)?`data-all-href="${U(Z(t.allHref))}"`:``,Z(t.categoriesHrefBase)?`data-categories-href-base="${U(Z(t.categoriesHrefBase))}"`:``,Z(t.collectionsHrefBase)?`data-collections-href-base="${U(Z(t.collectionsHrefBase))}"`:``,Z(t.emptyLabel)?`data-empty-label="${U(Z(t.emptyLabel))}"`:``].filter(Boolean).join(` `)}></store-navigation-rail>`}function sc(e,t){if(typeof e==`boolean`)return e;if(typeof e==`string`){if(e===`true`)return!0;if(e===`false`)return!1}return t}function cc(e){return typeof e==`string`?e.trim():``}function lc(e){let t={...e.attrs};return`<inquiry-form ${[`data-vt-component="inquiry-form"`,cc(t.title)?`data-title="${U(cc(t.title))}"`:``,cc(t.intro)?`data-intro="${U(cc(t.intro))}"`:``,`data-require-nickname="${U(sc(t.requireNickname,!0))}"`,`data-require-gate-code="${U(sc(t.requireGateCode,!0))}"`,`data-require-email="${U(sc(t.requireEmail,!1))}"`,cc(t.submitLabel)?`data-submit-label="${U(cc(t.submitLabel))}"`:``].filter(Boolean).join(` `)}></inquiry-form>`}function uc(e,t){if(typeof e==`boolean`)return e;if(typeof e==`string`){if(e===`true`)return!0;if(e===`false`)return!1}return t}function dc(e){return typeof e==`string`?e.trim():``}function fc(e){let t={...e.attrs};return`<claim-portal ${[`data-vt-component="claim-portal"`,dc(t.title)?`data-title="${U(dc(t.title))}"`:``,dc(t.intro)?`data-intro="${U(dc(t.intro))}"`:``,`data-require-claim-token="${U(uc(t.requireClaimToken,!0))}"`,`data-require-email="${U(uc(t.requireEmail,!1))}"`,`data-require-order-id="${U(uc(t.requireOrderId,!1))}"`,dc(t.submitLabel)?`data-submit-label="${U(dc(t.submitLabel))}"`:``].filter(Boolean).join(` `)}></claim-portal>`}var pc=new V({html:!1,linkify:!0,typographer:!0});function Q(e){return typeof e==`string`?e.trim():e==null?``:String(e).trim()}function $(e,t,n=`data-portfolio-html`){let r=t.body.trim()?pc.render(t.body.trim()):``;return`<${e} ${W(t.attrs)}><template ${n}>${r}</template></${e}>`}function mc(e){return e===`major`||e===`minor`?e:`middle`}function hc(e,t){return e===`h1`||e===`h2`||e===`h3`||e===`h4`?e:t===`major`?`h2`:t===`minor`?`h4`:`h3`}function gc(e){return e===`center`?`center`:`left`}function _c(e){return e===`3`?3:2}function vc(e){return e===`sm`||e===`lg`?e:`md`}function yc(e){return e===`tablet`||e===`never`?e:`mobile`}function bc(e){let t=e.replace(/\r\n/g,`
`).trim();return t?t.split(/^---\s*$/m).map(e=>e.trim()).filter(Boolean):[]}function xc(e){if(!Q(e.attrs.title))return G(`editorial-title`,`missing_title`);let t=mc(Q(e.attrs.level));return`<editorial-title ${W({...e.attrs,level:t,as:hc(Q(e.attrs.as),t),align:gc(Q(e.attrs.align))})}></editorial-title>`}function Sc(e){let t=_c(Q(e.attrs.cols||e.attrs.columns)),n=bc(e.body);if(n.length<2)return G(`editorial-columns`,`missing_columns`);if(n.length>t)return G(`editorial-columns`,`too_many_columns`);let r={...e.attrs,cols:t,gap:vc(Q(e.attrs.gap)),collapse:yc(Q(e.attrs.collapse)),balance:e.attrs.balance===!0||Q(e.attrs.balance)===`true`},i=n.map(e=>`<template data-editorial-column-html>${pc.render(e)}</template>`).join(``);return`<editorial-columns ${W(r)}>${i}</editorial-columns>`}function Cc(e){return!Q(e.attrs.title)&&!e.body.trim()?G(`portfolio-hero`,`missing_title_or_body`):$(`portfolio-hero`,e)}function wc(e){return!Q(e.attrs.title)&&!e.body.trim()?G(`work-summary`,`missing_title_or_body`):$(`work-summary`,e)}function Tc(e){return $(`role-stack`,e)}function Ec(e){return Q(e.attrs.type)?!e.body.trim()&&!Q(e.attrs.title)?G(`case-section`,`missing_body_or_title`):$(`case-section`,e):G(`case-section`,`missing_type`)}function Dc(e){return!Q(e.attrs.title)&&!Q(e.attrs.value)?G(`metric-card`,`missing_title_or_value`):$(`metric-card`,e)}function Oc(e){return $(`tool-stack`,e)}function kc(e){return e.body.trim()?$(`quote-block`,e):G(`quote-block`,`missing_body`)}function Ac(e){return gt(e.body).length?`<case-gallery ${W(e.attrs)}><template data-case-gallery-items>${H(e.body)}</template></case-gallery>`:G(`case-gallery`,`missing_items`)}function jc(e){return Q(e.attrs.src)?`<case-gallery-item ${W(e.attrs)}></case-gallery-item>`:G(`case-gallery-item`,`missing_src`)}function Mc(e){return $(`related-works`,e,`data-related-works-body`)}function Nc(e){switch(e.name){case`video`:return rs(e);case`video-player`:return ns(e);case`before-after`:return Ho(e);case`image-card`:return qo(e);case`captioned-image`:return Wo(e);case`note`:case`warning`:case`tip`:return Uo(e);case`section-gap`:return ts(e);case`section-break`:return Zo(e);case`featured-works`:return Ko(e);case`work-card`:return as(e);case`pagecard-grid`:return hs(e);case`pagecard`:return gs(e);case`markdown-box`:return Ds(e);case`gallery-strip`:return Rs(e);case`home-section`:return Ks(e);case`product-cta`:return qs(e);case`product-trust`:return Js(e);case`product-specs`:return Ys(e);case`product-catalog`:return ec(e);case`product-variants`:return nc(e);case`store-nav`:return oc(e);case`inquiry-form`:return lc(e);case`claim-portal`:return fc(e);case`portfolio-hero`:return Cc(e);case`work-summary`:return wc(e);case`role-stack`:return Tc(e);case`case-section`:return Ec(e);case`metric-card`:return Dc(e);case`tool-stack`:return Oc(e);case`quote-block`:return kc(e);case`case-gallery`:return Ac(e);case`case-gallery-item`:return jc(e);case`related-works`:return Mc(e);case`editorial-title`:return xc(e);case`editorial-columns`:return Sc(e);case`field-spec`:return Ns(e);case`demo-frame`:return Ls(e);default:return e.raw}}function Pc(e,t){let n=e.bMarks[t]+e.tShift[t],r=e.eMarks[t];return e.src.slice(n,r).trim()}function Fc(e,t,n){let r=t+1;for(;r<n;){if(Pc(e,r)===`::`)return r;r+=1}return-1}var Ic=new Set([`markdown-box`,`gallery-strip`,`editorial-columns`,`portfolio-hero`,`work-summary`,`role-stack`,`case-section`,`metric-card`,`tool-stack`,`quote-block`,`case-gallery`,`related-works`,`field-spec`]);function Lc(e,t,n){let r=Fc(e,t,n);if(r<0)return-1;let i=0,a=r+1,o=!1;for(;a<n;){let t=Pc(e,a);if(/^::[a-z0-9-]+\s*$/.test(t)){i+=1,o=!0,a+=1;continue}if(t===`::`){if(i>0){--i,o=!0,a+=1;continue}return a}t&&(o=!0),a+=1}return o?-1:r}function Rc(e){e.block.ruler.before(`fence`,`varun_directive`,(e,t,n,r)=>{let i=e.bMarks[t]+e.tShift[t],a=e.eMarks[t],o=e.src.slice(i,a).trim().match(/^::([a-z0-9-]+)\s*$/);if(!o)return!1;let s=o[1],c=Ic.has(s)?Lc(e,t,n):Fc(e,t,n);if(c<0)return!1;if(r)return!0;let l=e.bMarks[t],u=e.eMarks[c],d=e.src.slice(l,u),f=e.push(`varun_directive`,``,0);return f.block=!0,f.map=[t,c+1],f.content=d,e.line=c+1,!0}),e.renderer.rules.varun_directive=(e,t)=>{let n=e[t].content,r=Bo(n);return r.ok?Nc(r.directive):Fo(n,r.reason)}}function zc(e){let t=e.renderer.rules.image||((e,t,n,r,i)=>i.renderToken(e,t,n));e.renderer.rules.image=(e,n,r,i,a)=>{let o=e[n],s=o.attrGet(`src`)||``,c=o.content||o.attrGet(`alt`)||``,l=o.attrGet(`title`)||``;if(!s)return t(e,n,r,i,a);let u=l?ft(l):{tag:``,caption:``};return`<captioned-image ${W({src:s,alt:c,caption:u.caption,tag:u.tag,lightbox:!0})}></captioned-image>`}}function Bc(){let e=new V({html:!1,linkify:!0,typographer:!0});return e.use(Rc),zc(e),e}function Vc(e){return e.trim().toLowerCase().normalize(`NFKD`).replace(/[^\w가-힣\s-]/g,``).replace(/\s+/g,`-`).replace(/-+/g,`-`).replace(/^-|-$/g,``)||`section`}function Hc(e,t){let n=Vc(e),r=t.get(n)||0;return t.set(n,r+1),r===0?n:`${n}-${r+1}`}function Uc(e){return e.replace(/<[^>]+>/g,``).replace(/&amp;/g,`&`).replace(/&lt;/g,`<`).replace(/&gt;/g,`>`).replace(/&quot;/g,`"`).replace(/&#39;/g,`'`).trim()}function Wc(e,t=``){let n=Bc(),r=[],i=new Map,a=n.renderer.rules.heading_open||((e,t,n,r,i)=>i.renderToken(e,t,n));return n.renderer.rules.heading_open=(e,t,n,o,s)=>{let c=e[t],l=e[t+1],u=Number(c.tag.replace(`h`,``));if(u<1||u>3)return a(e,t,n,o,s);let d=Uc(l?.content||``),f=Hc(d,i);return c.attrSet(`id`,f),r.push({id:f,text:d,level:u,order:r.length}),a(e,t,n,o,s)},{html:n.render(e,{contentDir:t}),headings:r}}var Gc=[{sourcePath:`src/content/pages/page/231325343/index.md`,contentDir:`page/231325343`,materializedSlug:`page/231325343`,routePath:`/page/231325343`,raw:`---
schema: "{\\"packId\\":\\"page\\",\\"packVersion\\":\\"cms-schema-pack-v1\\"}"
layout: "default"
showInNav: "true"
navLabel: "3252"
tags:
  - "3252523523"
title: "342523523"
summary: "5235325235"
category: "page"
slug: "page/231325343"
source: "vacms"
vacmsSlug: "231325343"
vacmsPageId: "page_2e4da4ab42148326ad0c123c"
vacmsRevisionId: "rev_9ad9d1ce9c887c2cfaaffb89"
---



::case-section
type: process
title: ewrwrewrwe
kind: ewrwerewrew
::
werwerew
::
`}],Kc=Object.assign({"../content/pages/checkout/fail/index.md":_t,"../content/pages/checkout/success/index.md":vt,"../content/pages/claim/index.md":yt,"../content/pages/home/index.md":bt,"../content/pages/inquiry/index.md":xt,"../content/pages/lab-markdown-gallery/index.md":St,"../content/pages/page/231325343/index.md":Ct,"../content/pages/page/sdsdsd/index.md":wt,"../content/pages/page/testt11/index.md":Tt,"../content/pages/policies/digital-download/index.md":Et,"../content/pages/policies/index.md":Dt,"../content/pages/policies/privacy/index.md":Ot,"../content/pages/policies/refund/index.md":kt,"../content/pages/policies/shipping/index.md":At,"../content/pages/policies/store/index.md":jt,"../content/pages/post/asdasdsads/index.md":Mt,"../content/pages/post/dsfsdfjkdsfdsf/index.md":Nt,"../content/pages/post/pspspspspspps/index.md":Pt,"../content/pages/products/categories/index.md":Ft,"../content/pages/products/categories/templates/index.md":It,"../content/pages/products/dummy-catalog/index.md":Lt,"../content/pages/products/index.md":Rt,"../content/pages/products/spec-playground/index.md":zt,"../content/pages/qa/ewa-gallery/index.md":Bt,"../content/pages/wiper/index.md":Vt,"../content/pages/works/editorial-showcase/index.md":Ht,"../content/pages/works/index.md":Ut,"../content/pages/works/varuntools-showroom/index.md":Wt});function qc(e){return e.replace(`../content/pages/`,``).replace(`/index.md`,``)}function Jc(e,t){let n=Hn(e),r=n.frontmatter.slug||t,i=In(n.content),a=Wc(i.content,t);return{slug:r,contentDir:t,raw:e,frontmatter:n.frontmatter,html:a.html,headings:a.headings,legacyTransforms:i.report}}function Yc(){let e=Object.entries(Kc).map(([e,t])=>Jc(String(t),qc(e))),t=Gc.filter(e=>String(e.raw||``).trim()).map(e=>Jc(String(e.raw||``),e.contentDir||e.materializedSlug)),n=new Map;for(let t of e)n.set(t.contentDir,t);for(let e of t)n.set(e.contentDir,e);return[...n.values()]}var Xc=[{name:`home`,path:``,reason:`site-home`},{name:`index`,path:`index`,reason:`public-content-index-page`},{name:`works`,path:`works`,reason:`works-collection-page`},{name:`works-tags`,path:`works/tags`,reason:`works-tag-landing-prefix`},{name:`content-index`,path:`index`,reason:`public-content-index-page`},{name:`search`,path:`search`,reason:`site-search-page`},{name:`not-found`,path:`404`,reason:`not-found-page`}];function Zc(e){return e.trim().replace(/^\/+|\/+$/g,``).replace(/\/+/g,`/`)}function Qc(e){let t=Zc(e);return Xc.some(e=>e.path===t)}function $c(){return Xc.map(e=>e.path)}function el(e){let t=new Map,n=[];for(let r of e){let e=Zc(r.slug);if(!e){n.push({kind:`empty-slug`,slug:e,message:`Markdown page has an empty slug.`,pages:[r.contentDir]});continue}let i=t.get(e)||[];i.push(r.contentDir),t.set(e,i),Qc(e)&&n.push({kind:`reserved-slug-conflict`,slug:e,message:`Markdown slug conflicts with reserved route: ${e}`,pages:[r.contentDir]})}for(let[e,r]of t.entries())r.length>1&&n.push({kind:`duplicate-slug`,slug:e,message:`Duplicate Markdown slug: ${e}`,pages:r});return{markdownSlugs:[...t.keys()].sort(),reservedPaths:$c(),issues:n}}var tl=Yc(),nl=s(()=>el(tl));nl.value;function rl(){return{pages:tl,manifest:nl}}export{Le as a,Ke as c,fe as d,pe as f,lt as i,Je as l,_ as m,gt as n,Re as o,_e as p,dt as r,Ge as s,rl as t,ve as u};