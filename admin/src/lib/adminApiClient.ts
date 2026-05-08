import type { AdminActionAuditSummary, AdminDeliveryIncidentSummary, AdminGrantSummary, AdminHealth, AdminOrderSummary, AdminProductOpsSummary, AdminSession, AdminWebhookEventSummary, Paginated } from '@/types/admin'
const ADMIN_API_COMPAT_STATUS = 'pending-admin-api'
const ADMIN_API_BASE = import.meta.env.VITE_ADMIN_API_BASE ?? '/api'
type ApiResponse<T> = { ok:true; data:T; meta?:unknown } | { ok:false; error:{ code:string; message:string } }
async function requestAdminApi<T>(path:string):Promise<T>{ const response=await fetch(`${ADMIN_API_BASE}${path}`, { credentials:'include' }); const payload=await response.json() as ApiResponse<T>; if(!response.ok || !payload.ok) throw new Error(payload.ok ? `Admin API request failed: ${response.status}` : payload.error.message); return payload.data }
export async function fetchAdminHealth():Promise<AdminHealth>{ try{ const data=await requestAdminApi<{ service:string; mode:string; d1:string; access:string }>('/health'); return { status:'ok', message:`${data.service} is ${data.mode}; D1 ${data.d1}; Access ${data.access}.` }}catch(error){ return { status:'error', message:error instanceof Error ? error.message : 'Admin API unavailable.' } }}
export async function fetchAdminSession():Promise<AdminSession|null>{ try{ const data=await requestAdminApi<{ user:AdminSession }>('/session'); return data.user }catch{ return null } }
export async function fetchOrders():Promise<Paginated<AdminOrderSummary>>{ return requestAdminApi('/orders') }
export async function fetchGrants():Promise<Paginated<AdminGrantSummary>>{ return requestAdminApi('/grants') }
export async function fetchWebhookEvents():Promise<Paginated<AdminWebhookEventSummary>>{ return requestAdminApi('/webhook-events') }
export async function fetchProducts():Promise<AdminProductOpsSummary[]>{ return requestAdminApi('/products') }
export async function fetchDeliveryIncidents():Promise<Paginated<AdminDeliveryIncidentSummary>>{ return requestAdminApi('/delivery-incidents') }
export async function fetchAdminActionAuditLog():Promise<Paginated<AdminActionAuditSummary>>{ return requestAdminApi('/audit-log') }
export function getAdminApiBoundaryNotice():string{ return 'Admin browser app calls the Admin API Worker. The Admin API Worker verifies Cloudflare Access JWT and queries D1 through a Worker binding. This surface is read-only except for sealed admin_action_audit_log inserts created by dry-run write planning.' }
