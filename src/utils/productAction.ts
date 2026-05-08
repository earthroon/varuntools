import { isExternalCheckoutHref, normalizeCheckoutHandoff } from './checkoutHandoff'

export type ProductActionInput = {
  type?: string
  status?: string
  checkoutProvider?: string
  checkoutMode?: string
  checkoutUrl?: string
  successUrl?: string
  failUrl?: string
  claimRedirect?: string
  externalStoreUrl?: string
  externalUrl?: string
  inquiryUrl?: string
}

export type ProductActionContext = 'card' | 'detail'

export type ProductActionTone = 'primary' | 'neutral' | 'muted' | 'warning'

export type ProductActionKind =
  | 'buy'
  | 'external-store'
  | 'inquiry'
  | 'coming-soon'
  | 'sold-out'
  | 'unavailable'
  | 'link-missing'
  | 'view'

export type ProductAction = {
  kind: ProductActionKind
  label: string
  href: string
  disabled: boolean
  external: boolean
  tone: ProductActionTone
  reason: string
  title: string
  body: string
  checkoutProvider: string
  checkoutMode: string
  successUrl: string
  failUrl: string
  claimRedirect: string
  trustBoundaryNotice: string
}

export type ResolveProductActionOptions = {
  context?: ProductActionContext
  detailHref?: string
}

export function isExternalProductActionHref(href: string): boolean {
  return isExternalCheckoutHref(href)
}

function actionCopy(kind: ProductActionKind, context: ProductActionContext) {
  const detail = {
    buy: { label: 'Buy now', title: 'Checkout handoff ready', body: 'This CTA opens the configured checkout flow. Payment completion is verified later by the server webhook.', reason: 'toss_checkout_handoff_ready' },
    'external-store': { label: 'Open external store', title: 'External checkout', body: 'Purchase or review this product on the connected external store.', reason: 'external_checkout_handoff_ready' },
    inquiry: { label: 'Inquire to buy', title: 'Manual inquiry checkout', body: 'Use the inquiry flow to confirm purchase scope, payment, or manual delivery.', reason: 'manual_inquiry_handoff_ready' },
    'link-missing': { label: 'Checkout pending', title: 'Checkout handoff pending', body: 'The product is available, but checkout handoff metadata is incomplete or disabled.', reason: 'checkout_handoff_missing' },
    'coming-soon': { label: 'Coming soon', title: 'Coming soon', body: 'This product is not open for purchase yet.', reason: 'product_coming_soon' },
    'sold-out': { label: 'Sold out', title: 'Sold out', body: 'This product cannot be purchased right now.', reason: 'product_sold_out' },
    unavailable: { label: 'Unavailable', title: 'Unavailable', body: 'This product is not currently in a public purchase state.', reason: 'product_unavailable' },
    view: { label: 'View details', title: 'Product details', body: 'Open the product detail page.', reason: 'view_detail' },
  } as const

  const card = {
    buy: { ...detail.buy, label: 'Buy' },
    'external-store': { ...detail['external-store'], label: 'Store' },
    inquiry: { ...detail.inquiry, label: 'Inquiry' },
    'link-missing': { ...detail['link-missing'], label: 'Pending' },
    'coming-soon': { ...detail['coming-soon'], label: 'Soon' },
    'sold-out': { ...detail['sold-out'], label: 'Sold out' },
    unavailable: { ...detail.unavailable, label: 'Unavailable' },
    view: { ...detail.view, label: 'View' },
  } as const

  return context === 'card' ? card[kind] : detail[kind]
}

function createAction(kind: ProductActionKind, options: {
  href?: string
  disabled: boolean
  tone: ProductActionTone
  context: ProductActionContext
  checkoutProvider?: string
  checkoutMode?: string
  successUrl?: string
  failUrl?: string
  claimRedirect?: string
  trustBoundaryNotice?: string
  reason?: string
}): ProductAction {
  const href = String(options.href || '').trim()
  const copy = actionCopy(kind, options.context)
  return {
    kind,
    label: copy.label,
    href,
    disabled: options.disabled,
    external: isExternalCheckoutHref(href),
    tone: options.tone,
    reason: options.reason || copy.reason,
    title: copy.title,
    body: copy.body,
    checkoutProvider: options.checkoutProvider || '',
    checkoutMode: options.checkoutMode || '',
    successUrl: options.successUrl || '',
    failUrl: options.failUrl || '',
    claimRedirect: options.claimRedirect || '',
    trustBoundaryNotice: options.trustBoundaryNotice || '',
  }
}

export function resolveProductAction(
  input: ProductActionInput = {},
  options: ResolveProductActionOptions = {},
): ProductAction {
  const context = options.context || 'detail'
  const status = String(input.status || 'coming-soon').trim()
  const detailHref = String(options.detailHref || '').trim()
  const handoff = normalizeCheckoutHandoff(input)

  const shared = {
    checkoutProvider: handoff.provider,
    checkoutMode: handoff.mode,
    successUrl: handoff.successUrl,
    failUrl: handoff.failUrl,
    claimRedirect: handoff.claimRedirect,
    trustBoundaryNotice: handoff.trustBoundaryNotice,
    reason: handoff.reason,
  }

  if (status === 'available') {
    if (handoff.mode === 'toss-ready') {
      return createAction(handoff.disabled ? 'link-missing' : 'buy', { href: handoff.href, disabled: handoff.disabled, tone: handoff.disabled ? 'warning' : 'primary', context, ...shared })
    }
    if (handoff.mode === 'external-checkout') {
      return createAction(handoff.disabled ? 'link-missing' : 'external-store', { href: handoff.href, disabled: handoff.disabled, tone: handoff.disabled ? 'warning' : 'primary', context, ...shared })
    }
    if (handoff.mode === 'manual-inquiry') {
      return createAction(handoff.disabled ? 'link-missing' : 'inquiry', { href: handoff.href, disabled: handoff.disabled, tone: handoff.disabled ? 'warning' : 'primary', context, ...shared })
    }
    return createAction('link-missing', { disabled: true, tone: 'warning', context, ...shared })
  }

  if (status === 'coming-soon') return createAction('coming-soon', { disabled: true, tone: 'neutral', context, ...shared })
  if (status === 'sold-out') return createAction('sold-out', { disabled: true, tone: 'muted', context, ...shared })
  if (status === 'draft' || status === 'hidden') return createAction('unavailable', { disabled: true, tone: 'muted', context, ...shared })

  return createAction('view', { href: detailHref, disabled: false, tone: 'neutral', context, ...shared })
}
