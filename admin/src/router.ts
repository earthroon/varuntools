export type AdminRouteRecord = { path: string; name: string; component: string }
export const adminRoutes: AdminRouteRecord[] = [
  { path: '/inquiries', name: 'admin-inquiries', component: 'InquiriesView' },
  { path: '/audit-log', name: 'admin-audit-log', component: 'AuditLogView' },
]
export default adminRoutes
