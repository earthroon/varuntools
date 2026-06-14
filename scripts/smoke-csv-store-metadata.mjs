#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { parseCsv, csvRowsToObjects } from './lib/csv.mjs'
import { csvRowsToMarkdown } from './lib/csv-markdown.mjs'

const root = process.cwd()
const failures = []
const checks = []
function check(name, condition) { checks.push(name); if (!condition) failures.push(name) }
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8') }
function exists(file) { return fs.existsSync(path.join(root, file)) }
function convert(csv) { return csvRowsToMarkdown(csvRowsToObjects(parseCsv(csv)), { sourceCsvPath: 'tmp/csv-store-metadata-smoke/page.csv', outputMarkdownPath: 'tmp/csv-store-metadata-smoke/index.md' }) }

for (const file of ['scripts/lib/csv-markdown.mjs','scripts/validate-content.mjs','src/types/content.ts','src/content/templates/product.csv','src/content/templates/product.md','src/content/pages/products/dummy-catalog/page.csv','src/content/pages/products/dummy-catalog/index.md','docs/authoring/csv-authoring.md','docs/authoring/store-authoring.md','docs/migration/commit-54.md','BAKE_REPORT_COMMIT_54.md']) check(`${file} exists`, exists(file))
const pkg = JSON.parse(read('package.json'))
check('package has smoke:csv-store-metadata', pkg.scripts?.['smoke:csv-store-metadata'] === 'node scripts/smoke-csv-store-metadata.mjs')
check('check-launch includes smoke:csv-store-metadata', read('scripts/check-launch.mjs').includes('smoke-csv-store-metadata.mjs'))
const csvLib = read('scripts/lib/csv-markdown.mjs')
for (const token of ['PRODUCT_OPTION_STRING_FIELDS','category','subcategory','shippingNote','refundNote','digitalDeliveryNote','policyNote','inquiryUrl','externalUrl']) check(`csv markdown keeps ${token}`, csvLib.includes(token))
const productTemplateCsv = read('src/content/templates/product.csv')
for (const token of ['product-cta','product-trust','license=','series=','collection=','material=','size=','releaseDate=','shippingNote=','refundNote=','digitalDeliveryNote=','policyNote=','inquiryUrl=','externalUrl=']) check(`product.csv template contains ${token}`, productTemplateCsv.includes(token))
const productTemplateMd = read('src/content/templates/product.md')
for (const token of ['license: ""','material: ""','size: ""','policyNote: ""','inquiryUrl: ""','::product-cta','::product-trust']) check(`product.md template contains ${token}`, productTemplateMd.includes(token))

