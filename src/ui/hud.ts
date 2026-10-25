import { Minimap } from './minimap.js';

export interface HudOptions {
  onToggleMute: () => void;
}

export class MuseumHUD {
  public container: HTMLElement;
  public minimap: Minimap;
  private memoryBadge: HTMLElement;
  private muteBtn: HTMLButtonElement;
  private isMuted = false;

  constructor(options: HudOptions) {
    this.container = document.createElement('div');
    this.container.id = 'museum-hud';
    this.container.className = 'hud-container';

    // Top-left minimap
    const topLeft = document.createElement('div');
    topLeft.className = 'hud-top-left';
    this.minimap = new Minimap();
    topLeft.appendChild(this.minimap.getElement());
    this.container.appendChild(topLeft);

    // Top-right controls (Memories badge + Mute button)
    const topRight = document.createElement('div');
    topRight.className = 'hud-top-right';

    this.memoryBadge = document.createElement('div');
    this.memoryBadge.className = 'hud-badge';
    this.memoryBadge.id = 'memory-counter-badge';
    this.memoryBadge.textContent = 'Memories found: 0/15';
    topRight.appendChild(this.memoryBadge);

    this.muteBtn = document.createElement('button');
    this.muteBtn.className = 'hud-icon-btn';
    this.muteBtn.id = 'btn-toggle-mute';
    this.muteBtn.setAttribute('aria-label', 'Toggle audio mute');
    this.muteBtn.textContent = '🔊';
    this.muteBtn.addEventListener('click', () => {
      this.isMuted = !this.isMuted;
      this.muteBtn.textContent = this.isMuted ? '🔇' : '🔊';
      options.onToggleMute();
    });
    topRight.appendChild(this.muteBtn);

    this.container.appendChild(topRight);

    // Bottom center control hints
    const bottomCenter = document.createElement('div');
    bottomCenter.className = 'hud-bottom-center';
    bottomCenter.innerHTML = `
      <div class="controls-hint">
        WASD to walk &bull; Shift to run &bull; Drag to look &bull; E to interact &bull; M to mute &bull; Tab for map
      </div>
    `;
    this.container.appendChild(bottomCenter);

    // Keyboard shortcut M for mute
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (e) => {
        if (e.code === 'KeyM') {
          this.muteBtn.click();
        }
      });
    }
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  public updateMemoryCount(count: number, total = 15): void {
    this.memoryBadge.textContent = `Memories found: ${count}/${total}`;
  }
}
