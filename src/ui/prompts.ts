import { SLOTS, Slot, INTERACTION_RADIUS, INTERACTION_FOV_RAD } from '../config/layout.js';

export class InteractionPrompts {
  public container: HTMLElement;
  private currentSlot: Slot | null = null;
  private onInteractCallback: (slot: Slot) => void;

  constructor(onInteract: (slot: Slot) => void) {
    this.onInteractCallback = onInteract;
    this.container = document.createElement('div');
    this.container.id = 'interact-prompt';
    this.container.className = 'interact-prompt';
    this.container.style.display = 'none';

    this.container.innerHTML = `
      <span class="key-badge">E</span>
      <span class="prompt-text">Inspect</span>
    `;

    this.container.addEventListener('click', () => {
      if (this.currentSlot) {
        this.onInteractCallback(this.currentSlot);
      }
    });

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (e) => {
        if (e.code === 'KeyE' && this.currentSlot) {
          this.onInteractCallback(this.currentSlot);
        }
      });
    }
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  public getCurrentSlotId(): string | null {
    return this.currentSlot ? this.currentSlot.id : null;
  }

  public triggerInteract(): void {
    if (this.currentSlot) {
      this.onInteractCallback(this.currentSlot);
    }
  }

  /**
   * Updates prompt visibility based on player proximity (< 2.8m) and facing angle (+/- 70 deg).
   */
  public update(playerX: number, playerY: number, playerYawRad: number, cameraYawRad: number): void {
    let closestSlot: Slot | null = null;
    let closestDist = Infinity;

    // Player forward direction in plan view:
    const fwdX = Math.sin(playerYawRad);
    const fwdY = Math.cos(playerYawRad);
    // Camera forward direction in plan view:
    const camFwdX = Math.sin(cameraYawRad);
    const camFwdY = Math.cos(cameraYawRad);

    for (const slot of SLOTS) {
      if (slot.type === 'exit sign') continue;

      const [sx, sy] = slot.pos;
      const dx = sx - playerX;
      const dy = sy - playerY;
      const dist = Math.hypot(dx, dy);

      if (dist <= INTERACTION_RADIUS && dist < closestDist) {
        // Normal vector pointing from slot into room:
        // When facing item, player forward should roughly oppose slot normal (dot < 0)
        // Or vector from player to slot should align with player/camera forward:
        const dirToSlotX = dx / dist;
        const dirToSlotY = dy / dist;

        const playerDot = fwdX * dirToSlotX + fwdY * dirToSlotY;
        const cameraDot = camFwdX * dirToSlotX + camFwdY * dirToSlotY;

        // Slot must be within +/- 70 deg of player's facing or camera's direction:
        const cosFov = Math.cos(INTERACTION_FOV_RAD);
        if (playerDot >= cosFov || cameraDot >= cosFov) {
          closestDist = dist;
          closestSlot = slot;
        }
      }
    }

    if (closestSlot) {
      this.currentSlot = closestSlot;
      const textSpan = this.container.querySelector('.prompt-text') as HTMLElement;
      if (textSpan) {
        textSpan.textContent = `Inspect ${closestSlot.id}`;
      }
      this.container.style.display = 'flex';
    } else {
      this.currentSlot = null;
      this.container.style.display = 'none';
    }
  }
}
