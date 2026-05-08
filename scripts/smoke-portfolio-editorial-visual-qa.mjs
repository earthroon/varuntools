#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
const root=process.cwd(); const checks=[]; const failures=[]; const OBJECT_LEAK_TOKEN='['+'object Object'+']'
const exists=f=>fs.existsSync(path.join(root,f)); const read=f=>fs.readFileSync(path.join(root,f),'utf8')
function check(n,c){checks.push(n); if(!c) failures.push(n)}
const files=['src/markdown/__fixtures__/portfolio-editorial-visual-qa.md','docs/authoring/portfolio-editorial-visual-qa.md','docs/migration/commit-124.md','BAKE_REPORT_COMMIT_124.md','scripts/smoke-portfolio-editorial-visual-qa.mjs']
for(const f of files) check(`${f} exists`, exists(f))
const fixture=read('src/markdown/__fixtures__/portfolio-editorial-visual-qa.md')
const docs=read('docs/authoring/portfolio-editorial-visual-qa.md')
const migration=read('docs/migration/commit-124.md')
const report=read('BAKE_REPORT_COMMIT_124.md')
const pkg=JSON.parse(read('package.json'))
const launch=read('scripts/check-launch.mjs')
check('visual fixture contains existing markdown heading', fixture.includes('# 기존 마크다운 제목은 유지된다'))
check('visual fixture contains editorial-title', fixture.includes('::editorial-title'))
check('visual fixture contains editorial-columns', fixture.includes('::editorial-columns'))
check('visual fixture contains major case', fixture.includes('level: major'))
check('visual fixture contains middle case', fixture.includes('level: middle'))
check('visual fixture contains minor case', fixture.includes('level: minor'))
check('visual fixture contains 2-column case', fixture.includes('cols: 2'))
check('visual fixture contains 3-column case', fixture.includes('cols: 3'))
check('visual fixture contains mobile collapse case', fixture.includes('collapse: mobile'))
check('visual fixture contains tablet collapse case', fixture.includes('collapse: tablet'))
check('visual fixture contains long URL token', fixture.includes('https://varun.tools/portfolio/editorial-visual-qa-long-token-example'))
check('visual fixture explains Markdown flow remains', fixture.includes('editorial block은 기존 heading을 대체하지 않는다'))
for(const token of ['Desktop','Tablet','Mobile','Accessibility','Long title','Column overflow','No external visual regression service']) check(`visual QA doc includes ${token}`, docs.includes(token))
check('migration doc states no parser rewrite', migration.includes('No editorial parser rewrite'))
check('migration doc states no inquiry changes', migration.includes('No inquiry system changes'))
check('migration doc mentions content validation', migration.includes('content validation'))
check('bake report seals visual QA validation', report.includes('visual QA와 content validation 강화 커밋'))
check('bake report lists visual QA smoke', report.includes('smoke:portfolio-editorial-visual-qa'))
check('bake report lists content validation smoke', report.includes('smoke:portfolio-editorial-content-validation'))
check('package visual QA smoke script exists', pkg.scripts?.['smoke:portfolio-editorial-visual-qa']==='node scripts/smoke-portfolio-editorial-visual-qa.mjs')
check('check-launch includes visual QA smoke', launch.includes('smoke-portfolio-editorial-visual-qa.mjs'))
const sourceBundle=files.concat(['package.json','scripts/check-launch.mjs']).map(read).join('\n')
check('source contains no object leak', !sourceBundle.includes(OBJECT_LEAK_TOKEN))
if(failures.length){console.error('smoke:portfolio-editorial-visual-qa FAILED'); for(const f of failures) console.error(`- ${f}`); process.exit(1)}
console.log(`[smoke:portfolio-editorial-visual-qa] OK - ${checks.length} checks`)
