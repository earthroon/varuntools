import { createRouter, createWebHistory } from 'vue-router'
import AdminHome from './views/AdminHome.vue'
import OrdersView from './views/OrdersView.vue'
import GrantsView from './views/GrantsView.vue'
import WebhookEventsView from './views/WebhookEventsView.vue'
import ProductsView from './views/ProductsView.vue'
import DeliveryIncidentsView from './views/DeliveryIncidentsView.vue'
import OpsOverviewView from './views/OpsOverviewView.vue'
import OpsPlaybooksView from './views/OpsPlaybooksView.vue'
import WriteGuardrailsView from './views/WriteGuardrailsView.vue'
import AuditLogView from './views/AuditLogView.vue'
import InquiriesView from './views/InquiriesView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'admin-home', component: AdminHome },
    { path: '/orders', name: 'orders', component: OrdersView },
    { path: '/grants', name: 'grants', component: GrantsView },
    { path: '/webhook-events', name: 'webhook-events', component: WebhookEventsView },
    { path: '/products', name: 'products', component: ProductsView },
    { path: '/delivery-incidents', name: 'delivery-incidents', component: DeliveryIncidentsView },
    { path: '/ops', name: 'ops-overview', component: OpsOverviewView },
    { path: '/playbooks', name: 'ops-playbooks', component: OpsPlaybooksView },
    { path: '/write-guardrails', name: 'write-guardrails', component: WriteGuardrailsView },
    { path: '/audit-log', name: 'audit-log', component: AuditLogView },
    { path: '/inquiries', name: 'inquiries', component: InquiriesView },
  ],
})
