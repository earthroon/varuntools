import { screenshotOutputRoot, visualRoutes, visualViewports } from './scripts/qa/visual-routes.mjs'

export default {
  baseURL: process.env.QA_BASE_URL || 'http://127.0.0.1:4173',
  outputDir: screenshotOutputRoot,
  timeout: 30_000,
  use: {
    colorScheme: 'light',
    reducedMotion: 'reduce',
    screenshot: 'only-on-failure',
    trace: 'off',
  },
  visualRoutes,
  visualViewports,
}
