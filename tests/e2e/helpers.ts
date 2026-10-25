import { Page } from '@playwright/test';

export function setupPageGuards(page: Page): { errors: string[] } {
  const errors: string[] = [];

  page.on('pageerror', (err) => {
    errors.push(`Page error: ${err.message}`);
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore intentionally probed missing media files
      const isOptionalMedia =
        text.includes('.jpg') ||
        text.includes('.mp4') ||
        text.includes('.webm') ||
        text.includes('.glb') ||
        text.includes('bgm.mp3');

      if (!isOptionalMedia) {
        errors.push(`Console error: ${text}`);
      }
    }
  });

  page.on('response', (res) => {
    if (res.status() >= 400) {
      const url = res.url();
      const isOptionalMedia =
        url.endsWith('.jpg') ||
        url.endsWith('.jpeg') ||
        url.endsWith('.png') ||
        url.endsWith('.webp') ||
        url.endsWith('.mp4') ||
        url.endsWith('.webm') ||
        url.endsWith('.glb') ||
        url.endsWith('bgm.mp3');

      if (!isOptionalMedia) {
        errors.push(`Failed network request: ${res.status()} ${url}`);
      }
    }
  });

  return { errors };
}

export async function waitForMuseumReady(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    return (window as any).__MUSEUM__ !== undefined;
  }, { timeout: 15000 });
}
