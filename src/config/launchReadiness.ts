export type LaunchMode = 'prelaunch' | 'launch-candidate' | 'production'

export type LaunchReadinessConfig = {
  launchMode: LaunchMode
  allowDemoProducts: boolean
  demoProductSlugs: string[]
  requireGoogleFormConnection: boolean
  requirePolicyReviewFlag: boolean
  requireOgImages: boolean
  requireThumbnails: boolean
  requireScreenshotBaseline: boolean
  failOnImageWarnings: boolean
}

export const launchReadinessConfig: LaunchReadinessConfig = {
  launchMode: 'prelaunch',
  allowDemoProducts: true,
  demoProductSlugs: ['dummy-catalog', 'spec-playground'],
  requireGoogleFormConnection: false,
  requirePolicyReviewFlag: false,
  requireOgImages: false,
  requireThumbnails: false,
  requireScreenshotBaseline: false,
  failOnImageWarnings: false,
}

export const launchModeNotes: Record<LaunchMode, string> = {
  prelaunch: '기능 확인과 샘플 검토가 가능한 준비 단계입니다. 더미 상품과 warning을 허용합니다.',
  'launch-candidate': '출시 후보 단계입니다. 더미 상품, 문의 연결, 정책 검토, 대표 이미지를 최종 점검합니다.',
  production: '공개 운영 단계입니다. 더미 상품과 미연결 문의, 미검토 정책, 누락된 OG/thumbnail을 blocker로 승격해야 합니다.',
}
