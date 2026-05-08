#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { parseCsv, csvRowsToObjects } from './lib/csv.mjs'
import { CSV_BLOCK_SCHEMAS, validateCsvRows } from './lib/csv-block-schema.mjs'
import { csvRowsToMarkdown } from './lib/csv-markdown.mjs'

const root = process.cwd()
const checks = []
const failures = []
function check(name, condition) { checks.push(name); if (!condition) failures.push(name) }
function rowsFromCsv(csv) { return csvRowsToObjects(parseCsv(csv), { sourcePath: 'portfolio-inline.csv' }) }
function hasDiagnostic(diagnostics, code, level) { return diagnostics.some((item) => item.code === code && (!level || item.level === level)) }

const portfolioBlocks = [
  'portfolio-hero',
  'work-summary',
  'role-stack',
  'problem',
  'solution',
  'process',
  'decision',
  'result',
  'metric',
  'tool-stack',
  'quote',
  'case-gallery-start',
  'case-gallery-item',
  'case-gallery-end',
  'related-works',
]

for (const block of portfolioBlocks) {
  check(`CSV_BLOCK_SCHEMAS includes ${block}`, Boolean(CSV_BLOCK_SCHEMAS[block]))
}

function csvCell(value = '') {
  const text = String(value ?? '')
  if (!/[",\n]/.test(text)) return text
  return `"${text.replaceAll('"', '""')}"`
}

function csvRow(cells) {
  if (cells.length !== 11) throw new Error(`Expected 11 CSV cells, received ${cells.length}`)
  return cells.map(csvCell).join(',')
}

const csvRows = [
  ['block', 'title', 'body', 'src', 'alt', 'caption', 'thumb', 'layout', 'kind', 'options', 'meta'],
  ['page', 'Portfolio Case', 'Case description', './cover.webp', 'Cover', 'Caption', './thumb.webp', '', '', 'slug=works/portfolio-case; kind=work; status=active; visibility=public', ''],
  ['portfolio-hero', 'VarunTools Store', '보안과 콘텐츠 발행이 분리된 포트폴리오형 스토어', './cover.webp', 'Cover', '대표 이미지', './thumb.webp', 'split', 'case-study', 'role=[Design Engineer, Frontend]; stack=[Vue, TypeScript, Cloudflare Workers]; year=2026; featured=true', ''],
  ['work-summary', '작업 개요', '관리자와 소비자 페이지를 분리하고 운영 경계를 봉인했다.', '', '', '', '', '', '', 'period=2026; client=internal; role=[UX/UI, Frontend]', ''],
  ['role-stack', '역할과 스택', '', '', '', '', '', '', '', 'role=[Product Design, Frontend Architecture]; stack=[Vue, TypeScript]; tools=[D1, R2]', ''],
  ['problem', '문제', '정적 포트폴리오에 결제와 다운로드 흐름을 붙이면 경계가 쉽게 섞인다.', '', '', '', '', '', '', 'severity=high', ''],
  ['solution', '해결', '관리자 API와 배송 Worker를 분리하고 각 경계에 검증 장치를 둔다.', '', '', '', '', '', '', 'strategy=separate-boundaries', ''],
  ['process', '과정', 'Access JWT 검증에서 감사 장부까지 커밋 단위로 닫았다.', '', '', '', '', '', '', 'phase=hardening', ''],
  ['decision', '판단', '다운로드 권한은 D1 조건부 UPDATE 성공 여부로 확정했다.', '', '', '', '', '', 'ssot', 'weight=high; risk=abuse; ssot=purchase_grants', ''],
  ['result', '결과', '운영 전 핵심 경계가 봉인되었다.', '', '', '', '', '', '', 'status=sealed', ''],
  ['metric', '보안 커밋', '운영 전 핵심 경계 봉인 수', '', '', '', '', '', 'security', 'value=6; unit=commits; tone=strong', ''],
  ['tool-stack', '기술 스택', '', '', '', '', '', '', '', 'stack=[Vue, TypeScript, Cloudflare Workers]; storage=[D1, R2]', ''],
  ['quote', '권한 원칙', '다운로드 가능해 보이는 것이 아니라; D1 row가 실제로 소비되어야 권한이 확정된다 | 이것이 SSOT다.', '', '', '', '', '', '', 'by=VarunTools Store', ''],
  ['case-gallery-start', '주요 화면', '', '', '', '', '', '', '', 'columns=2; variant=grid', ''],
  ['case-gallery-item', '', '관리자 감사 장부 화면', './audit-log.webp', 'Audit log', '관리자 dry-run 기록', '', '', '', 'label=audit', ''],
  ['case-gallery-item', '', 'CSV 진단 화면', './csv-diagnostics.webp', 'CSV diagnostics', 'CSV 오류 진단', '', '', '', 'label=csv', ''],
  ['case-gallery-end', '', '', '', '', '', '', '', '', '', ''],
  ['related-works', '관련 작업', '', '', '', '', '', '', '', 'items=[csv-authoring, varuntools-store]', ''],
]
const csv = csvRows.map(csvRow).join('\n') + '\n' 

const rows = rowsFromCsv(csv)
const diagnostics = validateCsvRows(rows, { strict: true })
check('portfolio sample strict validation has no errors', !diagnostics.some((item) => item.level === 'error'))

const rendered = csvRowsToMarkdown(rows, { sourceCsvPath: 'portfolio-inline.csv', strict: true })
const markdown = rendered.markdown
check('portfolio-hero renders as dedicated directive', markdown.includes('::portfolio-hero') && markdown.includes('title: VarunTools Store') && markdown.includes('role-json:'))
check('work-summary renders as dedicated directive', markdown.includes('::work-summary') && markdown.includes('title: 작업 개요') && markdown.includes('client: internal'))
check('problem renders as case-section', markdown.includes('::case-section') && markdown.includes('type: problem') && markdown.includes('title: 문제'))
check('decision renders as case-section', markdown.includes('type: decision') && markdown.includes('ssot: purchase_grants'))
check('metric renders as metric-card', markdown.includes('::metric-card') && markdown.includes('value: 6') && markdown.includes('unit: commits'))
check('tool-stack renders as dedicated directive', markdown.includes('::tool-stack') && markdown.includes('Cloudflare Workers') && markdown.includes('storage-json'))
check('quote preserves semicolon and pipe', markdown.includes('다운로드 가능해 보이는 것이 아니라;') && markdown.includes('확정된다 | 이것이 SSOT다'))
check('case-gallery renders through dedicated directive', markdown.includes('::case-gallery') && markdown.includes('./audit-log.webp'))
check('related-works renders as dedicated directive', markdown.includes('::related-works') && markdown.includes('items-json'))
check('generated markdown avoids object string leaks', !markdown.includes('[object Object]'))

const outsideCaseGallery = validateCsvRows(rowsFromCsv(`block,title,body,src,alt,caption,thumb,layout,kind,options,meta
page,Case,Description,./cover.webp,Cover,Caption,./thumb.webp,,,slug=case; kind=work; status=active,
case-gallery-item,,Outside,./a.webp,A,Caption,,,,,
`))
check('case-gallery-item outside group errors', hasDiagnostic(outsideCaseGallery, 'CSV_CASE_GALLERY_ITEM_OUTSIDE_GROUP', 'error'))

const unclosedCaseGallery = validateCsvRows(rowsFromCsv(`block,title,body,src,alt,caption,thumb,layout,kind,options,meta
page,Case,Description,./cover.webp,Cover,Caption,./thumb.webp,,,slug=case; kind=work; status=active,
case-gallery-start,Gallery,,,,,,,,,
case-gallery-item,,Inside,./a.webp,A,Caption,,,,,
`))
check('case-gallery-start without end errors', hasDiagnostic(unclosedCaseGallery, 'CSV_CASE_GALLERY_UNCLOSED', 'error'))

const relatedMissing = validateCsvRows(rowsFromCsv(`block,title,body,src,alt,caption,thumb,layout,kind,options,meta
page,Case,Description,./cover.webp,Cover,Caption,./thumb.webp,,,slug=case; kind=work; status=active,
related-works,Related,,,,,,,,,
`))
check('related-works requires body or items', hasDiagnostic(relatedMissing, 'CSV_REQUIRES_ONE_OF_MISSING', 'error'))

const tmpDir = path.join(root, 'tmp', 'csv-portfolio-blocks-smoke')
fs.rmSync(tmpDir, { recursive: true, force: true })
fs.mkdirSync(tmpDir, { recursive: true })
for (const filename of ['cover.webp', 'thumb.webp', 'audit-log.webp', 'csv-diagnostics.webp']) {
  fs.writeFileSync(path.join(tmpDir, filename), 'fake-webp')
}
const csvPath = path.join(tmpDir, 'page.csv')
fs.writeFileSync(csvPath, csv, 'utf8')
const cli = spawnSync('node', ['scripts/csv-to-markdown.mjs', path.relative(root, csvPath), '--dry-run', '--strict'], { cwd: root, encoding: 'utf8' })
check('CLI strict accepts portfolio blocks', cli.status === 0 && cli.stdout.includes('VarunTools Store'))
fs.rmSync(path.join(root, 'tmp'), { recursive: true, force: true })

if (failures.length) {
  console.error('smoke:csv-portfolio-blocks FAILED')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log(`smoke:csv-portfolio-blocks OK — ${checks.length} checks`)
