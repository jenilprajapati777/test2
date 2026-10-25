import { ROOMS, Room } from '../config/layout.js';

export interface WallSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  nx: number;
  ny: number;
}

/**
 * Checks whether 1m integer cell [ix, ix+1] x [iy, iy+1] is within the room union.
 */
export function isCellInside(ix: number, iy: number, rooms: Room[] = ROOMS): boolean {
  const cx = ix + 0.5;
  const cy = iy + 0.5;
  for (const r of rooms) {
    if (cx >= r.xMin && cx <= r.xMax && cy >= r.yMin && cy <= r.yMax) {
      return true;
    }
  }
  return false;
}

/**
 * Derives merged wall boundary segments from the room union.
 * All normals (nx, ny) point inward toward the walkable area.
 */
export function extractWallSegments(rooms: Room[] = ROOMS): WallSegment[] {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const r of rooms) {
    if (r.xMin < minX) minX = r.xMin;
    if (r.xMax > maxX) maxX = r.xMax;
    if (r.yMin < minY) minY = r.yMin;
    if (r.yMax > maxY) maxY = r.yMax;
  }

  // Unit edge lists
  // Horizontal edges: key is `${y}_${ny}`, list of ix
  const horizontalEdges = new Map<string, { y: number; ny: number; xs: number[] }>();
  // Vertical edges: key is `${x}_${nx}`, list of iy
  const verticalEdges = new Map<string, { x: number; nx: number; ys: number[] }>();

  for (let ix = minX - 1; ix <= maxX; ix++) {
    for (let iy = minY - 1; iy <= maxY; iy++) {
      const insideCurrent = isCellInside(ix, iy, rooms);

      // Check bottom edge (y = iy)
      const insideBelow = isCellInside(ix, iy - 1, rooms);
      if (insideCurrent && !insideBelow) {
        // Wall at y = iy, normal points +y (into cell)
        const key = `${iy}_1`;
        if (!horizontalEdges.has(key)) horizontalEdges.set(key, { y: iy, ny: 1, xs: [] });
        horizontalEdges.get(key)!.xs.push(ix);
      } else if (!insideCurrent && insideBelow) {
        // Wall at y = iy, normal points -y (into below cell)
        const key = `${iy}_-1`;
        if (!horizontalEdges.has(key)) horizontalEdges.set(key, { y: iy, ny: -1, xs: [] });
        horizontalEdges.get(key)!.xs.push(ix);
      }

      // Check left edge (x = ix)
      const insideLeft = isCellInside(ix - 1, iy, rooms);
      if (insideCurrent && !insideLeft) {
        // Wall at x = ix, normal points +x (into cell)
        const key = `${ix}_1`;
        if (!verticalEdges.has(key)) verticalEdges.set(key, { x: ix, nx: 1, ys: [] });
        verticalEdges.get(key)!.ys.push(iy);
      } else if (!insideCurrent && insideLeft) {
        // Wall at x = ix, normal points -x (into left cell)
        const key = `${ix}_-1`;
        if (!verticalEdges.has(key)) verticalEdges.set(key, { x: ix, nx: -1, ys: [] });
        verticalEdges.get(key)!.ys.push(iy);
      }
    }
  }

  const result: WallSegment[] = [];

  // Merge horizontal edges
  for (const { y, ny, xs } of horizontalEdges.values()) {
    xs.sort((a, b) => a - b);
    let startX = xs[0];
    let endX = xs[0] + 1;

    for (let i = 1; i < xs.length; i++) {
      if (xs[i] === endX) {
        endX = xs[i] + 1;
      } else {
        result.push({ x1: startX, y1: y, x2: endX, y2: y, nx: 0, ny });
        startX = xs[i];
        endX = xs[i] + 1;
      }
    }
    result.push({ x1: startX, y1: y, x2: endX, y2: y, nx: 0, ny });
  }

  // Merge vertical edges
  for (const { x, nx, ys } of verticalEdges.values()) {
    ys.sort((a, b) => a - b);
    let startY = ys[0];
    let endY = ys[0] + 1;

    for (let i = 1; i < ys.length; i++) {
      if (ys[i] === endY) {
        endY = ys[i] + 1;
      } else {
        result.push({ x1: x, y1: startY, x2: x, y2: endY, nx, ny: 0 });
        startY = ys[i];
        endY = ys[i] + 1;
      }
    }
    result.push({ x1: x, y1: startY, x2: x, y2: endY, nx, ny: 0 });
  }

  return result;
}
