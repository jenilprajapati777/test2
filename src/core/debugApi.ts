import { PlayerController, VirtualKeys } from '../characters/playerController.js';
import { Companion } from '../characters/companion.js';
import { RaycastCamera } from '../physics/raycastCamera.js';
import { GameStateMachine } from './stateMachine.js';
import { isInsideRooms } from '../config/layout.js';

export interface DebugApiContext {
  stateMachine: GameStateMachine;
  player: PlayerController;
  companion: Companion;
  camera: RaycastCamera;
  getNearbyInteractable: () => string | null;
  interact: () => void;
  closeViewer: () => void;
  getViewedSlots: () => string[];
  getSlotInfo: (id: string) => { kind: 'file' | 'placeholder'; source: string };
  getStats: () => { fps: number; drawCalls: number; triangles: number; memory: { geometries: number; textures: number } };
  getHellStats: () => { cameraY: number; particleCount: number; isActive: boolean };
  setTimeScale: (scale: number) => void;
}

export function registerDebugApi(ctx: DebugApiContext): void {
  if (typeof window === 'undefined') return;

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('test') !== '1') return;

  (window as any).__MUSEUM__ = {
    version: '1.0.0',

    getState(): string {
      return ctx.stateMachine.getState();
    },

    getPlayer() {
      return {
        x: Number(ctx.player.planX.toFixed(3)),
        y: Number(ctx.player.planY.toFixed(3)),
        yawDeg: Number((((ctx.player.yawRad * 180) / Math.PI) % 360).toFixed(1)),
        speed: Number(ctx.player.speed.toFixed(3)),
        character: ctx.player.getModel().id,
        isMeshAttached: ctx.player.getModel().group.parent !== null,
        isMeshVisible: ctx.player.getModel().group.visible,
        meshOpacity: ctx.player.getModel().materials[0]?.opacity ?? 1
      };
    },

    getCompanion() {
      return {
        x: Number(ctx.companion.planX.toFixed(3)),
        y: Number(ctx.companion.planY.toFixed(3)),
        character: ctx.companion.getModel().id,
        isMeshAttached: ctx.companion.getModel().group.parent !== null,
        isMeshVisible: ctx.companion.getModel().group.visible
      };
    },

    getCamera() {
      const pos = ctx.camera.camera.position;
      const planX = pos.x;
      const planY = -pos.z;
      // Camera is inside museum if its plan position is inside rooms and height is between 0 and 4.5
      const isInside = isInsideRooms(planX, planY) && pos.y >= 0 && pos.y <= 4.5;
      return {
        x: Number(pos.x.toFixed(3)),
        y: Number(pos.y.toFixed(3)),
        z: Number(pos.z.toFixed(3)),
        distanceToPlayer: Number(ctx.camera.currentDistance.toFixed(3)),
        inside: isInside
      };
    },

    teleport(x: number, y: number, yawDeg?: number) {
      ctx.player.teleport(x, y, yawDeg);
      ctx.companion.teleport(x + 0.8, y - 0.8, yawDeg);
      if (yawDeg !== undefined) {
        ctx.camera.snapTo(x, y, (yawDeg * Math.PI) / 180);
      } else {
        ctx.camera.snapTo(x, y);
      }
    },

    setCameraOrbit(yawRad: number, pitchRad: number, dist?: number) {
      ctx.camera.yaw = yawRad;
      ctx.camera.pitch = pitchRad;
      if (dist !== undefined) {
        ctx.camera.targetDistance = dist;
        ctx.camera.currentDistance = dist;
      }
    },

    setVirtualKeys(keys: VirtualKeys) {
      ctx.player.setVirtualKeys(keys);
    },

    /**
     * Steers the player through waypoints using virtual keys only.
     * Never bypasses collision.
     */
    walkRoute(
      pts: [number, number][],
      opts?: { run?: boolean; timeoutMs?: number }
    ): Promise<{ reached: boolean; stuck: boolean; trail: [number, number][] }> {
      return new Promise((resolve) => {
        const trail: [number, number][] = [];
        let waypointIdx = 0;
        let lastMoveX = ctx.player.planX;
        let lastMoveY = ctx.player.planY;
        let lastMoveTime = performance.now();
        const startTime = performance.now();
        const timeout = opts?.timeoutMs || 45000;
        const wantRun = opts?.run ?? false;

        const interval = setInterval(() => {
          const now = performance.now();
          const currX = ctx.player.planX;
          const currY = ctx.player.planY;
          trail.push([Number(currX.toFixed(2)), Number(currY.toFixed(2))]);

          // Timeout check
          if (now - startTime > timeout) {
            clearInterval(interval);
            ctx.player.setVirtualKeys({});
            resolve({ reached: false, stuck: false, trail });
            return;
          }

          // Stuck detection: check if moved < 0.05m over 1.5s
          const moved = Math.hypot(currX - lastMoveX, currY - lastMoveY);
          if (moved > 0.08) {
            lastMoveX = currX;
            lastMoveY = currY;
            lastMoveTime = now;
          } else if (now - lastMoveTime > 1500) {
            // Stuck!
            clearInterval(interval);
            ctx.player.setVirtualKeys({});
            resolve({ reached: false, stuck: true, trail });
            return;
          }

          if (waypointIdx >= pts.length) {
            // All waypoints reached!
            clearInterval(interval);
            ctx.player.setVirtualKeys({});
            resolve({ reached: true, stuck: false, trail });
            return;
          }

          const [tx, ty] = pts[waypointIdx];
          const dx = tx - currX;
          const dy = ty - currY;
          const dist = Math.hypot(dx, dy);

          // Check if reached or passed waypoint plane
          const toTargetX = tx - currX;
          const toTargetY = ty - currY;
          const movedX = currX - lastMoveX;
          const movedY = currY - lastMoveY;
          const passed = dist < 1.4 && (movedX * toTargetX + movedY * toTargetY) <= 0;

          if (dist < 0.95 || passed) {
            waypointIdx++;
            if (waypointIdx >= pts.length) {
              clearInterval(interval);
              ctx.player.setVirtualKeys({});
              resolve({ reached: true, stuck: false, trail });
              return;
            }
          }

          // Steer camera yaw to point towards target waypoint
          const targetAngle = Math.atan2(dx, dy); // 0 = north (+y), PI/2 = east (+x)
          ctx.camera.yaw = targetAngle;

          // Press W to move forward in the camera direction
          ctx.player.setVirtualKeys({
            w: true,
            shift: wantRun
          });
        }, 16);
      });
    },

    getNearbyInteractable(): string | null {
      return ctx.getNearbyInteractable();
    },

    interact(): void {
      ctx.interact();
    },

    closeViewer(): void {
      ctx.closeViewer();
    },

    getProgress(): { viewed: string[]; total: 15 } {
      return {
        viewed: ctx.getViewedSlots(),
        total: 15
      };
    },

    getSlotInfo(id: string): { kind: 'file' | 'placeholder'; source: string } {
      return ctx.getSlotInfo(id);
    },

    getStats() {
      return ctx.getStats();
    },

    hell: {
      getCameraY(): number {
        return ctx.getHellStats().cameraY;
      },
      getParticleCount(): number {
        return ctx.getHellStats().particleCount;
      },
      isActive(): boolean {
        return ctx.getHellStats().isActive;
      }
    },

    setTimeScale(scale: number): void {
      ctx.setTimeScale(scale);
    }
  };
}
