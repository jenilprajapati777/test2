import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MediaResolver } from '../../src/media/mediaResolver.js';
import { validateContent } from '../../src/config/content.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');

describe('U-07: Media resolver fallback chains and error safety', () => {
  it('jpg beats svg, falls back to placeholder, and unknown/missing files never throw', async () => {
    // Simulated file system with P1.jpg and P2.png
    const mockFiles = new Set(['./assets/photos/P1.jpg', './assets/photos/P2.png']);
    const mockChecker = async (url: string) => mockFiles.has(url);

    const resolver = new MediaResolver(mockChecker);

    // P1 has .jpg -> returns file with .jpg
    const p1 = await resolver.resolvePhoto('P1');
    expect(p1.kind).toBe('file');
    expect(p1.source).toBe('./assets/photos/P1.jpg');

    // P2 has .png -> returns file with .png
    const p2 = await resolver.resolvePhoto('P2');
    expect(p2.kind).toBe('file');
    expect(p2.source).toBe('./assets/photos/P2.png');

    // P3 has nothing -> falls back to placeholder .svg
    const p3 = await resolver.resolvePhoto('P3');
    expect(p3.kind).toBe('placeholder');
    expect(p3.source).toBe('./assets/photos/P3.svg');

    // Unknown slot ID never throws
    const unknownSlot = await resolver.resolvePhoto('P99');
    expect(unknownSlot.kind).toBe('placeholder');
    expect(unknownSlot.source).toBe('./assets/photos/P99.svg');

    // Video slot fallback
    const v1 = await resolver.resolveVideo('V1');
    expect(v1.kind).toBe('placeholder');
  });
});

describe('U-09: content.json schema validation', () => {
  it('content.json has all entries, non-empty strings, and board lines <= 80 chars', () => {
    const contentPath = path.join(rootDir, 'public', 'content', 'content.json');
    expect(fs.existsSync(contentPath)).toBe(true);

    const rawJson = fs.readFileSync(contentPath, 'utf-8');
    const content = JSON.parse(rawJson);

    const result = validateContent(content);
    expect(result.valid, `Validation errors: ${result.errors.join(', ')}`).toBe(true);
    expect(result.errors.length).toBe(0);

    // Explicit checks for board character counts
    for (let i = 1; i <= 5; i++) {
      const bText = content.boards[`B${i}`];
      expect(typeof bText).toBe('string');
      expect(bText.length).toBeGreaterThan(0);
      expect(bText.length).toBeLessThanOrEqual(80);
    }

    // Verify raw wording fields exist
    expect(content.exits.exit1.originalText).toBeDefined();
    expect(content.exits.exit2.originalText).toBeDefined();
    expect(content.exits.exit1.originalResultText).toBeDefined();
    expect(content.exits.exit2.originalResultText).toBeDefined();
  });

  it('rejects invalid or oversized boards with informative errors', () => {
    const invalid = {
      meta: { title: 'Test' },
      photos: {},
      videos: {},
      boards: {
        B1: 'A'.repeat(120) // Oversized!
      }
    };

    const res = validateContent(invalid);
    expect(res.valid).toBe(false);
    expect(res.errors.some(e => e.includes('80 characters limit'))).toBe(true);
  });
});
