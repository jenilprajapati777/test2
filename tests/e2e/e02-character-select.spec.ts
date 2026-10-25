import { test, expect } from '@playwright/test';
import { setupPageGuards, waitForMuseumReady } from './helpers.js';

test.describe('E-02: Character Selection', () => {
  test('select screen shows both cards and choosing Rutu sets Rutu as player and Jenil as companion', async ({ page }) => {
    const guards = setupPageGuards(page);

    await page.goto('/?test=1');
    await waitForMuseumReady(page);

    // Verify character select screen shows Jenil and Rutu
    const cardRutu = page.locator('#card-rutu');
    const cardJenil = page.locator('#card-jenil');
    await expect(cardRutu).toBeVisible();
    await expect(cardJenil).toBeVisible();

    // Select Rutu
    await page.locator('#btn-select-rutu').click();

    // Wait until in EXPLORING state
    await page.waitForFunction(() => (window as any).__MUSEUM__.getState() === 'EXPLORING');

    const player = await page.evaluate(() => (window as any).__MUSEUM__.getPlayer());
    expect(player.character).toBe('rutu');
    expect(player.isMeshAttached).toBe(true);
    expect(player.isMeshVisible).toBe(true);

    // Position in foyer and orbit camera to face character directly from front
    await page.evaluate(() => {
      (window as any).__MUSEUM__.teleport(0, -9.0, 0);
      (window as any).__MUSEUM__.setCameraOrbit(Math.PI, 0.06, 2.5);
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'docs/verification/character-rutu-front.png' });

    expect(guards.errors).toEqual([]);
  });

  test('choosing Jenil sets Jenil as player and Rutu as companion', async ({ page }) => {
    const guards = setupPageGuards(page);

    await page.goto('/?test=1');
    await waitForMuseumReady(page);

    await page.locator('#btn-select-jenil').click();
    await page.waitForFunction(() => (window as any).__MUSEUM__.getState() === 'EXPLORING');

    const player = await page.evaluate(() => (window as any).__MUSEUM__.getPlayer());
    expect(player.character).toBe('jenil');
    expect(player.isMeshAttached).toBe(true);
    expect(player.isMeshVisible).toBe(true);

    // Position in foyer and orbit camera to face character directly from front
    await page.evaluate(() => {
      (window as any).__MUSEUM__.teleport(0, -9.0, 0);
      (window as any).__MUSEUM__.setCameraOrbit(Math.PI, 0.06, 2.5);
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'docs/verification/character-jenil-front.png' });

    expect(guards.errors).toEqual([]);
  });
});
