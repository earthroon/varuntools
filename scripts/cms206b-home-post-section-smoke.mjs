#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const home = fs.readFileSync(path.join(root, 'src/content/pages/home/index.md'), 'utf8')
if (!/^source:\s*post\s*$/m.test(home)) throw new Error('home post section source: post missing')
console.log('CMS206B_HOME_POST_SECTION_PASS')
