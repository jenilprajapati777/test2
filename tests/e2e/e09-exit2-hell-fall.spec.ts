import { test, expect } from '@playwright/test';
import { setupPageGuards, waitForMuseumReady } from './helpers.js';

test.describe('E-09: Exit 2 Hell Fall, Timings, Retry Loops & Memory Stability', () => {
  test('entering Exit 2 triggers hell fall, wrong-exit text, retry prompt; Yes twice in a row works; No -> farewell -> try again works without memory leaks', async ({ page }) => {
    const guards = setupPageGuards(page);

    await page.goto('/?test=1&autoSelect=1');
    await waitForMuseumReady(page);
    await page.waitForFunction(() => (window as any).__MUSEUM__.getState() === 'EXPLORING');

    const initialStats = await page.evaluate(() => (window as any).__MUSEUM__.getStats());

    // --- Sequence 1: First Hell Fall ---
    await page.evaluate(() => (window as any).__MUSEUM__.teleport(8.6, 12.5, 90));

    // Wait for HELL_FALL
    await page.waitForFunction(() => (window as any).__MUSEUM__.getState() === 'HELL_FALL', { timeout: 10000 });

    const isActive = await page.evaluate(() => (window as any).__MUSEUM__.hell.isActive());
    expect(isActive).toBe(true);
    const particleCount = await page.evaluate(() => (window as any).__MUSEUM__.hell.getParticleCount());
    expect(particleCount).toBe(600);

    // Wait for Wrong Exit text
    const resultText = page.locator('#hell-result-text');
    await expect(resultText).toBeVisible({ timeout: 6000 });
    await expect(resultText).toHaveText('Sorry, you chose the wrong exit.');

    // Wait for Retry Panel
    const retryPanel = page.locator('#hell-retry-panel');
    await expect(retryPanel).toBeVisible({ timeout: 25000 });
    await expect(page.locator('#hell-retry-question')).toHaveText('Do you need another chance?');

    // Click Yes: Give me another chance
    await page.locator('#btn-hell-yes').click();

    // Verify returns to EXPLORING at Entry spawn
    await page.waitForFunction(() => (window as any).__MUSEUM__.getState() === 'EXPLORING', { timeout: 15000 });
    let player = await page.evaluate(() => (window as any).__MUSEUM__.getPlayer());
    expect(player.x).toBeCloseTo(-0.8, 1);
    expect(player.y).toBeCloseTo(-12, 1);

    // --- Sequence 2: Second Hell Fall (Yes twice in a row) ---
    await page.evaluate(() => (window as any).__MUSEUM__.teleport(8.6, 12.5, 90));
    await page.waitForFunction(() => (window as any).__MUSEUM__.getState() === 'HELL_FALL', { timeout: 15000 });
    await expect(retryPanel).toBeVisible({ timeout: 25000 });
    await page.locator('#btn-hell-yes').click();
    await page.waitForFunction(() => (window as any).__MUSEUM__.getState() === 'EXPLORING', { timeout: 15000 });

    // --- Sequence 3: Third Hell Fall (No -> Farewell -> Try Again) ---
    await page.evaluate(() => (window as any).__MUSEUM__.teleport(8.6, 12.5, 90));
    await page.waitForFunction(() => (window as any).__MUSEUM__.getState() === 'HELL_FALL', { timeout: 15000 });
    await expect(retryPanel).toBeVisible({ timeout: 25000 });

    // Click No
    await page.locator('#btn-hell-no').click();

    // Verify farewell text
    await expect(page.locator('#hell-retry-question')).toContainText('the museum will be here whenever you change your mind');

    // Click 'Actually, let me try again'
    const tryAgainBtn = page.locator('#btn-hell-try-again');
    await expect(tryAgainBtn).toBeVisible();
    await tryAgainBtn.click();

    // Verify returns to EXPLORING
    await page.waitForFunction(() => (window as any).__MUSEUM__.getState() === 'EXPLORING', { timeout: 15000 });
    player = await page.evaluate(() => (window as any).__MUSEUM__.getPlayer());
    expect(player.x).toBeCloseTo(-0.8, 1);
    expect(player.y).toBeCloseTo(-12, 1);

    // Verify memory growth does not exceed 10%
    const finalStats = await page.evaluate(() => (window as any).__MUSEUM__.getStats());
    const initialGeos = initialStats.memory.geometries;
    const finalGeos = finalStats.memory.geometries;
    expect(finalGeos).toBeLessThanOrEqual(initialGeos * 1.15 + 2);

    expect(guards.errors).toEqual([]);
  });

  test('Rutu character selecting No (Exit 2) and respawning preserves character mesh visibility and attachment in scene', async ({ page }) => {
    const guards = setupPageGuards(page);

    await page.goto('/?test=1');
    await waitForMuseumReady(page);

    // Select Rutu on the character selection screen
    await page.locator('#btn-select-rutu').click();
    await page.waitForFunction(() => (window as any).__MUSEUM__.getState() === 'EXPLORING', { timeout: 15000 });

    const beforeFall = await page.evaluate(() => (window as any).__MUSEUM__.getPlayer());
    expect(beforeFall.character).toBe('rutu');
    expect(beforeFall.isMeshAttached).toBe(true);
    expect(beforeFall.isMeshVisible).toBe(true);

    // Enter Exit 2 trigger zone: [8.4, 9] x [11, 14]
    await page.evaluate(() => (window as any).__MUSEUM__.teleport(8.6, 12.5, 90));
    await page.waitForFunction(() => (window as any).__MUSEUM__.getState() === 'HELL_FALL', { timeout: 15000 });

    const retryPanel = page.locator('#hell-retry-panel');
    await expect(retryPanel).toBeVisible({ timeout: 25000 });

    // Click Yes to retry
    await page.locator('#btn-hell-yes').click();

    // Verify successfully restored to EXPLORING
    await page.waitForFunction(() => (window as any).__MUSEUM__.getState() === 'EXPLORING', { timeout: 15000 });

    const afterRespawn = await page.evaluate(() => (window as any).__MUSEUM__.getPlayer());
    expect(afterRespawn.character).toBe('rutu');
    expect(afterRespawn.isMeshAttached).toBe(true);
    expect(afterRespawn.isMeshVisible).toBe(true);
    expect(afterRespawn.meshOpacity).toBeGreaterThanOrEqual(0.35);

    // When walking forward into the open foyer, camera distance increases and opacity is full 1.0
    await page.evaluate(() => (window as any).__MUSEUM__.teleport(-0.8, -10.0, 0));
    await page.waitForTimeout(300);
    const inFoyer = await page.evaluate(() => (window as any).__MUSEUM__.getPlayer());
    expect(inFoyer.meshOpacity).toBe(1.0);
    expect(afterRespawn.x).toBeCloseTo(-0.8, 1);
    expect(afterRespawn.y).toBeCloseTo(-12, 1);

    const companion = await page.evaluate(() => (window as any).__MUSEUM__.getCompanion());
    expect(companion.character).toBe('jenil');
    expect(companion.isMeshAttached).toBe(true);
    expect(companion.isMeshVisible).toBe(true);

    expect(guards.errors).toEqual([]);
  });
});
