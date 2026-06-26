import { resolveFilesystemAsset } from './lib/asset-registry.mjs'

const result = resolveFilesystemAsset({
  source: '/assets/content/page_3576763e4b3169f973471d57/asset_52b7c6ef91d0551f80ff045e/cover.webp',
  projectRoot: process.cwd(),
})

if (!result.found) throw new Error('CMS209B_RUNTIME_ASSET_PROXY_NOT_ACCEPTED')
if (result.kind !== 'runtime') throw new Error(`CMS209B_RUNTIME_ASSET_PROXY_KIND_INVALID:${result.kind}`)
if (result.reason !== 'runtime_content_asset_proxy') throw new Error(`CMS209B_RUNTIME_ASSET_PROXY_REASON_INVALID:${result.reason}`)

console.log('CMS209B_RUNTIME_CONTENT_ASSET_PATH_RESOLVER_PASS')
