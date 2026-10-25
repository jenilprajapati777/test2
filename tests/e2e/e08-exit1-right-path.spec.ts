import { test, expect } from '@playwright/test';
import { setupPageGuards, waitForMuseumReady } from './helpers.js';

test.describe('E-08: Exit 1 Right Path Ending', () => {
  test('entering Exit 1 triggers fade, displays congratulations card, and replay resets to Entry', async ({ page }) => {
    const guards = setupPageGuards(page);

    await page.goto('/?test=1&autoSelect=1');
    await waitForMuseumReady(page);
    await page.waitForFunction(() => (window as any).__MUSEUM__.getState() === 'EXPLORING');

    // Teleport to Exit 1 corridor: (-8.6, 12.5)
    await page.evaluate(() => (window as any).__MUSEUM__.teleport(-8.6, 12.5, 270));

    // Wait for RIGHT_PATH state and congratulations card
    await page.waitForFunction(() => (window as any).__MUSEUM__.getState() === 'RIGHT_PATH', { timeout: 10000 });

    const card = page.locator('#right-path-card');
    await expect(card).toBeVisible();

    const text = page.locator('#right-path-result-text');
    await expect(text).toHaveText('Congratulations! You chose the right path.');

    // Click 'Replay the museum'
    const replayBtn = page.locator('#btn-replay-museum');
    await replayBtn.click();

    // Wait until state returns to EXPLORING
    await page.waitForFunction(() => (window as any).__MUSEUM__.getState() === 'EXPLORING', { timeout: 10000 });

    // Verify player is at spawn
    const player = await page.evaluate(() => (window as any).__MUSEUM__.getPlayer());
    expect(player.x).toBeCloseTo(-0.8, 1);
    expect(player.y).toBeCloseTo(-12, 1);

    // Verify controls work again
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(400);
    const movedPlayer = await page.evaluate(() => (window as any).__MUSEUM__.getPlayer());
    expect(movedPlayer.speed).toBeGreaterThan(1.0);
    await page.keyboard.up('KeyW');

    expect(guards.errors).toEqual([]);
  });
});
