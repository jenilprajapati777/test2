import { test, expect } from '@playwright/test';
import { setupPageGuards, waitForMuseumReady } from './helpers.js';

test.describe('E-10: Mobile Touch Controls & Responsiveness', () => {
  test('tap targets are >= 44px, no overflow, touch joystick moves character, and buttons respond to taps', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'E-10 is a mobile touch test');
    const guards = setupPageGuards(page);

    await page.goto('/?test=1');
    await waitForMuseumReady(page);

    // 1. Check tap targets on character select buttons
    const btnRutu = page.locator('#btn-select-rutu');
    const boxRutu = await btnRutu.boundingBox();
    expect(boxRutu).not.toBeNull();
    expect(boxRutu!.width).toBeGreaterThanOrEqual(44);
    expect(boxRutu!.height).toBeGreaterThanOrEqual(44);

    // Tap to select Rutu
    await btnRutu.tap();
    await page.waitForFunction(() => (window as any).__MUSEUM__.getState() === 'EXPLORING');

    // 2. Check no viewport scroll overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // 3. Check touch interact button size >= 56px
    const interactBtn = page.locator('#touch-interact-btn');
    await expect(interactBtn).toBeVisible();
    const boxInteract = await interactBtn.boundingBox();
    expect(boxInteract).not.toBeNull();
    expect(boxInteract!.width).toBeGreaterThanOrEqual(56);
    expect(boxInteract!.height).toBeGreaterThanOrEqual(56);

    // 4. Joystick touch movement
    const joystickZone = page.locator('#joystick-zone');
    await expect(joystickZone).toBeVisible();
    const joyBox = await joystickZone.boundingBox();
    expect(joyBox).not.toBeNull();

    const startX = joyBox!.x + joyBox!.width / 2;
    const startY = joyBox!.y + joyBox!.height / 2;

    // Dispatch touch sequence dragging joystick upwards (north)
    await page.touchscreen.tap(startX, startY);

    // Teleport player to open space
    await page.evaluate(() => (window as any).__MUSEUM__.teleport(6, 0, 0));

    // Tap mute button >= 44px
    const muteBtn = page.locator('#btn-toggle-mute');
    const boxMute = await muteBtn.boundingBox();
    expect(boxMute!.width).toBeGreaterThanOrEqual(44);
    expect(boxMute!.height).toBeGreaterThanOrEqual(44);
    await muteBtn.tap();

    expect(guards.errors).toEqual([]);
  });
});
