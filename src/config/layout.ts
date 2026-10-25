export interface Room {
  id: string;
  name: string;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export interface AABBObstacle {
  id: string;
  kind: 'aabb';
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  height?: number;
}

export interface CircleObstacle {
  id: string;
  kind: 'circle';
  x: number;
  y: number;
  radius: number;
}

export type Obstacle = AABBObstacle | CircleObstacle;

export type SlotType = 'photo' | 'video' | 'board' | 'title plaque' | 'exit sign';

export interface Slot {
  id: string;
  type: SlotType;
  wall: string;
  pos: [number, number];
  n: [number, number];
  elev: number;
  box: [number, number];
}

export interface ExitTrigger {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export const CEILING_HEIGHT = 4.5;
export const WALL_THICKNESS = 0.3;

export const ROOMS: Room[] = [
  { id: 'R1', name: 'Entry Foyer', xMin: -4, xMax: 4, yMin: -13, yMax: -7 },
  { id: 'R2', name: 'Main Hall', xMin: -10, xMax: 10, yMin: -7, yMax: 9 },
  { id: 'R3', name: 'Left Alcove', xMin: -16, xMax: -10, yMin: -2, yMax: 2 },
  { id: 'R4', name: 'Right Alcove', xMin: 10, xMax: 16, yMin: 1, yMax: 5 },
  { id: 'R5', name: 'Decision Alcove', xMin: -3, xMax: 3, yMin: 9, yMax: 15 },
  { id: 'R6', name: 'Exit-1 Corridor', xMin: -9, xMax: -3, yMin: 11, yMax: 14 },
  { id: 'R7', name: 'Exit-2 Corridor', xMin: 3, xMax: 9, yMin: 11, yMax: 14 }
];

export const OBSTACLES: Obstacle[] = [
  { id: 'pillar', kind: 'aabb', xMin: -3, xMax: 3, yMin: -2.5, yMax: 2.5, height: CEILING_HEIGHT },
  { id: 'bench_a', kind: 'aabb', xMin: 0.5, xMax: 3.5, yMin: 4.6, yMax: 5.2, height: 0.5 },
  { id: 'bench_b', kind: 'aabb', xMin: -5.9, xMax: -5.3, yMin: -1.5, yMax: 1.5, height: 0.5 },
  { id: 'plant_nw', kind: 'circle', x: -9, y: 8, radius: 0.4 },
  { id: 'plant_ne', kind: 'circle', x: 9, y: 8, radius: 0.4 },
  { id: 'plant_sw', kind: 'circle', x: -9, y: -6, radius: 0.4 },
  { id: 'plant_se', kind: 'circle', x: 9, y: -6, radius: 0.4 }
];

export const SLOTS: Slot[] = [
  { id: 'P1', type: 'photo', wall: 'Pillar east face', pos: [3, 0], n: [1, 0], elev: 1.7, box: [1.6, 1.2] },
  { id: 'P2', type: 'photo', wall: 'Pillar north face', pos: [0, 2.5], n: [0, 1], elev: 1.7, box: [1.6, 1.2] },
  { id: 'P3', type: 'photo', wall: 'Pillar west face', pos: [-3, 0], n: [-1, 0], elev: 1.7, box: [1.6, 1.2] },
  { id: 'T1', type: 'title plaque', wall: 'Pillar south face', pos: [0, -2.5], n: [0, -1], elev: 2.2, box: [3.0, 0.9] },
  { id: 'P4', type: 'photo', wall: 'Left alcove, north wall', pos: [-13, 2], n: [0, -1], elev: 1.7, box: [1.6, 1.2] },
  { id: 'P5', type: 'photo', wall: 'Left alcove, south wall', pos: [-13, -2], n: [0, 1], elev: 1.7, box: [1.6, 1.2] },
  { id: 'P6', type: 'photo', wall: 'Right alcove, north wall', pos: [13, 5], n: [0, -1], elev: 1.7, box: [1.6, 1.2] },
  { id: 'P7', type: 'photo', wall: 'Right alcove, south wall', pos: [13, 1], n: [0, 1], elev: 1.7, box: [1.6, 1.2] },
  { id: 'P8', type: 'photo', wall: 'Hall north wall, east half', pos: [6.5, 9], n: [0, -1], elev: 1.7, box: [1.6, 1.2] },
  { id: 'V1', type: 'video', wall: 'Decision alcove back wall', pos: [0, 15], n: [0, -1], elev: 2.1, box: [2.4, 1.35] },
  { id: 'V2', type: 'video', wall: 'Hall north wall, west half', pos: [-6.5, 9], n: [0, -1], elev: 2.1, box: [2.4, 1.35] },
  { id: 'B1', type: 'board', wall: 'Hall west wall, north part', pos: [-10, 6], n: [1, 0], elev: 1.9, box: [2.0, 0.9] },
  { id: 'B2', type: 'board', wall: 'Hall west wall, south part', pos: [-10, -4.5], n: [1, 0], elev: 1.9, box: [2.0, 0.9] },
  { id: 'B3', type: 'board', wall: 'Hall east wall, south part', pos: [10, -3.5], n: [-1, 0], elev: 1.9, box: [2.0, 0.9] },
  { id: 'B4', type: 'board', wall: 'Decision alcove west wall (south part)', pos: [-3, 10], n: [1, 0], elev: 1.9, box: [1.6, 0.9] },
  { id: 'B5', type: 'board', wall: 'Decision alcove east wall (south part)', pos: [3, 10], n: [-1, 0], elev: 1.9, box: [1.6, 0.9] },
  { id: 'S1', type: 'exit sign', wall: 'Above Exit-1 doorway (alcove west wall)', pos: [-3, 12.5], n: [1, 0], elev: 3.4, box: [3.0, 0.7] },
  { id: 'S2', type: 'exit sign', wall: 'Above Exit-2 doorway (alcove east wall)', pos: [3, 12.5], n: [-1, 0], elev: 3.4, box: [3.0, 0.7] }
];

export const PLAYER_SPAWN = { x: -0.8, y: -12, yawDeg: 0 };
export const COMPANION_SPAWN = { x: 0.8, y: -12.3 };

export const EXIT_1_TRIGGER: ExitTrigger = { xMin: -9, xMax: -8.4, yMin: 11, yMax: 14 };
export const EXIT_2_TRIGGER: ExitTrigger = { xMin: 8.4, xMax: 9, yMin: 11, yMax: 14 };

export const INTERACTION_RADIUS = 2.8;
export const INTERACTION_FOV_RAD = (70 * Math.PI) / 180;

/**
 * Returns stand-off point for a slot (pos + 1.5 * n)
 */
export function getStandOffPoint(slot: Slot): [number, number] {
  return [slot.pos[0] + 1.5 * slot.n[0], slot.pos[1] + 1.5 * slot.n[1]];
}

/**
 * Check if a point (x, y) is inside the rooms union
 */
export function isInsideRooms(x: number, y: number): boolean {
  for (const r of ROOMS) {
    if (x >= r.xMin && x <= r.xMax && y >= r.yMin && y <= r.yMax) {
      return true;
    }
  }
  return false;
}

/**
 * Check if a point or circle collides with any obstacle
 */
export function collidesWithObstacle(x: number, y: number, radius = 0): boolean {
  for (const obs of OBSTACLES) {
    if (obs.kind === 'aabb') {
      const minX = obs.xMin - radius;
      const maxX = obs.xMax + radius;
      const minY = obs.yMin - radius;
      const maxY = obs.yMax + radius;
      if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
        return true;
      }
    } else if (obs.kind === 'circle') {
      const dx = x - obs.x;
      const dy = y - obs.y;
      const distSq = dx * dx + dy * dy;
      const totalR = obs.radius + radius;
      if (distSq <= totalR * totalR) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Checks whether a circle of given radius at (x, y) is completely within the walkable museum space
 */
export function isWalkable(x: number, y: number, radius = 0.35): boolean {
  // Test centre and perimeter samples
  if (!isInsideRooms(x, y)) return false;
  if (collidesWithObstacle(x, y, radius)) return false;

  if (radius > 0) {
    // 8 perimeter check points to verify entire circle is within rooms
    const angles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI, (5 * Math.PI) / 4, (3 * Math.PI) / 2, (7 * Math.PI) / 4];
    for (const a of angles) {
      const px = x + radius * Math.cos(a);
      const py = y + radius * Math.sin(a);
      if (!isInsideRooms(px, py)) return false;
    }
  }

  return true;
}
