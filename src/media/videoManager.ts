import * as THREE from 'three';
import { SLOTS } from '../config/layout.js';
import { MediaResolver } from './mediaResolver.js';

export interface VideoPlayerEntry {
  slotId: string;
  planPos: [number, number];
  videoEl: HTMLVideoElement | null;
  texture: THREE.VideoTexture | null;
  isPlaying: boolean;
  isViewerOpen: boolean;
  onTextureReadyCbs: Array<(tex: THREE.VideoTexture) => void>;
}

export class VideoManager {
  private mediaResolver: MediaResolver;
  private entries = new Map<string, VideoPlayerEntry>();

  constructor(mediaResolver: MediaResolver) {
    this.mediaResolver = mediaResolver;

    const v1Slot = SLOTS.find(s => s.id === 'V1');
    const v2Slot = SLOTS.find(s => s.id === 'V2');

    if (v1Slot) {
      this.entries.set('V1', {
        slotId: 'V1',
        planPos: v1Slot.pos,
        videoEl: null,
        texture: null,
        isPlaying: false,
        isViewerOpen: false,
        onTextureReadyCbs: []
      });
    }

    if (v2Slot) {
      this.entries.set('V2', {
        slotId: 'V2',
        planPos: v2Slot.pos,
        videoEl: null,
        texture: null,
        isPlaying: false,
        isViewerOpen: false,
        onTextureReadyCbs: []
      });
    }

    this.initVideoElements();
  }

  private async initVideoElements(): Promise<void> {
    if (typeof document === 'undefined') return;

    for (const [id, entry] of this.entries) {
      const info = await this.mediaResolver.resolveVideo(id);
      if (info.kind === 'file') {
        const video = document.createElement('video');
        video.src = info.source;
        video.crossOrigin = 'anonymous';
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.autoplay = true;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.preload = 'auto';

        const texture = new THREE.VideoTexture(video);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;

        entry.videoEl = video;
        entry.texture = texture;

        // Start playing continuously in the museum
        const playContinuously = () => {
          video.muted = true;
          video.play().then(() => {
            entry.isPlaying = true;
          }).catch(() => {});
        };

        playContinuously();

        // Unlock autoplay on first user interaction if blocked by browser policy
        const unlock = () => {
          playContinuously();
          window.removeEventListener('click', unlock);
          window.removeEventListener('keydown', unlock);
          window.removeEventListener('touchstart', unlock);
          window.removeEventListener('pointerdown', unlock);
        };
        window.addEventListener('click', unlock, { passive: true });
        window.addEventListener('keydown', unlock, { passive: true });
        window.addEventListener('touchstart', unlock, { passive: true });
        window.addEventListener('pointerdown', unlock, { passive: true });

        // Notify waiting listeners
        for (const cb of entry.onTextureReadyCbs) {
          cb(texture);
        }
        entry.onTextureReadyCbs = [];
      }
    }
  }

  public getVideoTexture(slotId: string): THREE.VideoTexture | null {
    return this.entries.get(slotId)?.texture || null;
  }

  public onTextureReady(slotId: string, cb: (tex: THREE.VideoTexture) => void): void {
    const entry = this.entries.get(slotId);
    if (!entry) return;
    if (entry.texture) {
      cb(entry.texture);
    } else {
      entry.onTextureReadyCbs.push(cb);
    }
  }

  private frameCount = 0;

  public update(playerPlanX: number, playerPlanY: number): void {
    this.frameCount++;
    for (const entry of this.entries.values()) {
      if (!entry.videoEl) continue;

      // Keep playing continuously across the entire museum
      if (entry.videoEl.paused && !entry.isViewerOpen) {
        entry.videoEl.muted = true;
        entry.videoEl.play().catch(() => {});
      }

      if (entry.texture && entry.videoEl.readyState >= entry.videoEl.HAVE_CURRENT_DATA) {
        const dx = entry.planPos[0] - playerPlanX;
        const dy = entry.planPos[1] - playerPlanY;
        const distSq = dx * dx + dy * dy;

        // Adaptive update frequency based on distance to player
        if (distSq < 12 * 12) {
          entry.texture.needsUpdate = true;
        } else if (distSq < 22 * 22) {
          if (this.frameCount % 2 === 0) entry.texture.needsUpdate = true;
        } else {
          if (this.frameCount % 6 === 0) entry.texture.needsUpdate = true;
        }
      }
    }
  }

  public openViewer(slotId: string): HTMLVideoElement | null {
    const entry = this.entries.get(slotId);
    if (!entry) return null;

    entry.isViewerOpen = true;
    if (entry.videoEl) {
      entry.videoEl.muted = false;
      entry.videoEl.play().catch(() => {});
      return entry.videoEl;
    }
    return null;
  }

  public closeViewer(slotId: string): void {
    const entry = this.entries.get(slotId);
    if (!entry) return;

    entry.isViewerOpen = false;
    if (entry.videoEl) {
      entry.videoEl.muted = true;
      entry.videoEl.play().catch(() => {});
    }
  }
}
