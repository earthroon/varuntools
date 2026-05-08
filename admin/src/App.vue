<script setup lang="ts">
import type { AdminNavItem } from '@/types/admin'

const navItems: AdminNavItem[] = [
  { label: 'Home', path: '/', description: 'Access boundary and admin surface status' },
  { label: 'Orders', path: '/orders', description: 'purchase_orders read model placeholder' },
  { label: 'Grants', path: '/grants', description: 'purchase_grants read model placeholder' },
  { label: 'Webhook Events', path: '/webhook-events', description: 'webhook_events read model placeholder' },
  { label: 'Products', path: '/products', description: 'product manifest/page sync status placeholder' },
  { label: 'Delivery Incidents', path: '/delivery-incidents', description: 'private R2 delivery incident placeholder' },
  { label: 'Ops Overview', path: '/ops', description: 'sales ledger, grant ledger, and ops status registry' },
  { label: 'Playbooks', path: '/playbooks', description: 'refund, revoke, reissue, and R2 incident playbooks' },
  { label: 'Write Guardrails', path: '/write-guardrails', description: 'dry-run only write action safety slots' },
  { label: 'Audit Log', path: '/audit-log', description: 'D1 dry-run admin_action_audit_log ledger' },
  { label: 'Inquiries', path: '/inquiries', description: 'Private D1 inquiry review queue' },
]
</script>

<template>
  <div class="admin-shell">
    <aside class="admin-sidebar" aria-label="Admin navigation">
      <p class="eyebrow">Varun Tools Admin</p>
      <h1>Ops Surface</h1>
      <p class="surface-note">Cloudflare Access protected app. D1 access is reserved for the Admin API Worker.</p>
      <nav>
        <RouterLink v-for="item in navItems" :key="item.path" :to="item.path" class="nav-item">
          <strong>{{ item.label }}</strong>
          <span>{{ item.description }}</span>
        </RouterLink>
      </nav>
    </aside>
    <main class="admin-main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
:global(body) {
  margin: 0;
  min-width: 320px;
  background: #f5efe3;
  color: #241f1a;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
.admin-shell { min-height: 100vh; display: grid; grid-template-columns: minmax(260px, 320px) 1fr; }
.admin-sidebar { padding: 32px; border-right: 1px solid rgba(36,31,26,.12); background: rgba(255,250,241,.72); }
.eyebrow { margin: 0 0 8px; font-size: 12px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: #8b5d2e; }
h1 { margin: 0; font-size: 32px; line-height: 1.05; }
.surface-note { margin: 16px 0 28px; color: rgba(36,31,26,.72); line-height: 1.6; }
nav { display: grid; gap: 10px; }
.nav-item { display: grid; gap: 3px; padding: 12px 14px; color: inherit; text-decoration: none; border: 1px solid rgba(36,31,26,.12); border-radius: 16px; background: rgba(255,255,255,.52); }
.nav-item.router-link-active { border-color: rgba(139,93,46,.55); background: rgba(255,248,230,.86); }
.nav-item span { font-size: 12px; color: rgba(36,31,26,.64); }
.admin-main { padding: 40px; }
@media (max-width: 860px) { .admin-shell { grid-template-columns: 1fr; } .admin-sidebar { border-right: 0; border-bottom: 1px solid rgba(36,31,26,.12); } .admin-main { padding: 24px; } }
</style>
