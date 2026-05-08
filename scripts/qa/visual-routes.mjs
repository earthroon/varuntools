export const visualViewports = [
  { name: 'desktop-1440', width: 1440, height: 1200 },
  { name: 'desktop-1280', width: 1280, height: 1100 },
  { name: 'tablet-1024', width: 1024, height: 1100 },
  { name: 'tablet-768', width: 768, height: 1100 },
  { name: 'mobile-430', width: 430, height: 1200 },
  { name: 'mobile-390', width: 390, height: 1200 },
  { name: 'mobile-360', width: 360, height: 1200 },
]

export const visualRoutes = [
  { name: 'home', path: '/' },
  { name: 'products', path: '/products' },
  { name: 'product-categories', path: '/products/categories' },
  { name: 'product-category-templates', path: '/products/categories/templates' },
  { name: 'product-dummy-catalog', path: '/products/dummy-catalog' },
  { name: 'inquiry', path: '/inquiry' },
  { name: 'lab-markdown-gallery', path: '/lab-markdown-gallery' },
  { name: 'policies', path: '/policies' },
  { name: 'policy-store', path: '/policies/store' },
  { name: 'policy-shipping', path: '/policies/shipping' },
  { name: 'policy-refund', path: '/policies/refund' },
  { name: 'policy-privacy', path: '/policies/privacy' },
  { name: 'policy-digital-download', path: '/policies/digital-download' },
]

export const screenshotOutputRoot = 'artifacts/qa/screenshots/current'
export const screenshotBaselineRoot = 'artifacts/qa/screenshots/baseline'
export const screenshotDiffRoot = 'artifacts/qa/screenshots/diff'
export const screenshotTmpRoot = 'artifacts/qa/screenshots/tmp'
export const screenshotReportJson = 'artifacts/qa/screenshots/report.json'
export const screenshotReportMarkdown = 'artifacts/qa/screenshots/report.md'
export const screenshotBaselineManifest = 'artifacts/qa/screenshots/baseline/manifest.json'

export function getScreenshotPlan(outputRoot = screenshotOutputRoot) {
  return visualViewports.flatMap((viewport) =>
    visualRoutes.map((route) => ({
      viewport,
      route,
      fileName: `${route.name}.png`,
      relativePath: `${outputRoot}/${viewport.name}/${route.name}.png`,
    })),
  )
}
