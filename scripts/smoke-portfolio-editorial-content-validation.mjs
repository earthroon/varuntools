#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { validatePortfolioEditorialFiles } from './validate-portfolio-editorial-blocks.mjs'
const root=process.cwd(); const checks=[]; const failures=[]; const OBJECT_LEAK_TOKEN='['+'object Object'+']'
const exists=f=>fs.existsSync(path.join(root,f)); const read=f=>fs.readFileSync(path.join(root,f),'utf8')
function check(n,c){checks.push(n); if(!c) failures.push(n)}
const required=['scripts/validate-portfolio-editorial-blocks.mjs','src/markdown/__fixtures__/portfolio-editorial-invalid-cases.md','src/markdown/__fixtures__/portfolio-editorial-visual-qa.md']
for(const f of required) check(`${f} exists`, exists(f))
const validator=read('scripts/validate-portfolio-editorial-blocks.mjs')
for(const token of ['src/content/pages','src/markdown/__fixtures__','INVALID_EDITORIAL_TITLE_LEVEL','INVALID_EDITORIAL_TITLE_TAG','MISSING_EDITORIAL_TITLE','INVALID_EDITORIAL_COLUMN_COUNT','INVALID_EDITORIAL_COLUMN_GAP','INVALID_EDITORIAL_COLUMN_COLLAPSE','EMPTY_EDITORIAL_COLUMN','COLUMN_COUNT_MISMATCH','OBJECT_OBJECT_LEAK']) check(`validator contains ${token}`, validator.includes(token))
const invalid=read('src/markdown/__fixtures__/portfolio-editorial-invalid-cases.md')
check('invalid fixture contains invalid title level', invalid.includes('level: huge'))
check('invalid fixture contains invalid title tag', invalid.includes('as: div'))
check('invalid fixture contains invalid column count', invalid.includes('cols: 4'))
check('invalid fixture contains invalid gap', invalid.includes('gap: massive'))
check('invalid fixture contains invalid collapse', invalid.includes('collapse: desktop'))
check('invalid fixture contains object leak', invalid.includes(OBJECT_LEAK_TOKEN))
const defaultResult=spawnSync('node',['scripts/validate-portfolio-editorial-blocks.mjs'],{cwd:root,encoding:'utf8'})
check('default validation command exits cleanly', defaultResult.status===0)
if(defaultResult.status!==0){console.error(defaultResult.stdout); console.error(defaultResult.stderr)}
const invalidResult=spawnSync('node',['scripts/validate-portfolio-editorial-blocks.mjs','--expect-invalid','src/markdown/__fixtures__/portfolio-editorial-invalid-cases.md'],{cwd:root,encoding:'utf8'})
check('invalid fixture command exits cleanly in expect-invalid mode', invalidResult.status===0)
check('invalid fixture reports title level error', invalidResult.stdout.includes('INVALID_EDITORIAL_TITLE_LEVEL'))
check('invalid fixture reports column count error', invalidResult.stdout.includes('INVALID_EDITORIAL_COLUMN_COUNT'))
check('invalid fixture reports object leak error', invalidResult.stdout.includes('OBJECT_OBJECT_LEAK'))
const pkg=JSON.parse(read('package.json'))
check('package content validation smoke script exists', pkg.scripts?.['smoke:portfolio-editorial-content-validation']==='node scripts/smoke-portfolio-editorial-content-validation.mjs')
check('check-launch includes content validation smoke', read('scripts/check-launch.mjs').includes('smoke-portfolio-editorial-content-validation.mjs'))
const selected=validatePortfolioEditorialFiles(['src/content/pages/works/index.md','src/content/pages/works/varuntools-showroom/index.md','src/markdown/__fixtures__/portfolio-editorial-visual-qa.md'])
check('selected valid content has no validation errors', selected.ok)
const bundle=['scripts/validate-portfolio-editorial-blocks.mjs','src/markdown/__fixtures__/portfolio-editorial-visual-qa.md','package.json','scripts/check-launch.mjs'].map(read).join('\n')
check('source bundle outside invalid fixture has no object leak', !bundle.includes(OBJECT_LEAK_TOKEN))
if(failures.length){console.error('smoke:portfolio-editorial-content-validation FAILED'); for(const f of failures) console.error(`- ${f}`); process.exit(1)}
console.log(`[smoke:portfolio-editorial-content-validation] OK - ${checks.length} checks`)