const physical = convert(`block,title,body,src,alt,caption,thumb,layout,kind,options,meta
page,Physical Sample,Physical sample.,./images/cover.webp,,,./images/thumbnail.webp,,,slug=products/physical-sample; kind=product; status=active; visibility=public; tags=product|physical; order=10; featured=false; series=DreamColor; collection=stickers; releaseDate=2026-06-01,
product,Physical Sample,Physical product.,./images/cover.webp,,,./images/thumbnail.webp,,,type=physical; sku=VT-PHYSICAL-001; price=12000; currency=KRW; priceVisible=true; status=available; stock=unknown; checkoutProvider=toss-payments; checkoutUrl=https://example.com/pay; shippingRequired=true; showWhenUnavailable=true; material=paper; size=70x70mm; shippingNote=배송 안내 샘플; refundNote=환불 안내 샘플,
heading,Physical Sample,,,,,,,h1,,
product-cta,,,,,,,,,,
product-trust,,,,,,,,,,
`)
check('physical conversion succeeds', physical.errors.length === 0)
for (const token of ['material: paper','size: 70x70mm','shippingNote: "배송 안내 샘플"','refundNote: "환불 안내 샘플"','::product-cta','::product-trust']) check(`physical markdown contains ${token}`, physical.markdown.includes(token))
const digital = convert(`block,title,body,src,alt,caption,thumb,layout,kind,options,meta
page,Digital Sample,Digital sample.,./images/cover.webp,,,./images/thumbnail.webp,,,slug=products/digital-sample; kind=product; status=active; visibility=public; tags=product|digital; order=20; featured=false; series=DreamColor; collection=presets; releaseDate=2026-06-01,
product,Digital Sample,Digital product.,./images/cover.webp,,,./images/thumbnail.webp,,,type=digital; sku=VT-DIGITAL-001; price=9000; currency=KRW; priceVisible=true; status=coming-soon; checkoutProvider=toss-payments; checkoutUrl=; downloadProvider=cloudflare; downloadUrl=; shippingRequired=false; showWhenUnavailable=true; license=personal; digitalDeliveryNote=구매 후 다운로드 제공 방식은 출시 전 확정됩니다.,
heading,Digital Sample,,,,,,,h1,,
product-cta,,,,,,,,,,
product-trust,,,,,,,,,,
`)
check('digital conversion succeeds without available download warning', digital.errors.length === 0 && !digital.warnings.some((item) => item.includes('downloadUrl')))
for (const token of ['type: digital','downloadProvider: cloudflare','license: personal','digitalDeliveryNote: "구매 후 다운로드 제공 방식은 출시 전 확정됩니다."']) check(`digital markdown contains ${token}`, digital.markdown.includes(token))
const service = convert(`block,title,body,src,alt,caption,thumb,layout,kind,options,meta
page,Service Sample,Service sample.,./images/cover.webp,,,./images/thumbnail.webp,,,slug=products/service-sample; kind=product; status=active; visibility=public; tags=product|service; order=30; featured=false; collection=services,
product,Service Sample,Service product.,./images/cover.webp,,,./images/thumbnail.webp,,,type=service; sku=VT-SERVICE-001; price=; currency=KRW; priceVisible=false; status=available; checkoutProvider=manual; checkoutUrl=; externalStoreUrl=; inquiryUrl=https://example.com/contact; shippingRequired=false; showWhenUnavailable=true; policyNote=상담형 서비스는 문의 후 범위와 견적을 확정합니다.,
heading,Service Sample,,,,,,,h1,,
product-cta,,,,,,,,,,
product-trust,,,,,,,,,,
`)
check('service conversion succeeds without checkout warning', service.errors.length === 0 && !service.warnings.some((item) => item.includes('checkoutUrl') || item.includes('inquiry service')))
for (const token of ['type: service','price: ""','priceVisible: false','inquiryUrl: https://example.com/contact','policyNote: "상담형 서비스는 문의 후 범위와 견적을 확정합니다."']) check(`service markdown contains ${token}`, service.markdown.includes(token))
const dummyCsv = read('src/content/pages/products/dummy-catalog/page.csv')
const dummyIndex = read('src/content/pages/products/dummy-catalog/index.md')
for (const token of ['VT-DUMMY-EDIT-ME','category=templates','subcategory=workflow','collection=varun-tools','series=store-starter','policyNote=','shippingNote=','refundNote=','더미 카탈로그 상품']) check(`dummy catalog page.csv contains ${token}`, dummyCsv.includes(token))
for (const token of ['GENERATED FROM src/content/pages/products/dummy-catalog/page.csv','slug: products/dummy-catalog','status: coming-soon','category: templates','subcategory: workflow','collection: varun-tools','series: store-starter','policyNote:','::product-cta','::product-trust']) check(`dummy catalog index contains ${token}`, dummyIndex.includes(token))
const generatedInputs = [csvLib, productTemplateCsv, productTemplateMd, dummyCsv].join('\n')
check('status=published is not present in generated inputs', !generatedInputs.includes('status=published'))
const validate = spawnSync('node', ['scripts/validate-content.mjs'], { cwd: root, encoding: 'utf8', shell: process.platform === 'win32' })
check('validate-content succeeds with dummy catalog', validate.status === 0)
if (validate.status !== 0) { process.stdout.write(validate.stdout || ''); process.stderr.write(validate.stderr || '') }
if (failures.length) { console.error('[smoke:csv-store-metadata] FAILED'); for (const failure of failures) console.error(`- ${failure}`); process.exit(1) }
console.log(`[smoke:csv-store-metadata] OK ${checks.length} checks`)
