#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
const root = process.cwd()
const required = [
  'workers/delivery/src/db.ts',
  'workers/delivery/src/grants.ts',
  'workers/delivery/migrations/0001_purchase_grants.sql',
]
const errors=[]
for (const rel of required) if (!existsSync(path.join(root, rel))) errors.push(`missing ${rel}`)
const migration = readFileSync(path.join(root,'workers/delivery/migrations/0001_purchase_grants.sql'),'utf8')
for (const token of ['purchase_orders','purchase_grants','webhook_events']) if (!migration.includes(token)) errors.push(`migration missing ${token}`)
const wrangler = readFileSync(path.join(root,'workers/delivery/wrangler.toml'),'utf8')
if (!wrangler.includes('PURCHASE_DB')) errors.push('wrangler.toml missing PURCHASE_DB binding')
const grants = readFileSync(path.join(root,'workers/delivery/src/grants.ts'),'utf8')
if (!grants.includes('fail-closed') && !grants.includes('not configured')) errors.push('grants.ts must document fail-closed behavior')
if (errors.length) { for (const e of errors) console.error(`ERROR ${e}`); process.exit(1) }
console.log('[smoke:purchase-grant] OK purchase grant contract is wired')
