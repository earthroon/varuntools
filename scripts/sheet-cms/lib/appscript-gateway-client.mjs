function filled(value) {
  return String(value ?? '').trim().length > 0
}

function redactUrl(value) {
  const text = String(value ?? '')
  if (!text) return 'missing'
  try {
    const url = new URL(text)
    return `${url.origin}${url.pathname ? '/...' : ''}`
  } catch {
    return text.length > 12 ? `${text.slice(0, 6)}...${text.slice(-4)}` : '***'
  }
}

export function getGatewayConfig(env = process.env) {
  const webAppUrl = env.APPS_SCRIPT_WEBAPP_URL || env.SHEET_CMS_GATEWAY_URL || ''
  const sharedSecret = env.SHEET_CMS_SHARED_SECRET || ''
  const requestId = env.SHEET_CMS_REQUEST_ID || env.GITHUB_RUN_ID || ''

  if (!filled(webAppUrl)) {
    throw new Error('APPS_SCRIPT_WEBAPP_URL is required unless fixture mode is used.')
  }
  if (!/^https:\/\/script\.google\.com\//.test(webAppUrl) && !/^https:\/\//.test(webAppUrl)) {
    throw new Error('APPS_SCRIPT_WEBAPP_URL must be an HTTPS Web App URL.')
  }
  if (!filled(sharedSecret)) {
    throw new Error('SHEET_CMS_SHARED_SECRET is required unless fixture mode is used.')
  }

  return {
    webAppUrl,
    sharedSecret,
    requestId,
  }
}

export async function callAppsScriptGateway({ action, payload = {}, config = getGatewayConfig() }) {
  const body = {
    action,
    secret: config.sharedSecret,
    requestId: config.requestId || undefined,
    ...payload,
  }

  const response = await fetch(config.webAppUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  })

  const text = await response.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = { ok: false, error: text || `HTTP ${response.status}` }
  }

  if (!response.ok || data?.ok === false) {
    const message = data?.error || data?.message || `HTTP ${response.status}`
    throw new Error(`Apps Script gateway ${action} failed: ${message}`)
  }

  return data
}

export function describeGateway(env = process.env) {
  const webAppUrl = env.APPS_SCRIPT_WEBAPP_URL || env.SHEET_CMS_GATEWAY_URL || ''
  return {
    webAppUrl: redactUrl(webAppUrl),
    hasSharedSecret: filled(env.SHEET_CMS_SHARED_SECRET),
  }
}
