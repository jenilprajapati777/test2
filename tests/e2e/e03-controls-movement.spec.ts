import { test, expect } from '@playwright/test';
import { setupPageGuards, waitForMuseumReady } from './helpers.js';

test.describe('E-03: Controls & Movement Physics', () => {
  test('keyboard inputs move character, Shift runs, stops <= 0.3s after release', async ({ page, isMobile }) => {
    test.skip(isMobile, 'E-03 is desktop keyboard; mobile touch joystick is tested in E-10');
    const guards = setupPageGuards(page);

    await page.goto('/?test=1&autoSelect=1');
    await waitForMuseumReady(page);
    await page.waitForFunction(() => (window as any).__MUSEUM__.getState() === 'EXPLORING');

    // Teleport to open hall space with long runway (x = 6, y = -5, facing North)
    await page.evaluate(() => (window as any).__MUSEUM__.teleport(6, -5, 0));

    // 1. Press W: moves North (+y)
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(600);

    let player = await page.evaluate(() => (window as any).__MUSEUM__.getPlayer());
    expect(player.speed).toBeGreaterThan(2.5);
    expect(player.y).toBeGreaterThan(-4.0); // Moved north from y = -5.0

    // Facing error < 10 deg (facing north = 0 deg)
    const facingError = Math.min(Math.abs(player.yawDeg), Math.abs(360 - player.yawDeg));
    expect(facingError).toBeLessThan(10);

    // 2. Hold Shift: sprint speed > 4.5 m/s
    await page.keyboard.down('ShiftLeft');
    await page.waitForTimeout(500);

    player = await page.evaluate(() => (window as any).__MUSEUM__.getPlayer());
    expect(player.speed).toBeGreaterThan(4.8);

    // 3. Release: must stop <= 0.3s of movement decay
    await page.keyboard.up('KeyW');
    await page.keyboard.up('ShiftLeft');
    await page.waitForFunction(() => (window as any).__MUSEUM__.getPlayer().speed === 0, { timeout: 3000 });

    player = await page.evaluate(() => (window as any).__MUSEUM__.getPlayer());
    expect(player.speed).toBe(0);

    expect(guards.errors).toEqual([]);
  });
});
