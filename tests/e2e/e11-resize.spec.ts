import { test, expect } from '@playwright/test';
import { setupPageGuards, waitForMuseumReady } from './helpers.js';

test.describe('E-11: Viewport Resize & Orientation Adaptation', () => {
  test('resizing between desktop, portrait, and landscape causes no crash and canvas fills viewport', async ({ page }) => {
    const guards = setupPageGuards(page);

    await page.goto('/?test=1&autoSelect=1');
    await waitForMuseumReady(page);
    await page.waitForFunction(() => (window as any).__MUSEUM__.getState() === 'EXPLORING');

    const viewports = [
      { width: 1280, height: 720 },  // Desktop standard
      { width: 768, height: 1024 },  // Tablet portrait
      { width: 390, height: 844 },   // Mobile portrait
      { width: 844, height: 390 }    // Mobile landscape
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.waitForTimeout(150);

      const canvasBox = await page.locator('#webgl-canvas').boundingBox();
      expect(canvasBox).not.toBeNull();
      expect(canvasBox!.width).toBe(vp.width);
      expect(canvasBox!.height).toBe(vp.height);

      // Verify app continues to update
      const state = await page.evaluate(() => (window as any).__MUSEUM__.getState());
      expect(state).toBe('EXPLORING');
    }

    expect(guards.errors).toEqual([]);
  });
});
