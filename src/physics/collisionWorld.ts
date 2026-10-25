import { OBSTACLES, Obstacle, ROOMS } from '../config/layout.js';
import { extractWallSegments, WallSegment } from '../world/wallsFromRooms.js';

export interface CollisionResult {
  x: number;
  y: number;
  collided: boolean;
  slideX: number;
  slideY: number;
}

export class CollisionWorld {
  public wallSegments: WallSegment[];
  public obstacles: Obstacle[];

  constructor(walls?: WallSegment[], obstacles?: Obstacle[]) {
    this.wallSegments = walls ?? extractWallSegments(ROOMS);
    this.obstacles = obstacles ?? OBSTACLES;
  }

  /**
   * Resolves a single circle position against all walls and obstacles.
   * Pushes the circle out of any penetrations.
   * Returns whether any collision was resolved and the collision normal.
   */
  public resolveCircle(
    x: number,
    y: number,
    radius: number
  ): { x: number; y: number; collided: boolean; normalX: number; normalY: number } {
    let currX = x;
    let currY = y;
    let anyCollided = false;
    let accumNx = 0;
    let accumNy = 0;

    // Up to 4 relaxation iterations to handle corners between multiple colliders
    for (let iter = 0; iter < 4; iter++) {
      let iterCollided = false;

      // 1. Check wall segments
      for (const seg of this.wallSegments) {
        const abx = seg.x2 - seg.x1;
        const aby = seg.y2 - seg.y1;
        const apx = currX - seg.x1;
        const apy = currY - seg.y1;
        const lenSq = abx * abx + aby * aby;
        let t = 0;
        if (lenSq > 0) {
          t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / lenSq));
        }
        const cx = seg.x1 + t * abx;
        const cy = seg.y1 + t * aby;
        const dx = currX - cx;
        const dy = currY - cy;
        const distSq = dx * dx + dy * dy;

        if (distSq < radius * radius) {
          const dist = Math.sqrt(distSq);
          iterCollided = true;
          anyCollided = true;
          let nx = seg.nx;
          let ny = seg.ny;

          if (dist > 1e-6) {
            nx = dx / dist;
            ny = dy / dist;
          }
          const pen = radius - dist;
          currX += nx * pen;
          currY += ny * pen;
          accumNx += nx;
          accumNy += ny;
        }
      }

      // 2. Check obstacles
      for (const obs of this.obstacles) {
        if (obs.kind === 'aabb') {
          // Circle vs AABB
          const nearestX = Math.max(obs.xMin, Math.min(obs.xMax, currX));
          const nearestY = Math.max(obs.yMin, Math.min(obs.yMax, currY));
          const dx = currX - nearestX;
          const dy = currY - nearestY;
          const distSq = dx * dx + dy * dy;

          if (distSq < radius * radius) {
            iterCollided = true;
            anyCollided = true;
            if (distSq > 1e-6) {
              const dist = Math.sqrt(distSq);
              const pen = radius - dist;
              const nx = dx / dist;
              const ny = dy / dist;
              currX += nx * pen;
              currY += ny * pen;
              accumNx += nx;
              accumNy += ny;
            } else {
              // Point is inside AABB: push out along nearest edge
              const leftDist = currX - obs.xMin;
              const rightDist = obs.xMax - currX;
              const bottomDist = currY - obs.yMin;
              const topDist = obs.yMax - currY;
              const minDist = Math.min(leftDist, rightDist, bottomDist, topDist);

              let nx = 0;
              let ny = 0;
              let pen = 0;

              if (minDist === leftDist) {
                nx = -1;
                pen = radius + leftDist;
              } else if (minDist === rightDist) {
                nx = 1;
                pen = radius + rightDist;
              } else if (minDist === bottomDist) {
                ny = -1;
                pen = radius + bottomDist;
              } else {
                ny = 1;
                pen = radius + topDist;
              }

              currX += nx * pen;
              currY += ny * pen;
              accumNx += nx;
              accumNy += ny;
            }
          }
        } else if (obs.kind === 'circle') {
          const dx = currX - obs.x;
          const dy = currY - obs.y;
          const distSq = dx * dx + dy * dy;
          const minSeparation = radius + obs.radius;

          if (distSq < minSeparation * minSeparation) {
            iterCollided = true;
            anyCollided = true;
            const dist = Math.sqrt(distSq);
            let nx = 1;
            let ny = 0;
            if (dist > 1e-6) {
              nx = dx / dist;
              ny = dy / dist;
            }
            const pen = minSeparation - dist;
            currX += nx * pen;
            currY += ny * pen;
            accumNx += nx;
            accumNy += ny;
          }
        }
      }

