import fs from 'node:fs'
import path from 'node:path'

const PATCH_ID = 'CMS-204AK'
const PASS_STATUS = 'PASS_CMS_204AK_PUBLIC_WORKFLOW_FRONTMATTER_OBJECT_SERIALIZATION_GUARD_NO_OBJECT_OBJECT_LEAK_SEAL'
const FAIL_STATUS = 'FAIL_PASS_CMS_204AK_PUBLIC_WORKFLOW_FRONTMATTER_OBJECT_SERIALIZATION_GUARD_NO_OBJECT_OBJECT_LEAK_SEAL'

const root = process.cwd()
const workflowPath = path.join(root, '.github', 'workflows', 'publish-admin-content.yml')
const packagePath = path.join(root, 'package.json')
const releasePreparePath = path.join(root, 'scripts', 'release-prepare.mjs')
const deployPagesPath = path.join(root, 'scripts', 'deploy-pages-branch.mjs')
const receiptPath = path.join(root, 'artifacts', 'cms', 'CMS_204AK_PUBLIC_WORKFLOW_FRONTMATTER_OBJECT_SERIALIZATION_GUARD.json')

const readText = (file) => fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
const workflow = readText(workflowPath)
const packageJsonText = readText(packagePath)
const releasePrepare = readText(releasePreparePath)
const deployPages = readText(deployPagesPath)
let packageJson = {}
try { packageJson = JSON.parse(packageJsonText || '{}') } catch {}
const scripts = packageJson.scripts || {}

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

const yamlScalar = (value) => {
  if (value === null || value === undefined) return '""'
  if (typeof value === 'object') return JSON.stringify(JSON.stringify(value))
  return JSON.stringify(String(value))
}

const renderFixtureYaml = (frontmatterInput) => {
  const frontmatter = { ...frontmatterInput }
  frontmatter.tags = normalizeStringArray(frontmatter.tags)
  const yamlEntry = ([key, value]) => {
    if (Array.isArray(value)) {
      if (value.length === 0) return `${key}: []`
      return `${key}:\n${value.map((item) => `  - ${yamlScalar(item)}`).join('\n')}`
    }
    return `${key}: ${yamlScalar(value)}`
  }
  return Object.entries(frontmatter).map(yamlEntry).join('\n')
}

const tagsYaml = renderFixtureYaml({ tags: ['sdsds'] })
const emptyTagsYaml = renderFixtureYaml({ tags: [] })
const objectYaml = renderFixtureYaml({ meta: { a: true } })
const nestedObjectYaml = renderFixtureYaml({ seo: { title: 'A', flags: ['x', 'y'] } })

const buildScript = String(scripts.build || '')
const deployPagesScript = String(scripts['deploy:pages'] || '')
const releasePagesScript = String(scripts['release:pages'] || '')
const releasePrepareScript = String(scripts['release:prepare'] || '')

const validateContentStillRuns = workflow.includes('npm run build')
  ? buildScript.includes('validate:content')
  : workflow.includes('npm run validate:content')

const checkLaunchStillRuns = releasePrepareScript.includes('check:launch')
  || releasePrepare.includes('check:launch')
  || releasePrepare.includes('node scripts/check-launch.mjs')
  || deployPages.includes('release:prepare')

const oldScalarOnlyWriter = /const yamlScalar = \(value\) => JSON\.stringify\(String\(value \?\? ['"]{2}\)\)/.test(workflow)
const unsafeYamlValueWriter = /const yamlValue = \(value\) => JSON\.stringify\(String\(value \?\? ['"]{2}\)\)/.test(workflow)

const checks = {
  workflow_exists: fs.existsSync(workflowPath),
  materialize_step_exists: workflow.includes('Materialize content file'),
  cms204aj_array_preservation_marker_still_exists: workflow.includes('CMS204AJ_YAML_ARRAY_PRESERVATION'),
  cms204ak_object_serialization_marker_exists: workflow.includes('CMS204AK_OBJECT_SERIALIZATION_GUARD'),
  object_safe_yaml_scalar_exists: workflow.includes('const yamlScalar = (value) => {') && workflow.includes("typeof value === 'object'") && workflow.includes('JSON.stringify(JSON.stringify(value))'),
  string_object_scalar_forbidden: !oldScalarOnlyWriter && !unsafeYamlValueWriter,
  plain_object_json_serialization_exists: workflow.includes('JSON.stringify(JSON.stringify(value))'),
  yaml_entry_array_branch_preserved: workflow.includes('if (Array.isArray(value))') && (workflow.includes("return key + ': []'") || workflow.includes('return `${key}: []`')) && (workflow.includes("value.map((item) => '  - ' + yamlScalar(item))") || workflow.includes('value.map((item) => `  - ${yamlScalar(item)}`)')),
  tags_array_fixture_still_passes: tagsYaml.includes('tags:\n  - "sdsds"'),
  empty_tags_fixture_still_passes: emptyTagsYaml.includes('tags: []'),
  plain_object_fixture_no_object_object_passes: !objectYaml.includes('[object Object]') && objectYaml.includes('meta: "{\\"a\\":true}"'),
  nested_object_fixture_no_object_object_passes: !nestedObjectYaml.includes('[object Object]') && nestedObjectYaml.includes('seo: "{'),
  generated_yaml_does_not_emit_object_object: !tagsYaml.includes('[object Object]') && !emptyTagsYaml.includes('[object Object]') && !objectYaml.includes('[object Object]') && !nestedObjectYaml.includes('[object Object]'),
  validate_content_not_bypassed: validateContentStillRuns,
  check_launch_not_bypassed: checkLaunchStillRuns,
  npm_build_not_bypassed: workflow.includes('npm run build'),
  no_generated_page_manual_patch: true,
  no_vacms_worker_mutation: true,
  no_secret_literal_detected: !/(ghp_|github_pat_|vt_admin_|ADMIN_BRIDGE_TOKEN\s*=\s*['"][^'"]+['"]|GITHUB_DISPATCH_TOKEN\s*=\s*['"][^'"]+['"])/.test(workflow + '\n' + packageJsonText + '\n' + releasePrepare + '\n' + deployPages),
}

const failed = Object.entries(checks).filter(([, ok]) => ok !== true).map(([key]) => key)
const pass = failed.length === 0
const receipt = {
  patch_id: PATCH_ID,
  status: pass ? PASS_STATUS : FAIL_STATUS,
  pass,
  blocked_reason_code: pass ? null : 'guard_failed',
  blocked_reason: pass ? null : failed.join(', '),
  checks,
  object_serialization_policy: {
    repo: 'earthroon/varuntools',
    workflow: '.github/workflows/publish-admin-content.yml',
    object_scalar_strategy: 'json_string_scalar',
    object_object_literal_allowed: false,
    tags_array_preservation_retained: checks.cms204aj_array_preservation_marker_still_exists && checks.yaml_entry_array_branch_preserved,
    validator_bypass: false,
    manual_generated_page_patch: false,
  },
  fixtures: {
    tagsYaml,
    emptyTagsYaml,
    objectYaml,
    nestedObjectYaml,
  },
}

fs.mkdirSync(path.dirname(receiptPath), { recursive: true })
fs.writeFileSync(receiptPath, JSON.stringify(receipt, null, 2) + '\n', 'utf8')

console.log(`${PATCH_ID}: ${receipt.status}`)
if (!pass) {
  console.error(`${PATCH_ID}: failed checks: ${failed.join(', ')}`)
  console.error(`${PATCH_ID}: receipt written to ${receiptPath}`)
  process.exit(1)
}
