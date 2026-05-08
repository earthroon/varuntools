export const productUploadConfig = {
  schemaVersion: 1,
  productRoot: 'src/content/pages/products',
  manifestFileName: 'product.manifest.json',
  defaultDeliveryMode: 'post-purchase',
  defaultDeliveryProvider: 'cloudflare-r2',
  r2Upload: {
    stagingRoot: '_private/product-files',
    artifactRoot: 'artifacts/r2',
    bucketEnv: 'VARUNTOOLS_R2_BUCKET',
    defaultContentType: 'application/octet-stream',
    sealWritesManifest: true,
  },
  cloudflare: {
    storage: 'r2',
    workerIntegration: 'future',
    bindingName: 'VARUNTOOLS_PRODUCT_BUCKET',
    privateKeyPrefix: 'products/',
    publicDownloadUrlsAllowed: false,
  },
  demoProductSlugs: ['dummy-catalog', 'spec-playground'],
  allowedDeliveryModes: ['post-purchase', 'manual', 'none', 'external'],
  allowedDeliveryProviders: ['cloudflare-r2', 'manual', 'none', 'external'],
} as const
