import { test, expect } from '@playwright/test';
import { setupPageGuards, waitForMuseumReady } from './helpers.js';

test.describe('E-05: Full Walk Navigation & Collision Safety', () => {
  test('player walks from Entry to all gallery wings and exits without getting stuck or clipping', async ({ page }) => {
    test.setTimeout(180000);
    const guards = setupPageGuards(page);

    await page.goto('/?test=1&autoSelect=1');
    await waitForMuseumReady(page);
    await page.waitForFunction(() => (window as any).__MUSEUM__.getState() === 'EXPLORING');

    // Canonical walk route visiting foyer, left alcove, pillar, right alcove, and decision alcove
    const routeWaypoints: [number, number][] = [
      [-0.8, -12], // Entry spawn
      [-0.8, -5.5], // Foyer opening
      [-7, -5.5],   // South-west hall
      [-13, 0],     // Left Alcove (P4/P5)
      [-6, 0],      // West of pillar (P3)
      [0, 6],       // North of pillar (P2)
      [6, 0],       // East of pillar (P1)
      [7, 3],       // Entrance to Right Alcove
      [13, 3],      // Right Alcove (P6/P7)
      [7, 3],       // Exit Right Alcove
      [6, 7],       // North-east hall (P8)
      [0, 7],       // Hall entrance to decision alcove
      [0, 12.5]     // Decision alcove center
    ];

    const result = await page.evaluate(async (pts) => {
      return await (window as any).__MUSEUM__.walkRoute(pts, { run: true, timeoutMs: 110000 });
    }, routeWaypoints);

    expect(result.stuck).toBe(false);
    expect(result.reached).toBe(true);
    expect(result.trail.length).toBeGreaterThan(10);

    expect(guards.errors).toEqual([]);
  });
});
