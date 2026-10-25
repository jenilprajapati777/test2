import { SETTINGS } from '../config/settings.js';
import { CollisionWorld } from '../physics/collisionWorld.js';
import { CharacterModel } from './characterFactory.js';

export class Companion {
  public planX: number;
  public planY: number;
  public yawRad: number;
  public speed = 0;

  private model: CharacterModel;
  private collisionWorld: CollisionWorld;

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
  }

  public setModel(newModel: CharacterModel): void {
    this.model = newModel;
    this.syncMeshPosition();
  }

  public getModel(): CharacterModel {
    return this.model;
  }

  public teleport(x: number, y: number, yawDeg?: number): void {
    this.planX = x;
    this.planY = y;
    if (yawDeg !== undefined) {
      this.yawRad = (yawDeg * Math.PI) / 180;
    }
    this.speed = 0;
    this.syncMeshPosition();
  }

  public update(dt: number, playerX: number, playerY: number, playerYawRad: number, playerSpeed: number): void {
    // 1. Check distance to player. Teleport if > 12m
    const distToPlayer = Math.hypot(playerX - this.planX, playerY - this.planY);
    if (distToPlayer > SETTINGS.companion.teleportDistance) {
      // Teleport beside player
      const rightX = Math.cos(playerYawRad);
      const rightY = -Math.sin(playerYawRad);
      this.teleport(playerX + rightX * 0.8, playerY + rightY * 0.8, (playerYawRad * 180) / Math.PI);
      return;
    }

    // 2. Compute target position behind player with side offset
    const fwdX = Math.sin(playerYawRad);
    const fwdY = Math.cos(playerYawRad);
    const rgtX = Math.cos(playerYawRad);
    const rgtY = -Math.sin(playerYawRad);

    const targetX = playerX - fwdX * SETTINGS.companion.followDistance + rgtX * SETTINGS.companion.sideOffset;
    const targetY = playerY - fwdY * SETTINGS.companion.followDistance + rgtY * SETTINGS.companion.sideOffset;

    const toTargetX = targetX - this.planX;
    const toTargetY = targetY - this.planY;
    const distToTarget = Math.hypot(toTargetX, toTargetY);

    // 3. Movement logic (target is already 1.8m behind player; companion idles when within 0.3m of target)
    if (distToTarget < 0.3) {
      // Idle when reached target offset
      this.speed = Math.max(0, this.speed - SETTINGS.player.deceleration * dt);
    } else {
      // Catch up with speed scaled by player speed
      const catchupFactor = distToTarget > 0.8 ? 1.25 : SETTINGS.companion.speedMultiplier;
      const maxCompanionSpeed = Math.max(
        SETTINGS.player.walkSpeed * 1.15,
        playerSpeed * catchupFactor
      );
      this.speed = Math.min(maxCompanionSpeed, this.speed + SETTINGS.player.acceleration * 1.5 * dt);

      const dirX = toTargetX / distToTarget;
      const dirY = toTargetY / distToTarget;

      const vx = dirX * this.speed;
      const vy = dirY * this.speed;

      const res = this.collisionWorld.moveCircle(
        this.planX,
        this.planY,
        vx,
        vy,
        dt,
        SETTINGS.player.radius
      );
      this.planX = res.x;
      this.planY = res.y;

      // Smooth turning towards movement
      const targetYaw = Math.atan2(dirX, dirY);
      let diff = targetYaw - this.yawRad;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;

      const maxTurn = SETTINGS.player.turnSpeed * dt;
      this.yawRad += Math.max(-maxTurn, Math.min(maxTurn, diff));
    }

    this.syncMeshPosition();
    this.model.animator.update(dt, this.speed, this.speed > SETTINGS.player.walkSpeed + 0.2);
  }

  private syncMeshPosition(): void {
    this.model.group.position.set(this.planX, 0, -this.planY);
    this.model.group.rotation.y = this.yawRad + Math.PI;
  }
}
