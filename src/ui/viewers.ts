import { Slot } from '../config/layout.js';
import { ContentSchema } from '../config/content.js';
import { MediaResolver } from '../media/mediaResolver.js';
import { VideoManager } from '../media/videoManager.js';

export class ViewersModal {
  public container: HTMLElement;
  private content: ContentSchema;
  private mediaResolver: MediaResolver;
  private videoManager: VideoManager;
  private currentSlot: Slot | null = null;
  private onCloseCallback: () => void;

  constructor(
    content: ContentSchema,
    mediaResolver: MediaResolver,
    videoManager: VideoManager,
    onClose: () => void
  ) {
    this.content = content;
    this.mediaResolver = mediaResolver;
    this.videoManager = videoManager;
    this.onCloseCallback = onClose;

    this.container = document.createElement('div');
    this.container.id = 'media-viewer-modal';
    this.container.className = 'viewer-modal';
    this.container.style.display = 'none';

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen()) {
          this.close();
        }
      });
    }

    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) {
        this.close();
      }
    });
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  public isOpen(): boolean {
    return this.container.style.display === 'flex';
  }

  public getCurrentSlot(): Slot | null {
    return this.currentSlot;
  }

  public close(): void {
    if (this.currentSlot?.type === 'video') {
      this.videoManager.closeViewer(this.currentSlot.id);
    }
    this.currentSlot = null;
    this.container.style.display = 'none';
    this.container.innerHTML = '';
    this.onCloseCallback();
  }

  public async open(slot: Slot): Promise<void> {
    this.currentSlot = slot;
    this.container.innerHTML = '';

    if (slot.type === 'photo') {
      await this.renderPhotoLightbox(slot);
    } else if (slot.type === 'video') {
      await this.renderVideoViewer(slot);
    } else if (slot.type === 'board') {
      this.renderBoardCard(slot);
    } else if (slot.type === 'title plaque') {
      this.renderPlaqueCard();
    }

    this.container.style.display = 'flex';
  }

  private async renderPhotoLightbox(slot: Slot): Promise<void> {
    const caption = this.content.photos[slot.id]?.caption || `Photo ${slot.id}`;
    const info = await this.mediaResolver.resolvePhoto(slot.id);

    this.container.innerHTML = `
      <div class="viewer-card" id="lightbox-card">
        <button class="close-btn" id="viewer-close-btn" aria-label="Close">✕</button>
        <div class="viewer-media-container">
          <img src="${info.source}" alt="${caption}" class="lightbox-img" id="lightbox-img" />
        </div>
        <div class="viewer-footer">
          <h3 class="viewer-caption">${caption}</h3>
          <span class="viewer-slot-badge">${slot.id} &bull; Photo Gallery</span>
        </div>
      </div>
    `;

    this.container.querySelector('#viewer-close-btn')?.addEventListener('click', () => this.close());
  }

  private async renderVideoViewer(slot: Slot): Promise<void> {
    const caption = this.content.videos[slot.id]?.caption || `Video ${slot.id}`;
    const videoEl = this.videoManager.openViewer(slot.id);

    this.container.innerHTML = `
      <div class="viewer-card" id="video-card">
        <button class="close-btn" id="viewer-close-btn" aria-label="Close">✕</button>
        <div class="viewer-media-container" id="video-container">
        </div>
        <div class="viewer-footer">
          <h3 class="viewer-caption">${caption}</h3>
          <span class="viewer-slot-badge">${slot.id} &bull; Video Screen</span>
        </div>
      </div>
    `;

    const vidContainer = this.container.querySelector('#video-container') as HTMLElement;
    if (videoEl) {
      videoEl.className = 'video-element';
      videoEl.controls = true;
      videoEl.muted = false;
      vidContainer.appendChild(videoEl);
    } else {
      vidContainer.innerHTML = `
        <div style="padding: 3rem; text-align: center; color: #f7df96;">
          <h2>${slot.id} Video Screen</h2>
          <p style="margin-top: 1rem; color: #a8a29e;">Drop ${slot.id}.mp4 into assets/videos to play your video.</p>
        </div>
      `;
    }

    this.container.querySelector('#viewer-close-btn')?.addEventListener('click', () => this.close());
  }

  private renderBoardCard(slot: Slot): void {
    const text = this.content.boards[slot.id] || `Dummy text for ${slot.id} - edit me later.`;

    this.container.innerHTML = `
      <div class="viewer-card board-card-content" id="board-card">
        <button class="close-btn" id="viewer-close-btn" aria-label="Close">✕</button>
        <div style="margin-bottom: 1.5rem; color: #d4af37; font-size: 1.1rem; font-weight: 600;">
          — Board ${slot.id} —
        </div>
        <p class="board-card-text">"${text}"</p>
      </div>
    `;

    this.container.querySelector('#viewer-close-btn')?.addEventListener('click', () => this.close());
  }

  private renderPlaqueCard(): void {
    const plaqueText = this.content.meta.plaque;

    this.container.innerHTML = `
      <div class="viewer-card board-card-content" id="plaque-card">
        <button class="close-btn" id="viewer-close-btn" aria-label="Close">✕</button>
        <div style="margin-bottom: 1.5rem; color: #d4af37; font-size: 1.1rem; font-weight: 600;">
          — Museum Title Plaque —
        </div>
        <p class="board-card-text">${plaqueText}</p>
        <p style="font-size: 0.9rem; color: #a8a29e;">${this.content.meta.credit}</p>
      </div>
    `;

    this.container.querySelector('#viewer-close-btn')?.addEventListener('click', () => this.close());
  }
}
