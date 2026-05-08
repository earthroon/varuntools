import type { ProductFrontmatter } from '@/types/content'
import { getStorePolicyLink, STORE_POLICY_ORDER, type StorePolicyKey } from '@/utils/storePolicies'

export type ProductTrustBlockKind = StorePolicyKey | 'contact'

export type ProductTrustBlockTone = 'neutral' | 'info' | 'warning'

export type ProductTrustBlock = {
  kind: ProductTrustBlockKind
  title: string
  body: string
  href: string
  label: string
  tone: ProductTrustBlockTone
}

function hasText(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function normalizeType(product?: ProductFrontmatter | null): string {
  return String(product?.type || '').trim()
}

function normalizeStatus(product?: ProductFrontmatter | null): string {
  return String(product?.status || '').trim()
}

function policyBlock(
  key: StorePolicyKey,
  tone: ProductTrustBlockTone = 'neutral',
  bodyOverride?: string,
): ProductTrustBlock {
  const policy = getStorePolicyLink(key)
  return {
    kind: policy.key,
    title: policy.title,
    body: bodyOverride || policy.body,
    href: policy.href,
    label: policy.label,
    tone,
  }
}

function dedupeStable(blocks: ProductTrustBlock[]): ProductTrustBlock[] {
  const seen = new Set<ProductTrustBlockKind>()
  const result: ProductTrustBlock[] = []
  for (const block of blocks) {
    if (seen.has(block.kind)) continue
    seen.add(block.kind)
    result.push(block)
  }
  return result.sort((a, b) => {
    const aIndex = STORE_POLICY_ORDER.indexOf(a.kind as StorePolicyKey)
    const bIndex = STORE_POLICY_ORDER.indexOf(b.kind as StorePolicyKey)
    const safeA = aIndex < 0 ? 999 : aIndex
    const safeB = bIndex < 0 ? 999 : bIndex
    return safeA - safeB || a.title.localeCompare(b.title)
  })
}

export function resolveProductTrustBlocks(product?: ProductFrontmatter | null): ProductTrustBlock[] {
  if (!product) return []

  const type = normalizeType(product)
  const status = normalizeStatus(product)
  const blocks: ProductTrustBlock[] = []

  blocks.push(policyBlock('store', 'neutral', product.policyNote || undefined))

  if (type === 'physical' && product.shippingRequired !== false) {
    blocks.push(policyBlock('shipping', 'info', product.shippingNote || undefined))
  }

  if (type === 'digital') {
    const missingDownload = status === 'available' && !hasText(product.downloadUrl)
    blocks.push(policyBlock(
      'digital-download',
      missingDownload ? 'warning' : 'info',
      product.digitalDeliveryNote || (missingDownload
        ? '판매 가능 상태지만 downloadUrl이 아직 연결되지 않았습니다. 구매 전 제공 방식을 확인해야 합니다.'
        : undefined),
    ))
  }

  blocks.push(policyBlock('refund', 'neutral', product.refundNote || undefined))

  if (hasText(product.inquiryUrl)) {
    blocks.push({
      kind: 'contact',
      title: '문의 안내',
      body: '이 상품은 문의 링크를 통해 범위, 견적, 제공 방식을 확인할 수 있습니다.',
      href: String(product.inquiryUrl).trim(),
      label: '문의하기',
      tone: 'info',
    })
  }

  if (hasText(product.checkoutUrl) || hasText(product.externalStoreUrl) || hasText(product.inquiryUrl)) {
    blocks.push(policyBlock('privacy'))
  }

  return dedupeStable(blocks)
}
