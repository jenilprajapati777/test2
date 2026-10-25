import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.LIVE_URL || 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 120000,
  workers: 1,
  expect: {
    timeout: 15000
  },
  fullyParallel: false,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'docs/verification/playwright-report', open: 'never' }]
  ],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    launchOptions: {
      args: [
        '--ignore-gpu-blocklist',
        '--enable-webgl',
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    }
  },
  projects: [
    {
      name: 'desktop',
      use: {
        viewport: { width: 1280, height: 720 },
        isMobile: false,
        hasTouch: false
      }
    },
    {
      name: 'mobile',
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true
      }
    }
  ],
  webServer: process.env.LIVE_URL
    ? undefined
    : {
        command: 'npm run preview',
        url: 'http://127.0.0.1:4173',
        reuseExistingServer: !process.env.CI,
        timeout: 30000
      }
});
