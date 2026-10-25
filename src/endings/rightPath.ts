import { ContentSchema } from '../config/content.js';

export interface RightPathOptions {
  content: ContentSchema;
  onReplay: () => void;
}

export class RightPathEnding {
  public container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animId: number | null = null;
  private hearts: { x: number; y: number; size: number; speedY: number; speedX: number; opacity: number }[] = [];
  private options: RightPathOptions;

  constructor(options: RightPathOptions) {
    this.options = options;
    this.container = document.createElement('div');
    this.container.id = 'right-path-screen';
    this.container.className = 'ending-overlay';
    this.container.style.display = 'none';

    this.canvas = document.createElement('canvas');
    this.canvas.id = 'confetti-canvas';
    this.ctx = this.canvas.getContext('2d')!;
    this.container.appendChild(this.canvas);

    const card = document.createElement('div');
    card.className = 'ending-card';
    card.id = 'right-path-card';
    card.innerHTML = `
      <div style="font-size: 3.5rem; margin-bottom: 0.5rem;">✨ 💖 🏛️</div>
      <h1 class="ending-title">Congratulations!</h1>
      <p class="ending-text" id="right-path-result-text">${this.options.content.exits.exit1.resultText}</p>
      <button class="primary-btn" id="btn-replay-museum">${this.options.content.ui.replayLabel}</button>
    `;

    card.querySelector('#btn-replay-museum')?.addEventListener('click', () => {
      this.hide();
      this.options.onReplay();
    });

    this.container.appendChild(card);
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  public show(): void {
    this.container.style.display = 'flex';
    this.initHearts();
    this.startAnimation();
  }

  public hide(): void {
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    this.container.style.display = 'none';
  }

  private initHearts(): void {
    if (typeof window === 'undefined') return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    this.hearts = [];
    for (let i = 0; i < 40; i++) {
      this.hearts.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 18 + 12,
        speedY: -(Math.random() * 1.5 + 1.0),
        speedX: (Math.random() - 0.5) * 1.2,
        opacity: Math.random() * 0.7 + 0.3
      });
    }
  }

  private startAnimation(): void {
    const render = () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (const h of this.hearts) {
        h.y += h.speedY;
        h.x += h.speedX;
        if (h.y < -30) {
          h.y = this.canvas.height + 20;
          h.x = Math.random() * this.canvas.width;
        }

        this.ctx.font = `${h.size}px serif`;
        this.ctx.globalAlpha = h.opacity;
        this.ctx.fillText('❤️', h.x, h.y);
      }
      this.ctx.globalAlpha = 1.0;

      this.animId = requestAnimationFrame(render);
    };

    render();
  }
}