      if (!iterCollided) {
        break;
      }
    }

    const nLen = Math.hypot(accumNx, accumNy);
    return {
      x: currX,
      y: currY,
      collided: anyCollided,
      normalX: nLen > 1e-6 ? accumNx / nLen : 0,
      normalY: nLen > 1e-6 ? accumNy / nLen : 0
    };
  }

  /**
   * Moves a circle from (startX, startY) with desired velocity (vx, vy) over dt,
   * using sub-stepping <= 0.1 m and tangential sliding.
   */
  public moveCircle(
    startX: number,
    startY: number,
    vx: number,
    vy: number,
    dt: number,
    radius = 0.35
  ): CollisionResult {
    const totalDx = vx * dt;
    const totalDy = vy * dt;
    const totalDist = Math.hypot(totalDx, totalDy);

    if (totalDist < 1e-6) {
      const resolved = this.resolveCircle(startX, startY, radius);
      return {
        x: resolved.x,
        y: resolved.y,
        collided: resolved.collided,
        slideX: 0,
        slideY: 0
      };
    }

    const maxStep = 0.1;
    const steps = Math.max(1, Math.ceil(totalDist / maxStep));
    const subDt = dt / steps;

    let currX = startX;
    let currY = startY;
    let currVx = vx;
    let currVy = vy;
    let anyCollision = false;

    for (let step = 0; step < steps; step++) {
      let nextX = currX + currVx * subDt;
      let nextY = currY + currVy * subDt;

      const res = this.resolveCircle(nextX, nextY, radius);
      currX = res.x;
      currY = res.y;

      if (res.collided) {
        anyCollision = true;
        // Slide response: remove velocity component along normal
        const dot = currVx * res.normalX + currVy * res.normalY;
        if (dot < 0) {
          currVx -= dot * res.normalX;
          currVy -= dot * res.normalY;
        }
      }
    }

    return {
      x: currX,
      y: currY,
      collided: anyCollision,
      slideX: currVx,
      slideY: currVy
    };
  }

  /**
   * Raycast from (x1, y1) to (x2, y2) against wall segments and obstacle AABBs.
   * Returns the closest hit distance parameter t in [0, 1] or null.
   */
  public raycast(x1: number, y1: number, x2: number, y2: number): { hit: boolean; t: number; point: [number, number] } {
    const rdx = x2 - x1;
    const rdy = y2 - y1;
    let minT = 1.0;
    let hitAny = false;

    // Check wall segments
    for (const seg of this.wallSegments) {
      const sdx = seg.x2 - seg.x1;
      const sdy = seg.y2 - seg.y1;
      const denom = rdx * sdy - rdy * sdx;
      if (Math.abs(denom) < 1e-6) continue;

      const tRay = ((seg.x1 - x1) * sdy - (seg.y1 - y1) * sdx) / denom;
      const tSeg = ((seg.x1 - x1) * rdy - (seg.y1 - y1) * rdx) / denom;

      if (tRay >= 0 && tRay <= minT && tSeg >= 0 && tSeg <= 1) {
        minT = tRay;
        hitAny = true;
      }
    }

    // Check AABB obstacles
    for (const obs of this.obstacles) {
      if (obs.kind === 'aabb') {
        const tNearX = (obs.xMin - x1) / (rdx !== 0 ? rdx : 1e-9);
        const tFarX = (obs.xMax - x1) / (rdx !== 0 ? rdx : 1e-9);
        const tNearY = (obs.yMin - y1) / (rdy !== 0 ? rdy : 1e-9);
        const tFarY = (obs.yMax - y1) / (rdy !== 0 ? rdy : 1e-9);

        const tMinX = Math.min(tNearX, tFarX);
        const tMaxX = Math.max(tNearX, tFarX);
        const tMinY = Math.min(tNearY, tFarY);
        const tMaxY = Math.max(tNearY, tFarY);

        const tEnter = Math.max(tMinX, tMinY);
        const tExit = Math.min(tMaxX, tMaxY);

        if (tEnter <= tExit && tExit >= 0 && tEnter < minT) {
          if (tEnter >= 0) {
            minT = tEnter;
            hitAny = true;
          }
        }
      }
    }

    return {
      hit: hitAny,
      t: minT,
      point: [x1 + minT * rdx, y1 + minT * rdy]
    };
  }
}
