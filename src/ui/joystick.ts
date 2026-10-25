import { PlayerController } from '../characters/playerController.js';
import { RaycastCamera } from '../physics/raycastCamera.js';

export class MobileControls {
  public container: HTMLElement;
  private player: PlayerController;
  private camera: RaycastCamera;
  private onInteract: () => void;

  private joystickBase: HTMLElement | null = null;
  private joystickThumb: HTMLElement | null = null;
  private interactBtn: HTMLElement | null = null;

  private isDraggingJoystick = false;
  private joystickTouchId: number | null = null;
  private joystickCenter = { x: 0, y: 0 };
  private maxRadius = 45;

  private isDraggingCamera = false;
  private cameraTouchId: number | null = null;
  private lastTouchPos = { x: 0, y: 0 };

  constructor(player: PlayerController, camera: RaycastCamera, onInteract: () => void) {
    this.player = player;
    this.camera = camera;
    this.onInteract = onInteract;

    this.container = document.createElement('div');
    this.container.id = 'mobile-controls';
    this.container.className = 'mobile-controls';

    // Only show if touch is supported or mobile viewport
    this.render();
    this.setupTouchListeners();
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="joystick-zone" id="joystick-zone">
        <div class="joystick-base" id="joystick-base">
          <div class="joystick-thumb" id="joystick-thumb"></div>
        </div>
      </div>
      <button class="touch-interact-btn" id="touch-interact-btn" aria-label="Interact">
        E
      </button>
    `;

    this.joystickBase = this.container.querySelector('#joystick-base');
    this.joystickThumb = this.container.querySelector('#joystick-thumb');
    this.interactBtn = this.container.querySelector('#touch-interact-btn');

    this.interactBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onInteract();
    });
  }

  private setupTouchListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('touchstart', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const screenWidth = window.innerWidth;

        // Left half of screen: joystick
        if (touch.clientX < screenWidth * 0.45 && !this.isDraggingJoystick) {
          if (this.joystickBase) {
            const rect = this.joystickBase.getBoundingClientRect();
            this.joystickCenter = {
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2
            };
          }
          this.isDraggingJoystick = true;
          this.joystickTouchId = touch.identifier;
          this.updateJoystick(touch.clientX, touch.clientY);
        }
        // Right half of screen: camera orbit (excluding interact button)
        else if (touch.clientX >= screenWidth * 0.45 && !this.isDraggingCamera) {
          if (this.interactBtn && this.interactBtn.contains(e.target as Node)) {
            continue;
          }
          this.isDraggingCamera = true;
          this.cameraTouchId = touch.identifier;
          this.lastTouchPos = { x: touch.clientX, y: touch.clientY };
        }
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];

        if (this.isDraggingJoystick && touch.identifier === this.joystickTouchId) {
          this.updateJoystick(touch.clientX, touch.clientY);
        } else if (this.isDraggingCamera && touch.identifier === this.cameraTouchId) {
          const dx = touch.clientX - this.lastTouchPos.x;
          const dy = touch.clientY - this.lastTouchPos.y;
          this.lastTouchPos = { x: touch.clientX, y: touch.clientY };
          this.camera.handleOrbit(dx, dy);
        }
      }
    }, { passive: true });

    const endTouch = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];

        if (this.isDraggingJoystick && touch.identifier === this.joystickTouchId) {
          this.isDraggingJoystick = false;
          this.joystickTouchId = null;
          this.resetJoystick();
        } else if (this.isDraggingCamera && touch.identifier === this.cameraTouchId) {
          this.isDraggingCamera = false;
          this.cameraTouchId = null;
        }
      }
    };

    window.addEventListener('touchend', endTouch);
    window.addEventListener('touchcancel', endTouch);
  }

  private updateJoystick(clientX: number, clientY: number): void {
    const dx = clientX - this.joystickCenter.x;
    const dy = clientY - this.joystickCenter.y;
    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(this.maxRadius, dist);

    const angle = Math.atan2(dy, dx);
    const thumbX = Math.cos(angle) * clampedDist;
    const thumbY = Math.sin(angle) * clampedDist;

    if (this.joystickThumb) {
      this.joystickThumb.style.transform = `translate(${thumbX}px, ${thumbY}px)`;
    }

    // Normalized strength: 0 to 1
    const norm = clampedDist / this.maxRadius;
    const isEdge = norm > 0.82; // Push to edge triggers run

    // Map screen joystick: -dy is forward, +dx is right
    const forward = -dy / (dist || 1);
    const right = dx / (dist || 1);

    this.player.setVirtualKeys({
      w: forward > 0.35,
      s: forward < -0.35,
      d: right > 0.35,
      a: right < -0.35,
      shift: isEdge
    });
  }

  private resetJoystick(): void {
    if (this.joystickThumb) {
      this.joystickThumb.style.transform = 'translate(0px, 0px)';
    }
    this.player.setVirtualKeys({});
  }
}
