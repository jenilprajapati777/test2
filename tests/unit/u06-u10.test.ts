import { describe, it, expect } from 'vitest';
import { PlayerController } from '../../src/characters/playerController.js';
import { Companion } from '../../src/characters/companion.js';
import { CharacterFactory } from '../../src/characters/characterFactory.js';
import { CollisionWorld } from '../../src/physics/collisionWorld.js';
import { collidesWithObstacle, isInsideRooms } from '../../src/config/layout.js';

describe('U-06: Character speeds, diagonal normalization, and camera-relative mapping', () => {
  it('walk speed is 3.0 m/s (+/- 2%) and run speed is 5.5 m/s (+/- 2%)', () => {
    const world = new CollisionWorld();
    const jenil = CharacterFactory.createProcedural('jenil');
    // Place in open east corridor of Main Hall (x=6, y=0)
    const player = new PlayerController(jenil, world, 6, 0, 0);

    // Accelerate walking north in open space (hall center)
    player.setVirtualKeys({ w: true });
    const dt = 1 / 60;
    for (let i = 0; i < 60; i++) {
      player.update(dt, 0);
    }
    expect(player.speed).toBeGreaterThanOrEqual(3.0 * 0.98);
    expect(player.speed).toBeLessThanOrEqual(3.0 * 1.02);

    // Accelerate running
    const runner = new PlayerController(jenil, world, 6, 0, 0);
    runner.setVirtualKeys({ w: true, shift: true });
    for (let i = 0; i < 60; i++) {
      runner.update(dt, 0);
    }
    expect(runner.speed).toBeGreaterThanOrEqual(5.5 * 0.98);
    expect(runner.speed).toBeLessThanOrEqual(5.5 * 1.02);
  });

  it('diagonal movement is not faster than cardinal movement', () => {
    const world = new CollisionWorld();
    const jenil = CharacterFactory.createProcedural('jenil');
    // Place in open space
    const player = new PlayerController(jenil, world, 6, 0, 0);

    player.setVirtualKeys({ w: true, d: true });
    const dt = 1 / 60;
    for (let i = 0; i < 60; i++) {
      player.update(dt, 0);
    }
    expect(player.speed).toBeGreaterThanOrEqual(3.0 * 0.98);
    expect(player.speed).toBeLessThanOrEqual(3.0 * 1.02);
  });

  it('camera-relative mapping is exact for yaw 0, 90, 180, and 270 degrees', () => {
    const world = new CollisionWorld();
    const jenil = CharacterFactory.createProcedural('jenil');
    const dt = 1 / 60;

    // Yaw 0: facing north -> W moves along +y
    const p0 = new PlayerController(jenil, world, 6, 0, 0);
    p0.setVirtualKeys({ w: true });
    for (let i = 0; i < 30; i++) p0.update(dt, 0);
    expect(p0.vy).toBeGreaterThan(2.0);
    expect(Math.abs(p0.vx)).toBeLessThan(0.01);

    // Yaw 90 deg: facing east -> W moves along +x
    const p90 = new PlayerController(jenil, world, 6, 0, 0);
    p90.setVirtualKeys({ w: true });
    for (let i = 0; i < 30; i++) p90.update(dt, Math.PI / 2);
    expect(p90.vx).toBeGreaterThan(2.0);
    expect(Math.abs(p90.vy)).toBeLessThan(0.01);

    // Yaw 180 deg: facing south -> W moves along -y
    const p180 = new PlayerController(jenil, world, 6, 0, 0);
    p180.setVirtualKeys({ w: true });
    for (let i = 0; i < 30; i++) p180.update(dt, Math.PI);
    expect(p180.vy).toBeLessThan(-2.0);
    expect(Math.abs(p180.vx)).toBeLessThan(0.01);

    // Yaw 270 deg: facing west -> W moves along -x
    const p270 = new PlayerController(jenil, world, 6, 0, 0);
    p270.setVirtualKeys({ w: true });
    for (let i = 0; i < 30; i++) p270.update(dt, (3 * Math.PI) / 2);
    expect(p270.vx).toBeLessThan(-2.0);
    expect(Math.abs(p270.vy)).toBeLessThan(0.01);
  });
});

describe('U-10: Companion following, distance boundaries, collision safety & teleportation', () => {
  it('companion follows player, stays 1.2–3 m behind in steady state, and never collides', () => {
    const world = new CollisionWorld();
    const rutuModel = CharacterFactory.createProcedural('rutu');
    const jenilModel = CharacterFactory.createProcedural('jenil');

    // Walk east in open north hall (y = 6, x from -6 to 2)
    const player = new PlayerController(rutuModel, world, -6, 6, 90);
    const companion = new Companion(jenilModel, world, -7.8, 5.4, 90);

    const dt = 1 / 60;
    // Walk east for 2 seconds (Math.PI / 2 is yaw for east, W moves along +x)
    player.setVirtualKeys({ w: true });
    for (let i = 0; i < 150; i++) {
      player.update(dt, Math.PI / 2);
      companion.update(dt, player.planX, player.planY, player.yawRad, player.speed);

      // Verify companion is inside rooms and not inside colliders
      expect(isInsideRooms(companion.planX, companion.planY)).toBe(true);
      expect(collidesWithObstacle(companion.planX, companion.planY, 0.35)).toBe(false);
    }

    const dist = Math.hypot(player.planX - companion.planX, player.planY - companion.planY);
    expect(dist).toBeGreaterThanOrEqual(1.2);
    expect(dist).toBeLessThanOrEqual(3.0);
  });

  it('teleports beside player when distance > 12 m', () => {
    const world = new CollisionWorld();
    const rutuModel = CharacterFactory.createProcedural('rutu');
    const jenilModel = CharacterFactory.createProcedural('jenil');

    const player = new PlayerController(rutuModel, world, 0, 0, 0);
    const companion = new Companion(jenilModel, world, 0, -15, 0);

    const initialDist = Math.hypot(player.planX - companion.planX, player.planY - companion.planY);
    expect(initialDist).toBeGreaterThan(12);

    companion.update(1 / 60, player.planX, player.planY, player.yawRad, 0);

    const newDist = Math.hypot(player.planX - companion.planX, player.planY - companion.planY);
    expect(newDist).toBeLessThanOrEqual(2.0);
  });
});
