#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { parseCsv, csvRowsToObjects } from './lib/csv.mjs'
import { csvRowsToMarkdown } from './lib/csv-markdown.mjs'
import { scaffoldEasyPage } from './lib/easy-markdown/scaffold.mjs'

const categories = new Set(['works', 'lab', 'tools', 'products'])
const portfolioPresetTypes = new Set(['case-study', 'tool', 'visual', 'service', 'experiment'])
const templateByCategory = { works: 'work.md', lab: 'lab.md', tools: 'tool.md', products: 'product.md' }
const csvTemplateByCategory = { works: 'work.csv', lab: 'lab.csv', tools: 'tool.csv', products: 'product.csv' }

function usage() {
  return [
    'Usage:',
    '  npm run new:page -- <works|lab|tools|products> <slug> [--csv] [--root <path>]',
    '  npm run new:page -- <section> <slug> --easy [--template <work|page|case-study>]',
    '  npm run new:work:easy -- <slug> --title "Work Title" [--template <work|case-study>]',
    '  npm run new:page -- works <slug> --csv --type <case-study|tool|visual|service|experiment>',
    '  npm run new:page -- works/<slug> --csv --type <case-study|tool|visual|service|experiment>',
    '',
    'Examples:',
    '  npm run new:page -- works project-name',
    '  npm run new:page -- lab experiment-name',
    '  npm run new:page -- tools tool-name',
    '  npm run new:page -- products product-slug',
    '  npm run new:page -- works project-name --csv',
    '  npm run new:page -- works my-case --csv --type case-study',
    '  npm run new:page -- works/my-tool --csv --type tool --title "My Tool"',
  ].join('\n')
}

function parseArgs(argv) {
  const positional = []
  let root = path.join('src', 'content', 'pages')
  let csv = false
  let easy = false
  let type = ''
  let title = ''
  let status = 'draft'
  let featured = 'false'
  let template = ''
  let year = String(new Date().getFullYear())
  let force = false

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--root') {
      if (!argv[i + 1]) throw new Error('new-page ERROR: --root requires a path')
      root = argv[i + 1]
      i += 1
    } else if (arg === '--csv') {
      csv = true
    } else if (arg === '--easy') {
      easy = true
    } else if (arg === '--type') {
      if (!argv[i + 1]) throw new Error('new-page ERROR: --type requires a portfolio preset type')
      type = argv[i + 1]
      i += 1
    } else if (arg === '--title') {
      if (!argv[i + 1]) throw new Error('new-page ERROR: --title requires a title')
      title = argv[i + 1]
      i += 1
    } else if (arg === '--status') {
      if (!argv[i + 1]) throw new Error('new-page ERROR: --status requires draft or published')
      status = argv[i + 1]
      i += 1
    } else if (arg === '--template') {
      if (!argv[i + 1]) throw new Error('new-page ERROR: --template requires work, page, or case-study')
      template = argv[i + 1]
      i += 1
    } else if (arg === '--year') {
      if (!argv[i + 1]) throw new Error('new-page ERROR: --year requires a year')
      year = argv[i + 1]
      i += 1
    } else if (arg === '--featured') {
      if (argv[i + 1] && !argv[i + 1].startsWith('--')) {
        featured = argv[i + 1]
        i += 1
      } else {
        featured = 'true'
      }
    } else if (arg === '--force') {
      force = true
    } else {
      positional.push(arg)
    }
  }

  let category = positional[0]
  let slug = positional[1]
  if (category && !slug && category.includes('/')) {
    const parts = category.split('/').filter(Boolean)
    category = parts[0]
    slug = parts.slice(1).join('-')
  }

  return { category, slug, root, csv, easy, type, title, status, featured, template, year, force }
}

function assertCategory(category) {
  if (!categories.has(category)) throw new Error('new-page ERROR: category must be one of works, lab, tools, products')
}

function assertSlug(slug) {
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error('new-page ERROR: slug must be lowercase kebab-case using a-z, 0-9, and hyphen')
  }
}

function assertPresetType(type) {
  if (type && !portfolioPresetTypes.has(type)) {
    throw new Error('new-page ERROR: --type must be one of case-study, tool, visual, service, experiment')
  }
}

function assertStatus(status) {
  if (!['draft', 'published', 'archived', 'private'].includes(status)) {
    throw new Error('new-page ERROR: --status must be one of draft, published, archived, private')
  }
}

function assertFeatured(featured) {
  if (!['true', 'false'].includes(String(featured))) {
    throw new Error('new-page ERROR: --featured must be true or false')
  }
}

function titleFromSlug(slug) {
  return slug.split('-').filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}

function fillTemplate(template, title, slug, category, options = {}) {
  const slugByCategory = {
    works: `works/${slug}`,
    lab: `lab/${slug}`,
    tools: `tools/${slug}`,
    products: `products/${slug}`,
  }
  return template
    .replaceAll('Project Title', title)
    .replaceAll('Experiment Title', title)
    .replaceAll('Tool Title', title)
    .replaceAll('Product Title', title)
    .replaceAll('__SLUG__', slugByCategory[category] || slug)
    .replaceAll('__RAW_SLUG__', slug)
    .replaceAll('__CATEGORY__', category)
    .replaceAll('__TITLE__', title)
    .replaceAll('__STATUS__', options.status || 'draft')
    .replaceAll('__FEATURED__', String(options.featured ?? 'false'))
    .replaceAll('__TYPE__', options.type || '')
}



function writeFileOnce(filePath, contents) {
  if (fs.existsSync(filePath)) throw new Error(`new-page ERROR: ${filePath} already exists`)
  fs.writeFileSync(filePath, contents, 'utf8')
}

