import type { Env } from './worker-runtime'

const DEFAULT_ALLOWED_ORIGINS = [
  'https://varun.tools',
  'http://localhost:5173',
  'http://localhost:4173',
]

function allowedOrigins(env: Env): string[] {
  const raw = env.INQUIRY_ALLOWED_ORIGINS || ''
  const configured = raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
  return configured.length ? configured : DEFAULT_ALLOWED_ORIGINS
}

export function corsHeaders(request: Request, env: Env): Headers {
  const headers = new Headers()
  const origin = request.headers.get('Origin') || ''
  const allowList = allowedOrigins(env)
  const allowedOrigin = allowList.includes(origin) ? origin : allowList[0]

  headers.set('Access-Control-Allow-Origin', allowedOrigin)
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type')
  headers.set('Vary', 'Origin')
  return headers
}

export function optionsResponse(request: Request, env: Env): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request, env),
  })
}

export function jsonResponse(request: Request, env: Env, data: unknown, init: ResponseInit = {}): Response {
  const headers = corsHeaders(request, env)
  const inputHeaders = new Headers(init.headers)
  inputHeaders.forEach((value, key) => headers.set(key, value))
  headers.set('Content-Type', 'application/json; charset=utf-8')
  headers.set('Cache-Control', 'no-store')
  return new Response(JSON.stringify(data, null, 2), { ...init, headers })
}
