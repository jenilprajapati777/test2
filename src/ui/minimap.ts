import { ROOMS, OBSTACLES, SLOTS } from '../config/layout.js';

export class Minimap {
  public container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private isExpanded = false;

  // Plan coordinate bounds: x in [-17, 17], y in [-14, 16]
  private readonly minX = -17;
  private readonly maxX = 17;
  private readonly minY = -14;
  private readonly maxY = 16;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'minimap-wrapper';
    this.container.id = 'hud-minimap';

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'minimap-canvas';
    this.canvas.width = 240;
    this.canvas.height = 240;
    this.ctx = this.canvas.getContext('2d')!;

    this.container.appendChild(this.canvas);

    this.container.addEventListener('click', () => {
      this.toggleExpand();
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          e.preventDefault();
          this.toggleExpand();
        }
      });
    }
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  public toggleExpand(): void {
    this.isExpanded = !this.isExpanded;
    if (this.isExpanded) {
      this.container.style.width = '320px';
      this.container.style.height = '320px';
      this.canvas.width = 400;
      this.canvas.height = 400;
    } else {
      this.container.style.width = '130px';
      this.container.style.height = '130px';
      this.canvas.width = 240;
      this.canvas.height = 240;
    }
  }

  public update(
    playerX: number,
    playerY: number,
    playerYawRad: number,
    companionX: number,
    companionY: number,
    viewedSlots: Set<string>
  ): void {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, w, h);

    // Map plan coords (x, y) to canvas (cx, cy)
    // Note: in plan, +y is North (up on map), so cy = h - normalizedY
    const toCanvasX = (px: number) => ((px - this.minX) / (this.maxX - this.minX)) * w;
    const toCanvasY = (py: number) => h - ((py - this.minY) / (this.maxY - this.minY)) * h;

    // 1. Draw rooms
    ctx.fillStyle = '#221d19';
    ctx.strokeStyle = '#5c4832';
    ctx.lineWidth = 2;

    for (const r of ROOMS) {
      const x1 = toCanvasX(r.xMin);
      const x2 = toCanvasX(r.xMax);
      const y1 = toCanvasY(r.yMax); // higher y is lower canvas Y
      const y2 = toCanvasY(r.yMin);
      ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    }

    // 2. Draw obstacles
    ctx.fillStyle = '#453b32';
    for (const obs of OBSTACLES) {
      if (obs.kind === 'aabb') {
        const x1 = toCanvasX(obs.xMin);
        const x2 = toCanvasX(obs.xMax);
        const y1 = toCanvasY(obs.yMax);
        const y2 = toCanvasY(obs.yMin);
        ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
      } else if (obs.kind === 'circle') {
        const cx = toCanvasX(obs.x);
        const cy = toCanvasY(obs.y);
        const cr = (obs.radius / (this.maxX - this.minX)) * w;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(2, cr), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3. Draw memory slot markers
    for (const slot of SLOTS) {
      if (slot.type === 'title plaque' || slot.type === 'exit sign') continue;

      const sx = toCanvasX(slot.pos[0]);
      const sy = toCanvasY(slot.pos[1]);
      const isViewed = viewedSlots.has(slot.id);

      ctx.fillStyle = isViewed ? '#4ade80' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(sx, sy, isViewed ? 4 : 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Draw companion dot
    const compCx = toCanvasX(companionX);
    const compCy = toCanvasY(companionY);
    ctx.fillStyle = '#60a5fa'; // Cool blue
    ctx.beginPath();
    ctx.arc(compCx, compCy, 5, 0, Math.PI * 2);
    ctx.fill();

    // 5. Draw player dot + heading cone
    const playCx = toCanvasX(playerX);
    const playCy = toCanvasY(playerY);

    // Direction cone
    const fwdAngle = -playerYawRad + Math.PI / 2; // canvas angle
    ctx.fillStyle = 'rgba(247, 223, 150, 0.35)';
    ctx.beginPath();
    ctx.moveTo(playCx, playCy);
    ctx.arc(playCx, playCy, 16, fwdAngle - 0.45, fwdAngle + 0.45);
    ctx.closePath();
    ctx.fill();

    // Player dot
    ctx.fillStyle = '#f7df96'; // Warm gold
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(playCx, playCy, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}
