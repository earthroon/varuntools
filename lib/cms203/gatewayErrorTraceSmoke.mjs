import fs from 'node:fs'

const gateway = fs.readFileSync('scripts/sheet-cms/lib/appscript-gateway-client.mjs', 'utf8')
const checks = [
  ['gateway failure logs status', gateway.includes('status: response.status')],
  ['gateway failure logs dataKeys', gateway.includes('dataKeys: gatewayDataKeys(data)')],
  ['gateway failure logs bodyPreview', gateway.includes('bodyPreview')],
  ['shared secret is redacted', gateway.includes('[REDACTED_SECRET]')],
  ['long payload is redacted', gateway.includes('[REDACTED_LONG_PAYLOAD]')],
  ['HTTP 200 app-level failure no longer collapses to bare HTTP 200', gateway.includes('gatewayFailureMessage(data, response.status)')],
]
let failed = false
for (const [label, ok] of checks) {
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${label}`)
  if (!ok) failed = true
}
if (failed) process.exit(1)
console.log('CMS203_GATEWAY_ERROR_TRACE_PASS')
