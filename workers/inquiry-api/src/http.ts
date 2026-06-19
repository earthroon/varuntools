import type { Env } from './worker-runtime'

const DEFAULT_ALLOWED_ORIGIN = 'https://varun.tools'

export function resolveAllowedOrigin(request: Request, env: Env): string {
  const origin = request.headers.get('Origin') || DEFAULT_ALLOWED_ORIGIN
  const allowed = (env.INQUIRY_ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGIN)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  return allowed.includes(origin) ? origin : DEFAULT_ALLOWED_ORIGIN
}

export function corsHeaders(request: Request, env: Env): HeadersInit {
  return {
    'Access-Control-Allow-Origin': resolveAllowedOrigin(request, env),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  }
}

export function preflightResponse(request: Request, env: Env): Response {
  return new Response(null, { status: 204, headers: corsHeaders(request, env) })
}

export function jsonResponse(request: Request, env: Env, body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(request, env),
      ...(init.headers || {}),
    },
  })
}
