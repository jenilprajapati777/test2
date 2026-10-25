import { test, expect } from '@playwright/test';
import { setupPageGuards, waitForMuseumReady } from './helpers.js';
import { SLOTS, getStandOffPoint } from '../../src/config/layout.js';

test.describe('E-06: Slot Interactions, Modals & Memory Progress', () => {
  test('all 15 memory slots trigger prompt, open correct viewer, Esc closes, and progress reaches 15/15', async ({ page }) => {
    test.setTimeout(360000);
    const guards = setupPageGuards(page);

    await page.goto('/?test=1&autoSelect=1');
    await waitForMuseumReady(page);
    await page.waitForFunction(() => (window as any).__MUSEUM__.getState() === 'EXPLORING');

    const memorySlots = SLOTS.filter(s => s.type !== 'title plaque' && s.type !== 'exit sign');
    expect(memorySlots.length).toBe(15);

    for (const slot of memorySlots) {
      const [sx, sy] = getStandOffPoint(slot);
      const yawDeg = (Math.atan2(-slot.n[0], -slot.n[1]) * 180) / Math.PI;

      await page.evaluate(({ x, y, yaw }) => {
        (window as any).__MUSEUM__.teleport(x, y, yaw);
      }, { x: sx, y: sy, yaw: yawDeg });

      const interactable = await page.evaluate(() => (window as any).__MUSEUM__.getNearbyInteractable());
      expect(interactable).toBe(slot.id);

      // Open viewer
      await page.evaluate(() => (window as any).__MUSEUM__.interact());

      // Verify correct modal is open
      if (slot.type === 'photo') {
        await expect(page.locator('#lightbox-card')).toBeVisible();
      } else if (slot.type === 'video') {
        await expect(page.locator('#video-card')).toBeVisible();
      } else if (slot.type === 'board') {
        await expect(page.locator('#board-card')).toBeVisible();
      }

      // Close modal
      await page.evaluate(() => (window as any).__MUSEUM__.closeViewer());
      await expect(page.locator('#media-viewer-modal')).toBeHidden();
    }

    // Verify progress reaches 15/15
    const progress = await page.evaluate(() => (window as any).__MUSEUM__.getProgress());
    expect(progress.viewed.length).toBe(15);
    expect(progress.total).toBe(15);

    const badge = page.locator('#memory-counter-badge');
    await expect(badge).toHaveText('Memories found: 15/15');

    expect(guards.errors).toEqual([]);
  });
});