function writeFileIfMissing(filePath, contents) {
  if (fs.existsSync(filePath)) return false
  fs.writeFileSync(filePath, contents, 'utf8')
  return true
}

function scaffoldCsvTemplateAssets(pageDir, rows) {
  const seen = new Set()
  const assetFields = ['src', 'thumb']
  for (const row of rows) {
    for (const field of assetFields) {
      const value = String(row[field] ?? '').trim()
      if (!value || value.startsWith('/') || /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value)) continue
      const target = path.resolve(pageDir, value)
      if (!target.startsWith(pageDir + path.sep)) continue
      if (seen.has(target)) continue
      seen.add(target)
      fs.mkdirSync(path.dirname(target), { recursive: true })
      if (!fs.existsSync(target)) fs.writeFileSync(target, placeholderAssetContent(target))
    }
  }
}

function placeholderAssetContent(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.svg') return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect width="16" height="16" fill="#ddd"/></svg>\n'
  if (ext === '.webm' || ext === '.mp4' || ext === '.mov') return ''
  return 'placeholder asset for CSV scaffold\n'
}


try {
  const { category, slug, root, csv, easy, type, title: explicitTitle, status, featured, template: easyTemplate, year, force } = parseArgs(process.argv.slice(2))
  if (!category || !slug) {
    console.error(usage())
    process.exit(2)
  }

  const repoRoot = process.cwd()

  if (easy) {
    const title = explicitTitle || titleFromSlug(slug)
    const result = scaffoldEasyPage({
      rootDir: repoRoot,
      contentRoot: root,
      section: category,
      slug,
      title,
      template: easyTemplate || (category === 'works' ? 'work' : 'page'),
      status,
      year,
      type: type || 'system',
      featured: String(featured) === 'true',
      force,
    })

    console.log(`[new-page] created ${result.pageDir}`)
    console.log(`[new-page] source ${result.sourcePath}`)
    console.log(`[new-page] generated ${result.outputPath}`)
    console.log('[new-page] next: npm run easy:check && npm run build')
    process.exit(0)
  }

  assertCategory(category)
  assertSlug(slug)
  assertPresetType(type)
  assertStatus(status)
  assertFeatured(featured)

  const templatePath = path.join(repoRoot, 'src', 'content', 'templates', templateByCategory[category])
  const csvTemplatePath = type
    ? path.join(repoRoot, 'src', 'content', 'templates', 'portfolio-presets', `${type}.csv`)
    : path.join(repoRoot, 'src', 'content', 'templates', csvTemplateByCategory[category])
  if (!fs.existsSync(templatePath)) throw new Error(`new-page ERROR: template not found: ${templatePath}`)
  if (csv && !fs.existsSync(csvTemplatePath)) throw new Error(`new-page ERROR: CSV template not found: ${csvTemplatePath}`)

  const pageDir = path.resolve(repoRoot, root, category, slug)
  const csvPath = path.join(pageDir, 'page.csv')
  if (fs.existsSync(pageDir) && !force) throw new Error(`new-page ERROR: ${path.relative(repoRoot, pageDir)} already exists`)
  if (csv && fs.existsSync(csvPath)) throw new Error(`new-page ERROR: existing page.csv will not be overwritten: ${path.relative(repoRoot, csvPath)}`)

  const title = explicitTitle || titleFromSlug(slug)
  const templateOptions = { status, featured, type }
  const template = fillTemplate(fs.readFileSync(templatePath, 'utf8'), title, slug, category, templateOptions)
  const csvTemplate = csv ? fillTemplate(fs.readFileSync(csvTemplatePath, 'utf8'), title, slug, category, templateOptions) : ''

  fs.mkdirSync(path.join(pageDir, 'images'), { recursive: true })
  fs.mkdirSync(path.join(pageDir, 'videos'), { recursive: true })

  if (csv) {
    writeFileOnce(csvPath, csvTemplate)
    const rows = csvRowsToObjects(parseCsv(csvTemplate))
    scaffoldCsvTemplateAssets(pageDir, rows)
    const generated = csvRowsToMarkdown(rows, {
      sourceCsvPath: path.relative(repoRoot, csvPath).replace(/\\/g, '/'),
      outputMarkdownPath: path.relative(repoRoot, path.join(pageDir, 'index.md')).replace(/\\/g, '/'),
    })
    if (generated.errors.length) {
      throw new Error(`new-page ERROR: CSV template failed to generate markdown: ${generated.errors.join('; ')}`)
    }
    writeFileOnce(path.join(pageDir, 'index.md'), generated.markdown)
  } else {
    writeFileOnce(path.join(pageDir, 'index.md'), template)
  }
  writeFileIfMissing(path.join(pageDir, 'images', '.gitkeep'), '')
  writeFileIfMissing(path.join(pageDir, 'videos', '.gitkeep'), '')
  writeFileIfMissing(path.join(pageDir, 'README.md'), `# ${title}\n\n## Purpose\n\n이 페이지의 목적을 적습니다.\n\n## Assets\n\n- \`images/\`: 페이지 전용 이미지\n- \`videos/\`: 페이지 전용 영상\n\n## Checklist\n\n- [ ] \`title\` 작성\n- [ ] \`description\` 작성\n- [ ] \`thumbnail\` 경로 확인\n- [ ] 대표 이미지 추가\n- [ ] asset audit 통과\n- [ ] SEO audit 통과\n`)

  console.log(`[new-page] created ${path.relative(repoRoot, pageDir)}`)
  if (csv && type) {
    console.log(`[new-page] preset ${type} generated as draft CSV. Next: npm run csv:pages`)
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
