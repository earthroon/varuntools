#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { readJson, writeJson } from './lib/write-json.mjs'

const root = process.cwd()
const tmpRoot = path.join(root, '.tmp', 'sheet-cms-validate-smoke')
const generatedDir = path.join(tmpRoot, 'generated')

async function writeValidGenerated() {
  await fs.rm(tmpRoot, { recursive: true, force: true })
  await fs.mkdir(generatedDir, { recursive: true })
  const generatedAt = new Date().toISOString()
  await writeJson(path.join(generatedDir, 'assets.generated.json'), {
    generatedAt,
    source: 'sheet-cms-staging-console',
    schemaVersion: '1.0.0',
    assets: [
      { assetId: 'cover_001', src: '/assets/generated/cover_001.webp', alt: '커버 이미지', type: 'image', role: 'cover' },
      { assetId: 'before_001', src: '/assets/generated/before_001.jpg', alt: '작업 전 이미지', type: 'image', role: 'before' },
      { assetId: 'after_001', src: '/assets/generated/after_001.jpg', alt: '작업 후 이미지', type: 'image', role: 'after' },
    ],
  })
  await writeJson(path.join(generatedDir, 'settings.generated.json'), {
    generatedAt,
    source: 'sheet-cms-staging-console',
    schemaVersion: '1.0.0',
    settings: { siteName: 'VARUNTOOLS', commissionOpen: true },
  })
  await writeJson(path.join(generatedDir, 'pages.generated.json'), {
    generatedAt,
    source: 'sheet-cms-staging-console',
    schemaVersion: '1.0.0',
    pages: [
      {
        id: 'commission-design',
        slug: 'commission/design',
        type: 'commission',
        title: '디자인 커미션',
        desc: '작업 의뢰 안내 페이지',
        template: 'commission',
        tags: ['design', 'commission'],
        featured: true,
        order: 10,
        cover: { assetId: 'cover_001', src: '/assets/generated/cover_001.webp', alt: '커버 이미지', type: 'image', role: 'cover' },
        blocks: [
          { id: 'text-01', kind: 'text', order: 10, title: '개요', body: '본문입니다.' },
          { id: 'callout-01', kind: 'callout', order: 20, type: 'warning', tone: 'warning', title: '주의', body: '확인하세요.', collapsible: true, defaultOpen: true },
          { id: 'compare-01', kind: 'compare', order: 30, title: '전후', before: { assetId: 'before_001', src: '/assets/generated/before_001.jpg', alt: '작업 전 이미지', type: 'image', role: 'before' }, after: { assetId: 'after_001', src: '/assets/generated/after_001.jpg', alt: '작업 후 이미지', type: 'image', role: 'after' }, initial: 50, caption: '전후 비교', labels: true },
          { id: 'cta-01', kind: 'cta', order: 90, title: '문의', body: '문의하세요.', buttonLabel: '문의하기', buttonUrl: '/contact', variant: 'primary' },
          { id: 'faq-01', kind: 'faq', order: 100, question: '얼마나 걸리나요?', answer: '작업 범위에 따라 다릅니다.' },
        ],
      },
    ],
  })
  await writeJson(path.join(generatedDir, 'manifest.generated.json'), {
    generatedAt,
    source: 'sheet-cms-staging-console',
    schemaVersion: '1.0.0',
    includedPages: 1,
    includedBlocks: 5,
    includedAssets: 3,
    warnings: [],
    errors: [],
  })
}

function runValidate(expectSuccess) {
  const result = spawnSync(process.execPath, ['scripts/sheet-cms/validate-generated-content.mjs', '--dir', generatedDir], {
    cwd: root,
    stdio: 'inherit',
  })
  if (expectSuccess && result.status !== 0) throw new Error(`validate should pass but exited with ${result.status}`)
  if (!expectSuccess && result.status === 0) throw new Error('validate should fail but exited with 0')
}

async function assertReport(status) {
  const report = await readJson(path.join(generatedDir, 'validation.generated.json'))
  if (report.status !== status) throw new Error(`expected report status ${status}, got ${report.status}`)
}

async function injectLeak() {
  const pagesPath = path.join(generatedDir, 'pages.generated.json')
  const pages = await readJson(pagesPath)
  pages.pages[0].memo = '이 값은 public JSON에 있으면 안 됩니다.'
  await writeJson(pagesPath, pages)
}

async function main() {
  await writeValidGenerated()
  runValidate(true)
  await assertReport('success')
  await injectLeak()
  runValidate(false)
  await assertReport('failed')
  console.log('[smoke:validate-generated-content] success')
}

main().catch((error) => {
  console.error(`[smoke:validate-generated-content] failed: ${error.message}`)
  process.exit(1)
})
