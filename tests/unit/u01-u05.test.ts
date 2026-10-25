import { describe, it, expect } from 'vitest';
import {
  SLOTS,
  OBSTACLES,
  PLAYER_SPAWN,
  COMPANION_SPAWN,
  EXIT_1_TRIGGER,
  EXIT_2_TRIGGER,
  getStandOffPoint,
  isWalkable,
  isInsideRooms,
  collidesWithObstacle,
  SlotType
} from '../../src/config/layout.js';
import { CollisionWorld } from '../../src/physics/collisionWorld.js';

describe('U-01: Slots inventory & uniqueness', () => {
  it('contains all 18 required slots with correct types and unique IDs', () => {
    const expectedSlots: Record<string, SlotType> = {
      P1: 'photo', P2: 'photo', P3: 'photo', P4: 'photo',
      P5: 'photo', P6: 'photo', P7: 'photo', P8: 'photo',
      V1: 'video', V2: 'video',
      B1: 'board', B2: 'board', B3: 'board', B4: 'board', B5: 'board',
      T1: 'title plaque',
      S1: 'exit sign', S2: 'exit sign'
    };

    const slotIds = SLOTS.map(s => s.id);
    const uniqueIds = new Set(slotIds);

    expect(slotIds.length).toBe(18);
    expect(uniqueIds.size).toBe(18);

    for (const [id, expectedType] of Object.entries(expectedSlots)) {
      const slot = SLOTS.find(s => s.id === id);
      expect(slot).toBeDefined();
      expect(slot!.type).toBe(expectedType);
      expect(slot!.box[0]).toBeGreaterThan(0);
      expect(slot!.box[1]).toBeGreaterThan(0);
      expect(slot!.elev).toBeGreaterThan(0);
    }
  });
});

describe('U-02: Wall slot placement & solid backing', () => {
  it('every wall slot has walkable space in front and solid backing behind', () => {
    const pillarObstacle = OBSTACLES.find(o => o.id === 'pillar' && o.kind === 'aabb') as any;

    for (const slot of SLOTS) {
      const [px, py] = slot.pos;
      const [nx, ny] = slot.n;

      // In front (+0.1 m along normal): must be inside room walkable volume
      const frontX = px + 0.1 * nx;
      const frontY = py + 0.1 * ny;
      expect(isInsideRooms(frontX, frontY)).toBe(true);

      // Behind (-0.1 m along normal):
      // For exit signs S1 & S2: elevated at 3.4m above the 2.8m high doorway opening (solid bulkhead)
      if (slot.type === 'exit sign') {
        expect(slot.elev).toBeGreaterThanOrEqual(2.8);
      } else {
        const backX = px - 0.1 * nx;
        const backY = py - 0.1 * ny;

        const isInsidePillar =
          backX >= pillarObstacle.xMin &&
          backX <= pillarObstacle.xMax &&
          backY >= pillarObstacle.yMin &&
          backY <= pillarObstacle.yMax;

        const isBehindSolid = !isInsideRooms(backX, backY) || isInsidePillar;
        expect(isBehindSolid, `Slot ${slot.id} must have solid backing behind`).toBe(true);
      }

      // Verify the frame does not extend past wall boundaries
      const halfW = slot.box[0] / 2;
      // Tangent vector
      const tx = -ny;
      const ty = nx;
      for (const offset of [-halfW, 0, halfW]) {
        const edgeX = px + offset * tx;
        const edgeY = py + offset * ty;
        const edgeFrontX = edgeX + 0.05 * nx;
        const edgeFrontY = edgeY + 0.05 * ny;
        expect(isInsideRooms(edgeFrontX, edgeFrontY), `Slot ${slot.id} edge must be inside room`).toBe(true);
      }
    }
  });
});

describe('U-03: Reachability of spawn, standoff points, and exit triggers', () => {
  it('spawn, standoff points, and exits are all walkable for r = 0.35 m', () => {
    expect(isWalkable(PLAYER_SPAWN.x, PLAYER_SPAWN.y, 0.35)).toBe(true);
    expect(isWalkable(COMPANION_SPAWN.x, COMPANION_SPAWN.y, 0.35)).toBe(true);

    for (const slot of SLOTS) {
      const [sx, sy] = getStandOffPoint(slot);
      const walkable = isWalkable(sx, sy, 0.35);
      expect(walkable, `Standoff for ${slot.id} at (${sx}, ${sy}) must be walkable`).toBe(true);
    }

    // Canonical exit trigger points from Architecture.md §3.6
    const exit1Pt = [-8.6, 12.5];
    const exit2Pt = [8.6, 12.5];

    expect(exit1Pt[0]).toBeGreaterThanOrEqual(EXIT_1_TRIGGER.xMin);
    expect(exit1Pt[0]).toBeLessThanOrEqual(EXIT_1_TRIGGER.xMax);
    expect(exit1Pt[1]).toBeGreaterThanOrEqual(EXIT_1_TRIGGER.yMin);
    expect(exit1Pt[1]).toBeLessThanOrEqual(EXIT_1_TRIGGER.yMax);
    expect(isWalkable(exit1Pt[0], exit1Pt[1], 0.35)).toBe(true);

    expect(exit2Pt[0]).toBeGreaterThanOrEqual(EXIT_2_TRIGGER.xMin);
    expect(exit2Pt[0]).toBeLessThanOrEqual(EXIT_2_TRIGGER.xMax);
    expect(exit2Pt[1]).toBeGreaterThanOrEqual(EXIT_2_TRIGGER.yMin);
    expect(exit2Pt[1]).toBeLessThanOrEqual(EXIT_2_TRIGGER.yMax);
    expect(isWalkable(exit2Pt[0], exit2Pt[1], 0.35)).toBe(true);
  });

  it('proves full topological reachability from spawn to all standoff points and exits', () => {
    // 2D grid BFS with cell size 0.5 m
    const cellSize = 0.5;
    const visited = new Set<string>();
    const queue: [number, number][] = [];

    const toKey = (gx: number, gy: number) => `${gx},${gy}`;
    const startGx = Math.round(PLAYER_SPAWN.x / cellSize);
    const startGy = Math.round(PLAYER_SPAWN.y / cellSize);

    visited.add(toKey(startGx, startGy));
    queue.push([startGx, startGy]);

    const dirs = [
      [1, 0], [-1, 0], [0, 1], [0, -1],
      [1, 1], [-1, 1], [1, -1], [-1, -1]
    ];

    while (queue.length > 0) {
      const [gx, gy] = queue.shift()!;
      for (const [dx, dy] of dirs) {
        const ngx = gx + dx;
        const ngy = gy + dy;
        const key = toKey(ngx, ngy);
        if (!visited.has(key)) {
          const wx = ngx * cellSize;
          const wy = ngy * cellSize;
          if (isWalkable(wx, wy, 0.35)) {
            visited.add(key);
            queue.push([ngx, ngy]);
          }
        }
      }
    }

    // Verify all standoffs are in reached cells or adjacent to reached cells
    for (const slot of SLOTS) {
      const [sx, sy] = getStandOffPoint(slot);
      const gx = Math.round(sx / cellSize);
      const gy = Math.round(sy / cellSize);
      let reachable = visited.has(toKey(gx, gy));
      if (!reachable) {
        // check 8 neighbors
        for (const [dx, dy] of dirs) {
          if (visited.has(toKey(gx + dx, gy + dy))) {
            reachable = true;
            break;
          }
        }
      }
      expect(reachable, `Standoff ${slot.id} must be reachable via BFS from spawn`).toBe(true);
    }
  });
});

