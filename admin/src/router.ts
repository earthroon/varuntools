export type AdminRouteRecord = { path: string; name: string; component: string }
export const adminRoutes: AdminRouteRecord[] = [
  { path: '/inquiries', name: 'admin-inquiries', component: 'InquiriesView' },
]
export default adminRoutes
