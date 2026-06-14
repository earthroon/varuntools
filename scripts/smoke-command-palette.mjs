#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const failures = []
function read(file) { return fs.readFileSync(path.join(root, file), 'utf8') }
function exists(file) { return fs.existsSync(path.join(root, file)) }
function check(name, condition) { if (!condition) failures.push(name) }

for (const file of [
  'src/components/CommandPalette.vue',
  'src/search/commandPalette.ts',
  'src/search/searchIndex.ts',
  'src/styles/command-palette.css',
  'public/search-index.json',
]) check(`${file} exists`, exists(file))

const component = read('src/components/CommandPalette.vue')
for (const token of [
  'search-index.json',
  'role="dialog"',
  'aria-modal="true"',
  'role="combobox"',
  'role="listbox"',
  'role="option"',
  ':aria-activedescendant',
  'event.key === \'Escape\'',
  'ArrowDown',
  'ArrowUp',
  'router.push',
  'metaKey',
  'ctrlKey',
  '⌘',
  'Ctrl',
]) check(`CommandPalette contains ${token}`, component.includes(token))

const util = read('src/search/commandPalette.ts')
for (const token of [
  'normalizeSearchQuery',
  'searchCommandPaletteEntries',
  'getSearchEntryHaystack',
  'isSearchIndexDocument',
  'SearchIndexEntry',
]) check(`commandPalette util contains ${token}`, util.includes(token))

const app = read('src/App.vue')
check('App imports CommandPalette', app.includes("@/components/CommandPalette.vue"))
check('App renders CommandPalette', app.includes('<CommandPalette />'))

const main = read('src/main.ts')
check('main imports command-palette.css', main.includes("./styles/command-palette.css"))

const css = read('src/styles/command-palette.css')
for (const token of [
  '.vt-command-trigger',
  '.vt-command-palette',
  '.vt-command-palette__backdrop',
  '.vt-command-palette__panel',
  '@media (max-width: 719px)',
  'prefers-reduced-motion: reduce',
]) check(`command palette css contains ${token}`, css.includes(token))

const pkg = JSON.parse(read('package.json'))
check('package has smoke:command-palette', pkg.scripts?.['smoke:command-palette'] === 'node scripts/smoke-command-palette.mjs')
check('check:launch includes smoke:command-palette', read('scripts/check-launch.mjs').includes('smoke:command-palette'))
check('docs mention command palette', read('docs/authoring/search-index.md').includes('Command Palette UI'))

if (failures.length) {
  console.error('smoke:command-palette FAILED')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log('smoke:command-palette OK')
