import fs from 'node:fs'

function fail(message) {
  console.error('FAIL_CMS_208E_CALLOUT_BODY_DIRECTIVE_PARSER_ALIGNMENT')
  console.error(message)
  process.exit(1)
}

const directivePlugin = fs.readFileSync('src/markdown/directivePlugin.ts', 'utf8')
const directiveParser = fs.readFileSync('src/markdown/directiveParser.ts', 'utf8')
const calloutDirective = fs.readFileSync('src/markdown/directives/calloutDirective.ts', 'utf8')

const bodyDirectiveMatch = directivePlugin.match(/const BODY_DIRECTIVES = new Set\(\[([\s\S]*?)\]\)/)
const bodyBlock = bodyDirectiveMatch?.[1] || ''

for (const name of ['markdown-box', 'note', 'tip', 'warning']) {
  if (!bodyBlock.includes("'" + name + "'")) {
    fail('BODY_DIRECTIVES missing ' + name)
  }
}

if (!directivePlugin.includes('BODY_DIRECTIVES.has(directiveName)')) {
  fail('directivePlugin does not route body directives through body-aware finder')
}

if (!directivePlugin.includes('findMarkdownBoxEnd')) {
  fail('body-aware directive end finder missing')
}

if (!directiveParser.includes('bodySeparatorIndex')) {
  fail('directiveParser separator split support missing')
}

if (!calloutDirective.includes('escapedBodyToHtml(body)')) {
  fail('calloutDirective does not render directive body')
}

console.log('PASS_CMS_208E_CALLOUT_BODY_DIRECTIVE_PARSER_ALIGNMENT')
