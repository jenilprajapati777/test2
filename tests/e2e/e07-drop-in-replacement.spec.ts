import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setupPageGuards, waitForMuseumReady } from './helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');

test.describe('E-07: Drop-in Media Replacement', () => {
  test('dropping P1.png into assets/photos is automatically picked up over SVG, then cleanly restored', async ({ page }) => {
    const guards = setupPageGuards(page);
    const publicPhotoPath = path.join(rootDir, 'public', 'assets', 'photos', 'P1.png');
    const distPhotoPath = path.join(rootDir, 'dist', 'assets', 'photos', 'P1.png');

    try {
      // 1. Create a dummy PNG for P1 (1x1 PNG base64)
      const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPjfDwAEeQHzG/4G6AAAAABJRU5ErkJggg==';
      const buf = Buffer.from(pngBase64, 'base64');
      fs.writeFileSync(publicPhotoPath, buf);
      if (fs.existsSync(path.dirname(distPhotoPath))) {
        fs.writeFileSync(distPhotoPath, buf);
      }

      // 2. Open app and verify P1 is resolved as 'file'
      await page.goto('/?test=1&autoSelect=1');
      await waitForMuseumReady(page);
      await page.waitForFunction(() => (window as any).__MUSEUM__.getState() === 'EXPLORING');

      // Stand in front of P1 and interact
      await page.evaluate(() => (window as any).__MUSEUM__.teleport(4.5, 0, 270));
      await page.waitForTimeout(200);

      const slotInfo = await page.evaluate(() => (window as any).__MUSEUM__.getSlotInfo('P1'));
      expect(slotInfo.kind).toBe('file');
      expect(slotInfo.source).toContain('P1.png');

    } finally {
      // 3. Remove the temporary test files
      if (fs.existsSync(publicPhotoPath)) {
        fs.unlinkSync(publicPhotoPath);
      }
      if (fs.existsSync(distPhotoPath)) {
        fs.unlinkSync(distPhotoPath);
      }
    }

    // 4. Reload page and verify it cleanly falls back to P1.svg
    await page.goto('/?test=1&autoSelect=1');
    await waitForMuseumReady(page);
    await page.waitForFunction(() => (window as any).__MUSEUM__.getState() === 'EXPLORING');

    const fallbackInfo = await page.evaluate(() => (window as any).__MUSEUM__.getSlotInfo('P1'));
    expect(fallbackInfo.kind).toBe('placeholder');
    expect(fallbackInfo.source).toContain('P1.svg');

    expect(guards.errors).toEqual([]);
  });
});
