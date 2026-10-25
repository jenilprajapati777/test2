import { SLOTS } from '../config/layout.js';
import { MediaResolver } from './mediaResolver.js';

export interface VideoPlayerEntry {
  slotId: string;
  planPos: [number, number];
  videoEl: HTMLVideoElement | null;
  isPlaying: boolean;
  isViewerOpen: boolean;
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
        isPlaying: false,
        isViewerOpen: false
      });
    }

    if (v2Slot) {
      this.entries.set('V2', {
        slotId: 'V2',
        planPos: v2Slot.pos,
        videoEl: null,
        isPlaying: false,
        isViewerOpen: false
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
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = 'metadata';
        entry.videoEl = video;
      }
    }
  }

  public update(playerPlanX: number, playerPlanY: number): void {
    for (const entry of this.entries.values()) {
      if (!entry.videoEl || entry.isViewerOpen) continue;

      const dist = Math.hypot(playerPlanX - entry.planPos[0], playerPlanY - entry.planPos[1]);
      if (dist <= 7.0) {
        if (!entry.isPlaying) {
          entry.videoEl.muted = true;
          entry.videoEl.play().then(() => {
            entry.isPlaying = true;
          }).catch(() => {
            // Browser autoplay policy ignored gracefully
          });
        }
      } else {
        if (entry.isPlaying) {
          entry.videoEl.pause();
          entry.isPlaying = false;
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
    }
  }
}