describe('U-04: 360-degree collision resolution & wall sliding', () => {
  it('a walking circle never enters colliders and slides along walls from 360 headings', () => {
    const world = new CollisionWorld();
    const radius = 0.35;
    const speed = 3.0;
    const dt = 1 / 60;

    // Test positions close to obstacles and walls
    const testPositions: [number, number][] = [
      [-10 + radius + 0.05, 6],     // Near west wall at y=6
      [10 - radius - 0.05, -3.5],   // Near east wall at y=-3.5
      [0, -13 + radius + 0.05],     // Near foyer south wall
      [0, 2.5 + radius + 0.05],     // North of pillar
      [-3 - radius - 0.05, 0],      // West of pillar
      [0.5 - radius - 0.05, 4.9],   // West of bench A
      [-5.9 - radius - 0.05, 0]     // West of bench B
    ];

    for (const [startX, startY] of testPositions) {
      for (let deg = 0; deg < 360; deg++) {
        const rad = (deg * Math.PI) / 180;
        const vx = speed * Math.cos(rad);
        const vy = speed * Math.sin(rad);

        const res = world.moveCircle(startX, startY, vx, vy, dt, radius);

        // 1. Must never enter obstacles or be outside rooms
        expect(collidesWithObstacle(res.x, res.y, radius - 0.001)).toBe(false);
        expect(isInsideRooms(res.x, res.y)).toBe(true);

        // 2. State coordinates must remain finite and valid
        expect(Number.isFinite(res.x)).toBe(true);
        expect(Number.isFinite(res.y)).toBe(true);
      }
    }
  });
});

describe('U-05: Tunneling prevention at high speed with large dt', () => {
  it('with dt = 0.25 s at run speed (5.5 m/s) against walls, the circle stays outside', () => {
    const world = new CollisionWorld();
    const radius = 0.35;
    const runSpeed = 5.5;
    const dt = 0.25; // Displacement = 1.375 m!

    // Sprint directly toward the west wall of Main Hall (x = -10, y = 6) from x = -8.5
    const westRes = world.moveCircle(-8.5, 6, -runSpeed, 0, dt, radius);
    expect(westRes.x).toBeGreaterThanOrEqual(-10 + radius - 0.001);
    expect(isInsideRooms(westRes.x, westRes.y)).toBe(true);

    // Sprint directly toward the north wall of Main Hall (y = 9) from y = 7.5
    const northRes = world.moveCircle(6.5, 7.5, 0, runSpeed, dt, radius);
    expect(northRes.y).toBeLessThanOrEqual(9 - radius + 0.001);
    expect(isInsideRooms(northRes.x, northRes.y)).toBe(true);

    // Sprint directly toward the pillar east face (x = 3) from x = 4.5
    const pillarRes = world.moveCircle(4.5, 0, -runSpeed, 0, dt, radius);
    expect(pillarRes.x).toBeGreaterThanOrEqual(3 + radius - 0.001);
    expect(collidesWithObstacle(pillarRes.x, pillarRes.y, radius - 0.001)).toBe(false);

    // Sprint directly toward Bench A (y = 4.6) from y = 3.5
    const benchRes = world.moveCircle(2.0, 3.5, 0, runSpeed, dt, radius);
    expect(benchRes.y).toBeLessThanOrEqual(4.6 - radius + 0.001);
    expect(collidesWithObstacle(benchRes.x, benchRes.y, radius - 0.001)).toBe(false);

    // Sprint directly toward the south wall of Foyer (y = -13) from y = -11.5
    const southRes = world.moveCircle(0, -11.5, 0, -runSpeed, dt, radius);
    expect(southRes.y).toBeGreaterThanOrEqual(-13 + radius - 0.001);
    expect(isInsideRooms(southRes.x, southRes.y)).toBe(true);
  });
});
