import fs from 'node:fs'

const workflow = fs.readFileSync('.github/workflows/publish-admin-content.yml', 'utf8')

if (!workflow.includes('CMS209F_PUBLIC_ASSET_URL_REWRITE')) {
  throw new Error('CMS209F_REWRITE_MARKER_MISSING')
}
if (!workflow.includes('const publicAssetBaseUrl = String(data.snapshot?.publicAssetBaseUrl ||')) {
  throw new Error('CMS209F_PUBLIC_ASSET_BASE_URL_SOURCE_MISSING')
}
if (!workflow.includes('const materializedFrontmatter = rewriteRuntimeAssetValue(frontmatter)')) {
  throw new Error('CMS209F_MATERIALIZED_FRONTMATTER_MISSING')
}
if (!workflow.includes('const materializedBodyValue = rewriteRuntimeAssetString(bodySource.value)')) {
  throw new Error('CMS209F_MATERIALIZED_BODY_MISSING')
}
if (!workflow.includes('Object.entries(materializedFrontmatter)')) {
  throw new Error('CMS209F_YAML_NOT_USING_MATERIALIZED_FRONTMATTER')
}
if (!workflow.includes('materializedBodyValue.replace')) {
  throw new Error('CMS209F_CONTENT_NOT_USING_MATERIALIZED_BODY')
}

console.log('CMS209F_PUBLIC_ASSET_URL_REWRITE_PASS')
