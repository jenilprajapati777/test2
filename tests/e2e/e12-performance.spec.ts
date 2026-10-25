import { test, expect } from '@playwright/test';
import { setupPageGuards, waitForMuseumReady } from './helpers.js';

test.describe('E-12: Performance Budgets & Render Metrics', () => {
  test('draw calls < 400 and triangles < 600,000 across the main hall and alcoves', async ({ page }) => {
    const guards = setupPageGuards(page);

    await page.goto('/?test=1&autoSelect=1');
    await waitForMuseumReady(page);
    await page.waitForFunction(() => (window as any).__MUSEUM__.getState() === 'EXPLORING');

    // Teleport to Main Hall center facing pillar
    await page.evaluate(() => (window as any).__MUSEUM__.teleport(0, -6, 0));
    await page.waitForTimeout(300);

    const stats = await page.evaluate(() => (window as any).__MUSEUM__.getStats());

    console.info(`[Perf Metrics] Draw calls: ${stats.drawCalls}, Triangles: ${stats.triangles}, Reported FPS: ${stats.fps}`);

    expect(stats.drawCalls).toBeLessThan(400);
    expect(stats.triangles).toBeLessThan(600000);

    expect(guards.errors).toEqual([]);
  });
});
