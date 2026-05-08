import type { ProductFrontmatter } from '@/types/content'

export type CheckoutHandoffMode =
  | 'toss-ready'
  | 'external-checkout'
  | 'manual-inquiry'
  | 'disabled'

export type CheckoutHandoffProvider =
  | 'toss-payments'
  | 'external'
  | 'manual'
  | 'none'

export type CheckoutHandoff = {
  provider: CheckoutHandoffProvider
  mode: CheckoutHandoffMode
  href: string
  successUrl: string
  failUrl: string
  claimRedirect: string
  disabled: boolean
  external: boolean
  reason: string
  trustBoundary: 'frontend-handoff-only'
  trustBoundaryNotice: string
}

const VALID_PROVIDERS = new Set<CheckoutHandoffProvider>(['toss-payments', 'external', 'manual', 'none'])
const VALID_MODES = new Set<CheckoutHandoffMode>(['toss-ready', 'external-checkout', 'manual-inquiry', 'disabled'])
const HTTP_URL_RE = /^https?:\/\//i

export const CHECKOUT_TRUST_BOUNDARY = 'frontend-handoff-only' as const
export const CHECKOUT_TRUST_BOUNDARY_NOTICE =
  'Payment success screens do not prove purchase rights. File delivery is activated only after server-side payment verification and grant creation.'

function clean(value: unknown): string {
  return String(value || '').trim()
}

function normalizeProvider(value: unknown): CheckoutHandoffProvider {
  const provider = clean(value) as CheckoutHandoffProvider
  return VALID_PROVIDERS.has(provider) ? provider : 'none'
}

function normalizeMode(value: unknown): CheckoutHandoffMode | '' {
  const mode = clean(value) as CheckoutHandoffMode
  return VALID_MODES.has(mode) ? mode : ''
}

export function isExternalCheckoutHref(href: string): boolean {
  return HTTP_URL_RE.test(clean(href))
}

export function normalizeCheckoutHandoff(product: ProductFrontmatter = {}): CheckoutHandoff {
  const provider = normalizeProvider(product.checkoutProvider)
  const checkoutUrl = clean(product.checkoutUrl)
  const externalStoreUrl = clean(product.externalStoreUrl) || clean(product.externalUrl)
  const inquiryUrl = clean(product.inquiryUrl)
  let mode = normalizeMode(product.checkoutMode)

  if (!mode) {
    if (provider === 'toss-payments' && checkoutUrl) mode = 'toss-ready'
    else if (provider === 'external' || externalStoreUrl) mode = 'external-checkout'
    else if (provider === 'manual' || inquiryUrl) mode = 'manual-inquiry'
    else mode = 'disabled'
  }

  const successUrl = clean(product.successUrl) || (mode === 'toss-ready' ? '/checkout/success' : '')
  const failUrl = clean(product.failUrl) || (mode === 'toss-ready' ? '/checkout/fail' : '')
  const claimRedirect = clean(product.claimRedirect) || (mode === 'toss-ready' || mode === 'manual-inquiry' ? '/claim' : '')

  if (mode === 'toss-ready') {
    return {
      provider: 'toss-payments',
      mode,
      href: checkoutUrl,
      successUrl,
      failUrl,
      claimRedirect,
      disabled: !checkoutUrl,
      external: isExternalCheckoutHref(checkoutUrl),
      reason: checkoutUrl ? 'toss_checkout_handoff_ready' : 'toss_checkout_url_missing',
      trustBoundary: CHECKOUT_TRUST_BOUNDARY,
      trustBoundaryNotice: CHECKOUT_TRUST_BOUNDARY_NOTICE,
    }
  }

  if (mode === 'external-checkout') {
    const href = externalStoreUrl || checkoutUrl
    return {
      provider: 'external',
      mode,
      href,
      successUrl: clean(product.successUrl),
      failUrl: clean(product.failUrl),
      claimRedirect: clean(product.claimRedirect),
      disabled: !href,
      external: isExternalCheckoutHref(href),
      reason: href ? 'external_checkout_handoff_ready' : 'external_checkout_url_missing',
      trustBoundary: CHECKOUT_TRUST_BOUNDARY,
      trustBoundaryNotice: CHECKOUT_TRUST_BOUNDARY_NOTICE,
    }
  }

  if (mode === 'manual-inquiry') {
    return {
      provider: 'manual',
      mode,
      href: inquiryUrl,
      successUrl: clean(product.successUrl),
      failUrl: clean(product.failUrl),
      claimRedirect,
      disabled: !inquiryUrl,
      external: isExternalCheckoutHref(inquiryUrl),
      reason: inquiryUrl ? 'manual_inquiry_handoff_ready' : 'manual_inquiry_url_missing',
      trustBoundary: CHECKOUT_TRUST_BOUNDARY,
      trustBoundaryNotice: CHECKOUT_TRUST_BOUNDARY_NOTICE,
    }
  }

  return {
    provider: 'none',
    mode: 'disabled',
    href: '',
    successUrl: '',
    failUrl: '',
    claimRedirect: '',
    disabled: true,
    external: false,
    reason: 'checkout_handoff_disabled',
    trustBoundary: CHECKOUT_TRUST_BOUNDARY,
    trustBoundaryNotice: CHECKOUT_TRUST_BOUNDARY_NOTICE,
  }
}

function isSafeRedirect(value: string): boolean {
  if (!value) return true
  return value.startsWith('/') || HTTP_URL_RE.test(value)
}

export function validateCheckoutHandoff(product: ProductFrontmatter = {}): string[] {
  const issues: string[] = []
  const provider = normalizeProvider(product.checkoutProvider)
  const mode = normalizeMode(product.checkoutMode) || 'disabled'
  const handoff = normalizeCheckoutHandoff(product)

  if (product.checkoutProvider && provider === 'none' && product.checkoutProvider !== 'none') {
    issues.push('invalid_checkout_provider')
  }
  if (product.checkoutMode && !normalizeMode(product.checkoutMode)) {
    issues.push('invalid_checkout_mode')
  }
  if (mode === 'toss-ready' && provider !== 'toss-payments') {
    issues.push('toss_ready_provider_mismatch')
  }
  if (mode === 'toss-ready' && !handoff.href) issues.push('toss_ready_missing_checkout_url')
  if (mode === 'toss-ready' && !handoff.successUrl) issues.push('toss_ready_missing_success_url')
  if (mode === 'toss-ready' && !handoff.failUrl) issues.push('toss_ready_missing_fail_url')
  if (mode === 'external-checkout' && !handoff.href) issues.push('external_checkout_missing_url')
  if (mode === 'manual-inquiry' && !handoff.href) issues.push('manual_inquiry_missing_inquiry_url')
  if (mode === 'disabled' && clean(product.checkoutUrl)) issues.push('disabled_mode_with_checkout_url')
  if (!isSafeRedirect(handoff.successUrl)) issues.push('unsafe_success_url')
  if (!isSafeRedirect(handoff.failUrl)) issues.push('unsafe_fail_url')
  if (!isSafeRedirect(handoff.claimRedirect)) issues.push('unsafe_claim_redirect')

  return issues
}
