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
    buy: { label: '구매하기', title: '결제 이동 준비됨', body: '이 버튼은 설정된 결제 흐름으로 이동합니다. 결제 완료 여부는 이후 서버 웹훅에서 검증됩니다.', reason: 'toss_checkout_handoff_ready' },
    'external-store': { label: '외부 스토어 열기', title: '외부 결제', body: '연결된 외부 스토어에서 상품을 구매하거나 확인합니다.', reason: 'external_checkout_handoff_ready' },
    inquiry: { label: '구매 문의', title: '수동 문의 결제', body: '문의 흐름으로 구매 범위, 결제, 수동 전달 조건을 확인합니다.', reason: 'manual_inquiry_handoff_ready' },
    'link-missing': { label: '결제 준비 중', title: '결제 연결 준비 중', body: '상품은 판매 가능 상태지만 결제 연결 메타데이터가 비어 있거나 비활성화되어 있습니다.', reason: 'checkout_handoff_missing' },
    'coming-soon': { label: '준비 중', title: '준비 중', body: '아직 구매가 열리지 않은 상품입니다.', reason: 'product_coming_soon' },
    'sold-out': { label: '품절', title: '품절', body: '현재 구매할 수 없는 상품입니다.', reason: 'product_sold_out' },
    unavailable: { label: '이용 불가', title: '이용 불가', body: '현재 공개 구매 상태가 아닌 상품입니다.', reason: 'product_unavailable' },
    view: { label: '상세 보기', title: '상품 상세', body: '상품 상세 페이지를 엽니다.', reason: 'view_detail' },
  } as const

  const card = {
    buy: { ...detail.buy, label: '구매' },
    'external-store': { ...detail['external-store'], label: '스토어' },
    inquiry: { ...detail.inquiry, label: '문의' },
    'link-missing': { ...detail['link-missing'], label: '준비 중' },
    'coming-soon': { ...detail['coming-soon'], label: '예정' },
    'sold-out': { ...detail['sold-out'], label: '품절' },
    unavailable: { ...detail.unavailable, label: '이용 불가' },
    view: { ...detail.view, label: '보기' },
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
