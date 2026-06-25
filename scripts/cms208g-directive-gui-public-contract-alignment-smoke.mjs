import fs from 'node:fs'

function fail(message) {
  console.error('FAIL_CMS_208G_DIRECTIVE_GUI_PUBLIC_CONTRACT_ALIGNMENT')
  console.error(message)
  process.exit(1)
}

const directivePlugin = fs.readFileSync('src/markdown/directivePlugin.ts', 'utf8')
const workCard = fs.readFileSync('src/markdown/directives/workCardDirective.ts', 'utf8')
const pagecardGrid = fs.readFileSync('src/markdown/directives/pagecardGridDirective.ts', 'utf8')
const portfolio = fs.readFileSync('src/markdown/directives/portfolioDirective.ts', 'utf8')

if (!directivePlugin.includes("'pagecard-grid'")) fail('pagecard-grid is not body-aware')
if (!workCard.includes('legacyId')) fail('work-card legacy id alias is missing')
if (!workCard.includes('attrs.slug = normalizedSlug')) fail('work-card id to slug normalization is missing')
if (!workCard.includes('attrs.description = attrs.summary')) fail('work-card summary to description mapping is missing')
if (!pagecardGrid.includes('parseLegacyPipeItem')) fail('pagecard-grid legacy pipe parser is missing')
if (!pagecardGrid.includes("'/page/' + cleanId")) fail('pagecard-grid id href fallback is missing')
if (!portfolio.includes('const canonical = normalized')) fail('editorial-columns canonical split is missing')
if (!portfolio.includes('const legacy: string[] = []')) fail('editorial-columns legacy heading split is missing')

console.log('PASS_CMS_208G_DIRECTIVE_GUI_PUBLIC_CONTRACT_ALIGNMENT')
