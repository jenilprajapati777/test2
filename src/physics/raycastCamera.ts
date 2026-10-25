import * as THREE from 'three';
import { SETTINGS } from '../config/settings.js';
import { CollisionWorld } from './collisionWorld.js';

export class RaycastCamera {
  public camera: THREE.PerspectiveCamera;
  public yaw = 0; // Horizontal orbit angle (radians), 0 = looking north (-z)
  public pitch = (SETTINGS.camera.defaultPitchDeg * Math.PI) / 180;
  public targetDistance: number = SETTINGS.camera.defaultDistance;
  public currentDistance: number = SETTINGS.camera.defaultDistance;

  private currentTarget = new THREE.Vector3();
  private collisionWorld: CollisionWorld;

  constructor(collisionWorld: CollisionWorld) {
    this.collisionWorld = collisionWorld;
    this.camera = new THREE.PerspectiveCamera(
      SETTINGS.camera.fovDesktop,
      window.innerWidth / window.innerHeight,
      SETTINGS.camera.near,
      SETTINGS.camera.far
    );
  }

  public setAspectRatio(aspect: number, isMobilePortrait = false): void {
    this.camera.fov = isMobilePortrait ? SETTINGS.camera.fovMobile : SETTINGS.camera.fovDesktop;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  public handleOrbit(deltaX: number, deltaY: number): void {
    const sens = SETTINGS.camera.orbitSensitivity;
    this.yaw += deltaX * sens;
    this.pitch += deltaY * sens;

    const minPitch = (SETTINGS.camera.minPitchDeg * Math.PI) / 180;
    const maxPitch = (SETTINGS.camera.maxPitchDeg * Math.PI) / 180;
    this.pitch = Math.max(minPitch, Math.min(maxPitch, this.pitch));
  }

  public handleZoom(deltaY: number): void {
    const zoomSpeed = 0.003;
    this.targetDistance = Math.max(
      2.0,
      Math.min(6.0, this.targetDistance + deltaY * zoomSpeed)
    );
  }

  public update(
    dt: number,
    playerPlanX: number,
    playerPlanY: number,
    onPlayerFade?: (opacity: number) => void
  ): void {
    // 1. Target is at player's chest
    const targetX = playerPlanX;
    const targetY = SETTINGS.camera.targetHeight;
    const targetZ = -playerPlanY;

    // Follow damping on target
    const dampAlpha = 1.0 - Math.exp(-SETTINGS.camera.dampingFactor * dt);
    this.currentTarget.x += (targetX - this.currentTarget.x) * dampAlpha;
    this.currentTarget.y += (targetY - this.currentTarget.y) * dampAlpha;
    this.currentTarget.z += (targetZ - this.currentTarget.z) * dampAlpha;

    // 2. Compute ideal camera position from yaw and pitch
    // Direction vector from target to camera:
    const cosPitch = Math.cos(this.pitch);
    const sinPitch = Math.sin(this.pitch);
    // At yaw 0 (facing north), camera is placed at +z
    // At yaw PI/2 (facing east), camera is placed at -x
    const dirX = -Math.sin(this.yaw) * cosPitch;
    const dirY = sinPitch;
    const dirZ = Math.cos(this.yaw) * cosPitch;

    // 3. Wall avoidance via 2D raycast in plan view + ceiling clamp
    const maxDist = this.targetDistance;
    const endPlanX = targetX + dirX * maxDist;
    const endPlanY = playerPlanY - dirZ * maxDist;

    let allowedDist = maxDist;
    const rayHit = this.collisionWorld.raycast(targetX, playerPlanY, endPlanX, endPlanY);

    if (rayHit.hit) {
      const hitDist = rayHit.t * maxDist;
      allowedDist = Math.max(SETTINGS.camera.minDistance, hitDist - SETTINGS.camera.wallBuffer);
    }

    // Ceiling check: clamp if camera height exceeds ceiling - 0.2m
    const ceilingMaxY = 4.3;
    if (this.currentTarget.y + dirY * allowedDist > ceilingMaxY) {
      if (dirY > 0) {
        const ceilingDist = (ceilingMaxY - this.currentTarget.y) / dirY;
        allowedDist = Math.max(SETTINGS.camera.minDistance, Math.min(allowedDist, ceilingDist));
      }
    }

    // Floor check: camera height >= 0.3m
    if (this.currentTarget.y + dirY * allowedDist < 0.3) {
      if (dirY < 0) {
        const floorDist = (0.3 - this.currentTarget.y) / dirY;
        allowedDist = Math.max(SETTINGS.camera.minDistance, Math.min(allowedDist, floorDist));
      }
    }

    // Smooth in, instant out for distance
    if (allowedDist < this.currentDistance) {
      this.currentDistance = allowedDist; // Instant pull-in when blocked by wall
    } else {
      this.currentDistance += (allowedDist - this.currentDistance) * dampAlpha;
    }

    // 4. Position camera and look at target
    this.camera.position.set(
      this.currentTarget.x + dirX * this.currentDistance,
      this.currentTarget.y + dirY * this.currentDistance,
      this.currentTarget.z + dirZ * this.currentDistance
    );
    this.camera.lookAt(this.currentTarget.x, this.currentTarget.y, this.currentTarget.z);

    // 5. Player fade when distance < 1.5 m
    if (onPlayerFade) {
      if (this.currentDistance < SETTINGS.camera.fadeDistance) {
        onPlayerFade(SETTINGS.camera.playerFadeOpacity);
      } else {
        onPlayerFade(1.0);
      }
    }
  }

  public snapTo(playerPlanX: number, playerPlanY: number, yawRad = 0): void {
    this.yaw = yawRad;
    this.pitch = (SETTINGS.camera.defaultPitchDeg * Math.PI) / 180;
    this.currentTarget.set(playerPlanX, SETTINGS.camera.targetHeight, -playerPlanY);
    this.currentDistance = SETTINGS.camera.defaultDistance;
    this.update(0.1, playerPlanX, playerPlanY);
  }
}
