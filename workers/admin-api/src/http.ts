export function json<T>(data:T, status=200){ return new Response(JSON.stringify(data), { status, headers:{ 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store' }}) }
export function ok<T>(data:T, meta?:unknown){ return json({ ok:true, data, meta }) }
export function fail(status:number, code:string, message:string){ return json({ ok:false, error:{ code, message }}, status) }
export function methodNotAllowed(message='Use GET for this read-only Admin API endpoint.'){ return fail(405, 'METHOD_NOT_ALLOWED', message) }
export function parseLimit(url:URL){ const raw=Number(url.searchParams.get('limit') ?? 50); return Math.max(1, Math.min(Number.isFinite(raw) ? raw : 50, 100)) }
export function parseOffset(url:URL){ const raw=Number(url.searchParams.get('offset') ?? 0); return Math.max(0, Number.isFinite(raw) ? raw : 0) }
