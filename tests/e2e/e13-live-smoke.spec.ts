import { test, expect } from '@playwright/test';
import { setupPageGuards, waitForMuseumReady } from './helpers.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');

test.describe('E-13: Live Deployment Smoke Suite', () => {
  test('live smoke: clean boot, character selection, navigation, Exit 1 and Exit 2 endings', async ({ page }) => {
    test.setTimeout(240000);
    const guards = setupPageGuards(page);
    const screenshotDir = path.join(rootDir, 'docs', 'verification');

    // 1. Boot (E-01)
    await page.goto('/?test=1');
    await waitForMuseumReady(page);
    await page.screenshot({ path: path.join(screenshotDir, 'live-01-select.png') });

    // 2. Character Select (E-02)
    const btnRutu = page.locator('#btn-select-rutu');
    await expect(btnRutu).toBeVisible();
    await btnRutu.click();
    await page.waitForFunction(() => (window as any).__MUSEUM__.getState() === 'EXPLORING');

    const player = await page.evaluate(() => (window as any).__MUSEUM__.getPlayer());
    expect(player.character).toBe('rutu');
    await page.screenshot({ path: path.join(screenshotDir, 'live-02-spawn.png') });

    // 3. Short Navigation (E-05)
    const walkResult = await page.evaluate(async () => {
      return await (window as any).__MUSEUM__.walkRoute([[-0.8, -12], [-0.8, -6], [0, -6]], { run: true, timeoutMs: 15000 });
    });
    expect(walkResult.stuck).toBe(false);
    await page.screenshot({ path: path.join(screenshotDir, 'live-03-hall.png') });

    // 4. Exit 1 Ending (E-08)
    await page.evaluate(() => (window as any).__MUSEUM__.teleport(-8.6, 12.5, 270));
    await page.waitForFunction(() => (window as any).__MUSEUM__.getState() === 'RIGHT_PATH', { timeout: 10000 });
    await expect(page.locator('#right-path-card')).toBeVisible();
    await page.screenshot({ path: path.join(screenshotDir, 'live-04-exit1.png') });

    // Replay
    await page.locator('#btn-replay-museum').click();
    await page.waitForFunction(() => (window as any).__MUSEUM__.getState() === 'EXPLORING', { timeout: 10000 });

    // 5. Exit 2 Ending (E-09)
    await page.evaluate(() => (window as any).__MUSEUM__.teleport(8.6, 12.5, 90));
    await page.waitForFunction(() => (window as any).__MUSEUM__.getState() === 'HELL_FALL', { timeout: 10000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, 'live-05-hell.png') });

    const retryPanel = page.locator('#hell-retry-panel');
    await expect(retryPanel).toBeVisible({ timeout: 25000 });
    await page.locator('#btn-hell-yes').click();
    await page.waitForFunction(() => (window as any).__MUSEUM__.getState() === 'EXPLORING', { timeout: 10000 });

    expect(guards.errors).toEqual([]);
  });
});
