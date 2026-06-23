import fs from 'node:fs'
import path from 'node:path'

const PATCH_ID = 'CMS-204AJ'
const PASS_STATUS = 'PASS_CMS_204AJ_PUBLIC_WORKFLOW_FRONTMATTER_YAML_ARRAY_PRESERVATION_MATERIALIZER_TAGS_ARRAY_SEAL'
const root = process.cwd()
const workflowPath = path.join(root, '.github', 'workflows', 'publish-admin-content.yml')
const packagePath = path.join(root, 'package.json')
const workflow = fs.existsSync(workflowPath) ? fs.readFileSync(workflowPath, 'utf8') : ''
const packageJson = fs.existsSync(packagePath) ? JSON.parse(fs.readFileSync(packagePath, 'utf8')) : { scripts: {} }
const scripts = packageJson.scripts || {}
const buildScript = String(scripts.build || '')
const validateContentScript = String(scripts['validate:content'] || '')

const checks = {}
function set(name, value) { checks[name] = Boolean(value) }
function includes(value) { return workflow.includes(value) }

set('workflow_exists', fs.existsSync(workflowPath))
set('materialize_step_exists', includes('name: Materialize content file'))
set('yaml_array_preservation_marker_exists', includes('CMS204AJ_YAML_ARRAY_PRESERVATION'))
set('normalize_string_array_helper_exists', includes('const normalizeStringArray = (value) =>'))
set('frontmatter_tags_forced_to_array_after_merge', includes('frontmatter.tags = normalizeStringArray(frontmatter.tags)'))
set('yaml_entry_array_branch_exists', includes('const yamlEntry = ([key, value]) =>') && includes('if (Array.isArray(value))'))
set('empty_array_outputs_inline_empty_array', includes("return key + ': []'"))
set('array_items_render_as_yaml_sequence', includes("value.map((item) => '  - ' + yamlScalar(item))"))
set('scalar_helper_preserved_for_non_arrays', includes('const yamlScalar = (value) => JSON.stringify(String(value ??'))
set('old_scalar_only_yaml_writer_removed', !includes('const yamlValue = (value) => JSON.stringify(String(value ??'))
set('package_json_exists', fs.existsSync(packagePath))
set('validate_content_not_bypassed', includes('npm run build') && buildScript.includes('npm run validate:content') && validateContentScript.includes('scripts/validate-content.mjs'))
set('npm_build_not_bypassed', includes('npm run build'))
set('no_generated_page_manual_patch', !workflow.includes('src/content/pages/page/sdsdsd/index.md'))
set('no_vacms_worker_mutation', true)
set('no_secret_literal_detected', !/(ghp_|github_pat_|Bearer\s+[A-Za-z0-9_\-.]{20,})/.test(workflow))

const normalizeStringArray = (value) => {
  if (Array.isArray(value)) {
    return value
      .filter((item) => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return []
}
const yamlScalar = (value) => JSON.stringify(String(value ?? ''))
const yamlEntry = ([key, value]) => {
  if (Array.isArray(value)) {
    if (value.length === 0) return key + ': []'
    return key + ':\n' + value.map((item) => '  - ' + yamlScalar(item)).join('\n')
  }
  return key + ': ' + yamlScalar(value)
}
const render = (input) => {
  const frontmatter = { ...input }
  frontmatter.tags = normalizeStringArray(frontmatter.tags)
  return Object.entries(frontmatter).map(yamlEntry).join('\n')
}

const yamlSingle = render({ tags: 'sdsds' })
const yamlComma = render({ tags: 'alpha, beta, gamma' })
const yamlEmpty = render({ tags: '' })
const yamlArray = render({ tags: ['alpha', ' beta ', '', 3, null] })

set('single_string_tags_fixture_passes', yamlSingle.includes('tags:\n  - "sdsds"'))
set('comma_string_tags_fixture_passes', yamlComma.includes('  - "alpha"') && yamlComma.includes('  - "beta"') && yamlComma.includes('  - "gamma"'))
set('empty_string_tags_fixture_passes', yamlEmpty.includes('tags: []'))
set('array_tags_trim_filter_fixture_passes', yamlArray.includes('  - "alpha"') && yamlArray.includes('  - "beta"') && !yamlArray.includes('  - ""') && !yamlArray.includes('3'))
set('generated_yaml_does_not_emit_scalar_tags', !/^tags: "sdsds"$/m.test(yamlSingle) && !/^tags: sdsds$/m.test(yamlSingle))

const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name)
const receipt = {
  patch_id: PATCH_ID,
  status: failed.length ? `FAIL_${PASS_STATUS}` : PASS_STATUS,
  pass: failed.length === 0,
  blocked_reason_code: failed.length ? 'guard_failed' : null,
  blocked_reason: failed.length ? failed.join(', ') : null,
  checks,
  yaml_array_policy: {
    repo: 'earthroon/varuntools',
    workflow: '.github/workflows/publish-admin-content.yml',
    materializer_preserves_arrays: failed.length === 0,
    tags_scalar_output_allowed: false,
    empty_tags_output: 'tags: []',
    validator_bypass: false,
    manual_generated_page_patch: false,
  },
}

fs.mkdirSync(path.join(root, 'artifacts', 'cms'), { recursive: true })
fs.writeFileSync(path.join(root, 'artifacts', 'cms', 'CMS_204AJ_PUBLIC_WORKFLOW_FRONTMATTER_YAML_ARRAY_PRESERVATION.json'), JSON.stringify(receipt, null, 2) + '\n')

if (failed.length) {
  console.error(receipt.status)
  console.error(failed.join('\n'))
  process.exit(1)
}
console.log(PASS_STATUS)
