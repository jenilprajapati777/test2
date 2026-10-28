import { SETTINGS } from '../config/settings.js';
import { CollisionWorld } from '../physics/collisionWorld.js';
import { CharacterModel } from './characterFactory.js';

export interface VirtualKeys {
  w?: boolean;
  a?: boolean;
  s?: boolean;
  d?: boolean;
  shift?: boolean;
}

export class PlayerController {
  public planX: number;
  public planY: number;
  public yawRad: number;
  public speed = 0;
  public vx = 0;
  public vy = 0;
  public isRunning = false;

  private model: CharacterModel;
  private collisionWorld: CollisionWorld;
  private virtualKeys: VirtualKeys = {};
  private activeKeys = new Set<string>();

  constructor(
    model: CharacterModel,
    collisionWorld: CollisionWorld,
    startX: number,
    startY: number,
    startYawDeg = 0
  ) {
    this.model = model;
    this.collisionWorld = collisionWorld;
    this.planX = startX;
    this.planY = startY;
    this.yawRad = (startYawDeg * Math.PI) / 180;

    this.syncMeshPosition();
    this.setupKeyboardListeners();
  }

  public setModel(newModel: CharacterModel): void {
    this.model = newModel;
    this.syncMeshPosition();
  }

  public getModel(): CharacterModel {
    return this.model;
  }

  public setVirtualKeys(keys: VirtualKeys): void {
    this.virtualKeys = { ...keys };
  }

  public teleport(x: number, y: number, yawDeg?: number): void {
    this.planX = x;
    this.planY = y;
    if (yawDeg !== undefined) {
      this.yawRad = (yawDeg * Math.PI) / 180;
    }
    this.speed = 0;
    this.vx = 0;
    this.vy = 0;
    this.model.setOpacity(1.0);
    this.model.group.visible = true;
    this.syncMeshPosition();
  }

  private setupKeyboardListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('keydown', (e) => {
      this.activeKeys.add(e.code);
    });

    window.addEventListener('keyup', (e) => {
      this.activeKeys.delete(e.code);
    });
  }

  public update(dt: number, cameraYaw: number, inputEnabled = true): void {
    // 1. Gather raw inputs
    let inputForward = 0;
    let inputRight = 0;
    let wantRun = false;

    if (inputEnabled) {
      if (this.activeKeys.has('KeyW') || this.activeKeys.has('ArrowUp') || this.virtualKeys.w) {
        inputForward += 1;
      }
      if (this.activeKeys.has('KeyS') || this.activeKeys.has('ArrowDown') || this.virtualKeys.s) {
        inputForward -= 1;
      }
      if (this.activeKeys.has('KeyD') || this.activeKeys.has('ArrowRight') || this.virtualKeys.d) {
        inputRight += 1;
      }
      if (this.activeKeys.has('KeyA') || this.activeKeys.has('ArrowLeft') || this.virtualKeys.a) {
        inputRight -= 1;
      }
      if (this.activeKeys.has('ShiftLeft') || this.activeKeys.has('ShiftRight') || this.virtualKeys.shift) {
        wantRun = true;
      }
    }

    // 2. Map inputs relative to camera horizontal orientation
    // Forward unit vector in plan view:
    const fwdX = Math.sin(cameraYaw);
    const fwdY = Math.cos(cameraYaw);
    // Right unit vector in plan view:
    const rgtX = Math.cos(cameraYaw);
    const rgtY = -Math.sin(cameraYaw);

    let desiredDirX = fwdX * inputForward + rgtX * inputRight;
    let desiredDirY = fwdY * inputForward + rgtY * inputRight;
    const inputMag = Math.hypot(desiredDirX, desiredDirY);

    if (inputMag > 1e-4) {
      desiredDirX /= inputMag;
      desiredDirY /= inputMag;
    }

    // 3. Accelerate / decelerate speed
    const maxSpeed = wantRun ? SETTINGS.player.runSpeed : SETTINGS.player.walkSpeed;
    const targetSpeed = inputMag > 0 ? maxSpeed : 0;

    if (this.speed < targetSpeed) {
      this.speed = Math.min(targetSpeed, this.speed + SETTINGS.player.acceleration * dt);
    } else if (this.speed > targetSpeed) {
      this.speed = Math.max(targetSpeed, this.speed - SETTINGS.player.deceleration * dt);
    }

    this.isRunning = wantRun && this.speed > SETTINGS.player.walkSpeed + 0.2;

    if (this.speed > 0.001) {
      if (inputMag > 0) {
        this.vx = desiredDirX * this.speed;
        this.vy = desiredDirY * this.speed;
      } else {
        const currentSpeed = Math.hypot(this.vx, this.vy);
        if (currentSpeed > 1e-4) {
          this.vx = (this.vx / currentSpeed) * this.speed;
          this.vy = (this.vy / currentSpeed) * this.speed;
        } else {
          this.vx = 0;
          this.vy = 0;
          this.speed = 0;
        }
      }
    } else {
      this.speed = 0;
      this.vx = 0;
      this.vy = 0;
    }

    // 4. Collision resolution with sub-stepping & sliding
    if (this.speed > 0) {
      const colRes = this.collisionWorld.moveCircle(
        this.planX,
        this.planY,
        this.vx,
        this.vy,
        dt,
        SETTINGS.player.radius
      );
      this.planX = colRes.x;
      this.planY = colRes.y;
      this.vx = colRes.slideX;
      this.vy = colRes.slideY;
      this.speed = Math.hypot(this.vx, this.vy);
    }

    // 5. Turning: yaw eases toward movement velocity at 12 rad/s (no spinning when idle)
    if (this.speed > 0.15) {
      const targetYaw = Math.atan2(this.vx, this.vy);
      let diff = targetYaw - this.yawRad;
      // Normalize to [-PI, PI]
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;

      const maxTurn = SETTINGS.player.turnSpeed * dt;
      this.yawRad += Math.max(-maxTurn, Math.min(maxTurn, diff));
    }

    // 6. Update visual mesh position and animations
    this.syncMeshPosition();
    this.model.animator.update(dt, this.speed, this.isRunning);
  }

  private syncMeshPosition(): void {
    // Plan (x, y) -> Three.js (x, 0, -y)
    this.model.group.position.set(this.planX, 0, -this.planY);
    // In Three.js, rotation.y rotates around vertical axis; guarantee upright orientation
    this.model.group.rotation.set(0, this.yawRad + Math.PI, 0);
  }
}
