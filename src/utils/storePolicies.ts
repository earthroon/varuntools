export type StorePolicyKey =
  | 'store'
  | 'shipping'
  | 'refund'
  | 'privacy'
  | 'digital-download'

export type StorePolicyLink = {
  key: StorePolicyKey
  title: string
  body: string
  href: string
  label: string
}

export const STORE_POLICY_LINKS: Record<StorePolicyKey, StorePolicyLink> = {
  store: {
    key: 'store',
    title: '스토어 안내',
    body: '구매 전 상품 상태와 판매 방식을 확인합니다.',
    href: '/policies/store',
    label: '스토어 안내 보기',
  },
  shipping: {
    key: 'shipping',
    title: '배송 안내',
    body: '실물 상품 배송 방식과 준비 상태를 확인합니다.',
    href: '/policies/shipping',
    label: '배송 안내 보기',
  },
  refund: {
    key: 'refund',
    title: '환불/교환 안내',
    body: '구매 전 환불/교환 기준을 확인합니다.',
    href: '/policies/refund',
    label: '환불/교환 안내 보기',
  },
  privacy: {
    key: 'privacy',
    title: '개인정보 안내',
    body: '외부 결제/문의 과정에서의 개인정보 안내를 확인합니다.',
    href: '/policies/privacy',
    label: '개인정보 안내 보기',
  },
  'digital-download': {
    key: 'digital-download',
    title: '디지털 다운로드 안내',
    body: '디지털 파일 제공 방식과 사용 범위를 확인합니다.',
    href: '/policies/digital-download',
    label: '다운로드 안내 보기',
  },
}

export const STORE_POLICY_ORDER: StorePolicyKey[] = [
  'store',
  'shipping',
  'digital-download',
  'refund',
  'privacy',
]

export function getStorePolicyLink(key: StorePolicyKey): StorePolicyLink {
  return STORE_POLICY_LINKS[key]
}
