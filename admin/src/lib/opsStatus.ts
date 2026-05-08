export type OpsStatus = 'paid' | 'grant-created' | 'claim-opened' | 'downloaded' | 'expired' | 'refunded' | 'revoked' | 'support-needed' | 'delivery-failed' | 'webhook-failed' | 'reissue-needed'
export type OpsStatusDefinition = { status: OpsStatus; label: string; owner: 'payment' | 'grant' | 'claim' | 'delivery' | 'support' | 'ops'; severity: 'info' | 'warning' | 'blocker'; source: 'purchase_orders' | 'purchase_grants' | 'webhook_events' | 'computed'; description: string; nextAction: string }
export const OPS_STATUS_REGISTRY: OpsStatusDefinition[] = [
{ status:'paid', label:'Paid', owner:'payment', severity:'info', source:'purchase_orders', description:'Server-verified payment is paid.', nextAction:'Confirm grant state.' },
{ status:'grant-created', label:'Grant created', owner:'grant', severity:'info', source:'purchase_grants', description:'A purchase grant exists.', nextAction:'Wait for claim or download.' },
{ status:'claim-opened', label:'Claim opened', owner:'claim', severity:'info', source:'computed', description:'Buyer reached the claim flow.', nextAction:'Confirm redemption path if support asks.' },
{ status:'downloaded', label:'Downloaded', owner:'delivery', severity:'info', source:'purchase_grants', description:'download_count is greater than zero.', nextAction:'No action unless support is requested.' },
{ status:'expired', label:'Expired', owner:'grant', severity:'warning', source:'purchase_grants', description:'Grant is outside its window.', nextAction:'Manual review required before reissue.' },
{ status:'refunded', label:'Refunded', owner:'ops', severity:'warning', source:'computed', description:'Refund is confirmed or expected.', nextAction:'Review grant revoke policy.' },
{ status:'revoked', label:'Revoked', owner:'grant', severity:'blocker', source:'purchase_grants', description:'Grant should no longer allow delivery.', nextAction:'Confirm buyer messaging.' },
{ status:'support-needed', label:'Support needed', owner:'support', severity:'warning', source:'computed', description:'State requires judgment.', nextAction:'Open support review.' },
{ status:'delivery-failed', label:'Delivery failed', owner:'delivery', severity:'blocker', source:'computed', description:'Private delivery failed.', nextAction:'Follow R2 delivery incident playbook.' },
{ status:'webhook-failed', label:'Webhook failed', owner:'payment', severity:'blocker', source:'webhook_events', description:'Payment event failed.', nextAction:'Inspect payment activation log.' },
{ status:'reissue-needed', label:'Reissue needed', owner:'ops', severity:'warning', source:'computed', description:'Grant may need reissue.', nextAction:'Follow grant reissue playbook.' },]
export const OPS_READ_ONLY_NOTICE = 'Read-only ops view. Write actions such as revoke, reissue, refund, and webhook replay are intentionally disabled. Manual review required.'
