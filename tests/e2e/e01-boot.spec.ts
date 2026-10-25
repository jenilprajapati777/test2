import { test, expect } from '@playwright/test';
import { setupPageGuards, waitForMuseumReady } from './helpers.js';

test.describe('E-01: Boot & Clean Initialization', () => {
  test('boots with no uncaught exceptions or errors and renders WebGL canvas', async ({ page }) => {
    const guards = setupPageGuards(page);

    await page.goto('/?test=1');
    await waitForMuseumReady(page);

    const canvas = page.locator('#webgl-canvas');
    await expect(canvas).toBeVisible();

    // Verify canvas dimensions > 0
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);

    // Verify debug API version
    const version = await page.evaluate(() => (window as any).__MUSEUM__.version);
    expect(version).toBe('1.0.0');

    // No uncaught errors
    expect(guards.errors).toEqual([]);
  });
});
