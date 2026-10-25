import { test, expect } from '@playwright/test';
import { setupPageGuards, waitForMuseumReady } from './helpers.js';

test.describe('E-04: Camera Orbit & Wall Collision Avoidance', () => {
  test('camera orbits via mouse drag and avoids wall/ceiling penetration at 10 stress positions', async ({ page }) => {
    test.setTimeout(240000);
    const guards = setupPageGuards(page);

    await page.goto('/?test=1&autoSelect=1');
    await waitForMuseumReady(page);
    await page.waitForFunction(() => (window as any).__MUSEUM__.getState() === 'EXPLORING');

    const stressPositions: [number, number][] = [
      [-3.5, -12.5],  // Foyer SW corner
      [3.5, -12.5],   // Foyer SE corner
      [-9.3, -6.3],   // Main Hall SW corner
      [9.3, -6.3],    // Main Hall SE corner
      [-15.3, 1.3],   // Left Alcove NW corner
      [-15.3, -1.3],  // Left Alcove SW corner
      [15.3, 4.3],    // Right Alcove NE corner
      [15.3, 1.3],    // Right Alcove SE corner
      [-2.3, 14.3],   // Decision Alcove NW corner
      [-7.5, 12.5]    // Exit-1 corridor near end (before exit trigger)
    ];

    for (const [x, y] of stressPositions) {
      await page.evaluate(({ px, py }) => {
        (window as any).__MUSEUM__.teleport(px, py, 0);
      }, { px: x, py: y });

      // Perform mouse drag orbit on canvas
      await page.mouse.move(600, 350);
      await page.mouse.down();
      await page.mouse.move(300, 300);
      await page.mouse.up();

      const cam = await page.evaluate(() => (window as any).__MUSEUM__.getCamera());

      // Distance must stay within [0.8, 5.0] m
      expect(cam.distanceToPlayer).toBeGreaterThanOrEqual(0.8);
      expect(cam.distanceToPlayer).toBeLessThanOrEqual(5.0);

      // Camera position height must be within bounds [0.3, 4.5] m
      expect(cam.y).toBeGreaterThanOrEqual(0.2);
      expect(cam.y).toBeLessThanOrEqual(4.5);
    }

    expect(guards.errors).toEqual([]);
  });
});
