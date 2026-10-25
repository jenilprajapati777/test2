export interface SlotMediaInfo {
  kind: 'file' | 'placeholder';
  source: string;
}

export class MediaResolver {
  private cache = new Map<string, SlotMediaInfo>();
  private fileChecker?: (url: string) => Promise<boolean>;

  constructor(fileChecker?: (url: string) => Promise<boolean>) {
    this.fileChecker = fileChecker;
  }

  /**
   * Resolves a photo slot according to the fallback chain:
   * Pn.jpg -> Pn.jpeg -> Pn.png -> Pn.webp -> Pn.svg (placeholder)
   */
  public async resolvePhoto(slotId: string): Promise<SlotMediaInfo> {
    if (this.cache.has(slotId)) {
      return this.cache.get(slotId)!;
    }

    const extensions = ['jpg', 'jpeg', 'png', 'webp'];
    for (const ext of extensions) {
      const url = `./assets/photos/${slotId}.${ext}`;
      const exists = await this.checkFileExists(url);
      if (exists) {
        console.info(`[MediaResolver] Found user photo: ${url}`);
        const info: SlotMediaInfo = { kind: 'file', source: url };
        this.cache.set(slotId, info);
        return info;
      }
    }

    // Default SVG placeholder
    const placeholderUrl = `./assets/photos/${slotId}.svg`;
    const info: SlotMediaInfo = { kind: 'placeholder', source: placeholderUrl };
    this.cache.set(slotId, info);
    return info;
  }

  /**
   * Resolves a video slot according to fallback chain:
   * Vn.mp4 -> Vn.webm -> animated canvas placeholder
   */
  public async resolveVideo(slotId: string): Promise<SlotMediaInfo> {
    if (this.cache.has(slotId)) {
      return this.cache.get(slotId)!;
    }

    const extensions = ['mp4', 'webm'];
    for (const ext of extensions) {
      const url = `./assets/videos/${slotId}.${ext}`;
      const exists = await this.checkFileExists(url);
      if (exists) {
        console.info(`[MediaResolver] Found user video: ${url}`);
        const info: SlotMediaInfo = { kind: 'file', source: url };
        this.cache.set(slotId, info);
        return info;
      }
    }

    const info: SlotMediaInfo = { kind: 'placeholder', source: `placeholder://${slotId}` };
    this.cache.set(slotId, info);
    return info;
  }

  public getSlotInfo(slotId: string): SlotMediaInfo {
    return this.cache.get(slotId) || { kind: 'placeholder', source: `default://${slotId}` };
  }

  public invalidate(slotId?: string): void {
    if (slotId) {
      this.cache.delete(slotId);
    } else {
      this.cache.clear();
    }
  }

  private async checkFileExists(url: string): Promise<boolean> {
    if (this.fileChecker) {
      return this.fileChecker(url);
    }

    if (typeof fetch === 'undefined') {
      return false;
    }

    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (!res.ok) return false;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }
}
