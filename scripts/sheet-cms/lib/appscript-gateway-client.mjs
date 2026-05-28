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


function redactGatewayText(text, env = process.env) {
  let value = String(text || '')
  const secret = String(env.SHEET_CMS_SHARED_SECRET || '')
  if (secret) value = value.split(secret).join('[REDACTED_SECRET]')
  value = value.replace(/[A-Za-z0-9+/=]{256,}/g, '[REDACTED_LONG_PAYLOAD]')
  return value.slice(0, 1200)
}

function gatewayDataKeys(data) {
  return data && typeof data === 'object' ? Object.keys(data) : []
}

function gatewayFailureMessage(data, status) {
  if (data?.error && typeof data.error === 'object') return data.error.message || data.error.code || JSON.stringify(data.error)
  return data?.error || data?.message || data?.details?.message || `HTTP ${status}`
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
    const bodyPreview = redactGatewayText(text)
    console.error('[appscript-gateway] failed response', {
      action,
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
      dataKeys: gatewayDataKeys(data),
      bodyPreview,
    })
    const message = gatewayFailureMessage(data, response.status)
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
