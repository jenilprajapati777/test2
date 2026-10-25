import * as THREE from 'three';
import { CEILING_HEIGHT, ROOMS, WALL_THICKNESS } from '../config/layout.js';
import { extractWallSegments, WallSegment } from './wallsFromRooms.js';
import { MaterialPalette } from './materials.js';

export class WorldBuilder {
  public group: THREE.Group;
  public wallSegments: WallSegment[];
  private materials: MaterialPalette;

  constructor(materials: MaterialPalette) {
    this.materials = materials;
    this.group = new THREE.Group();
    this.group.name = 'WorldEnvironment';
    this.wallSegments = extractWallSegments(ROOMS);

    this.buildFloors();
    this.buildCeiling();
    this.buildWalls();
  }

  // Unified floors
  private buildFloors(): void {
    const floorGroup = new THREE.Group();
    floorGroup.name = 'Floors';

    for (const r of ROOMS) {
      const width = r.xMax - r.xMin;
      const depth = r.yMax - r.yMin;
      const geo = new THREE.PlaneGeometry(width, depth);
      const mesh = new THREE.Mesh(geo, this.materials.floorMaterial);
      mesh.rotation.x = -Math.PI / 2;

      const centerX = (r.xMin + r.xMax) / 2;
      const centerY = (r.yMin + r.yMax) / 2;
      mesh.position.set(centerX, 0, -centerY);
      mesh.receiveShadow = true;
      floorGroup.add(mesh);
    }

    this.group.add(floorGroup);
  }

  // Ceiling with skylight hole above pillar
  private buildCeiling(): void {
    const ceilingGroup = new THREE.Group();
    ceilingGroup.name = 'Ceilings';

    for (const r of ROOMS) {
      const width = r.xMax - r.xMin;
      const depth = r.yMax - r.yMin;
      const centerX = (r.xMin + r.xMax) / 2;
      const centerY = (r.yMin + r.yMax) / 2;

      if (r.id === 'R2') {
        // Main Hall has skylight hole in the center: [-3, 3] x [-2.5, 2.5]
        // We create 4 ceiling plates around the hole
        // South of hole: y in [-7, -2.5]
        const sGeo = new THREE.PlaneGeometry(width, -2.5 - -7);
        const sMesh = new THREE.Mesh(sGeo, this.materials.ceilingMaterial);
        sMesh.rotation.x = Math.PI / 2;
        sMesh.position.set(0, CEILING_HEIGHT, -((-7 + -2.5) / 2));
        ceilingGroup.add(sMesh);

        // North of hole: y in [2.5, 9]
        const nGeo = new THREE.PlaneGeometry(width, 9 - 2.5);
        const nMesh = new THREE.Mesh(nGeo, this.materials.ceilingMaterial);
        nMesh.rotation.x = Math.PI / 2;
        nMesh.position.set(0, CEILING_HEIGHT, -((2.5 + 9) / 2));
        ceilingGroup.add(nMesh);

        // West of hole: x in [-10, -3], y in [-2.5, 2.5]
        const wGeo = new THREE.PlaneGeometry(-3 - -10, 5.0);
        const wMesh = new THREE.Mesh(wGeo, this.materials.ceilingMaterial);
        wMesh.rotation.x = Math.PI / 2;
        wMesh.position.set((-10 + -3) / 2, CEILING_HEIGHT, 0);
        ceilingGroup.add(wMesh);

        // East of hole: x in [3, 10], y in [-2.5, 2.5]
        const eGeo = new THREE.PlaneGeometry(10 - 3, 5.0);
        const eMesh = new THREE.Mesh(eGeo, this.materials.ceilingMaterial);
        eMesh.rotation.x = Math.PI / 2;
        eMesh.position.set((3 + 10) / 2, CEILING_HEIGHT, 0);
        ceilingGroup.add(eMesh);
      } else {
        const geo = new THREE.PlaneGeometry(width, depth);
        const mesh = new THREE.Mesh(geo, this.materials.ceilingMaterial);
        mesh.rotation.x = Math.PI / 2;
        mesh.position.set(centerX, CEILING_HEIGHT, -centerY);
        ceilingGroup.add(mesh);
      }
    }

    // Ceiling Beams in Main Hall
    const beamGeo = new THREE.BoxGeometry(20, 0.35, 0.3);
    for (const by of [-6, -4, 4, 6, 8]) {
      const beam = new THREE.Mesh(beamGeo, this.materials.beamMaterial);
      beam.position.set(0, CEILING_HEIGHT - 0.175, -by);
      ceilingGroup.add(beam);
    }

    this.group.add(ceilingGroup);
  }

  // Exterior & Interior Walls
  private buildWalls(): void {
    const wallGroup = new THREE.Group();
    wallGroup.name = 'Walls';

    const skirtingHeight = 0.15;
    const crownHeight = 0.15;

    for (const seg of this.wallSegments) {
      const dx = seg.x2 - seg.x1;
      const dy = seg.y2 - seg.y1;
      const length = Math.hypot(dx, dy);
      if (length < 1e-4) continue;

      // Wall center on segment
      const midX = (seg.x1 + seg.x2) / 2;
      const midY = (seg.y1 + seg.y2) / 2;

      // Normal points inward toward room.
      // Thickness extends outward (-nx, -ny) by WALL_THICKNESS / 2
      const wallCenterX = midX - (seg.nx * WALL_THICKNESS) / 2;
      const wallCenterY = midY - (seg.ny * WALL_THICKNESS) / 2;
      const wallCenterZ = -wallCenterY;

      const isHorizontal = Math.abs(dy) < 1e-4;

      let boxWidth = isHorizontal ? length : WALL_THICKNESS;
      let boxDepth = isHorizontal ? WALL_THICKNESS : length;

      const wallGeo = new THREE.BoxGeometry(boxWidth, CEILING_HEIGHT, boxDepth);
      const wallMesh = new THREE.Mesh(wallGeo, this.materials.wallMaterial);
      wallMesh.position.set(wallCenterX, CEILING_HEIGHT / 2, wallCenterZ);
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      wallGroup.add(wallMesh);

      // Skirting board (base moulding)
      const skirtingGeo = new THREE.BoxGeometry(
        isHorizontal ? length : 0.05,
        skirtingHeight,
        isHorizontal ? 0.05 : length
      );
      const skirtingMesh = new THREE.Mesh(skirtingGeo, this.materials.mouldingMaterial);
      const skirtX = midX + (seg.nx * 0.025);
      const skirtY = midY + (seg.ny * 0.025);
      skirtingMesh.position.set(skirtX, skirtingHeight / 2, -skirtY);
      wallGroup.add(skirtingMesh);

      // Crown moulding along ceiling
      const crownGeo = new THREE.BoxGeometry(
        isHorizontal ? length : 0.08,
        crownHeight,
        isHorizontal ? 0.08 : length
      );
      const crownMesh = new THREE.Mesh(crownGeo, this.materials.mouldingMaterial);
      crownMesh.position.set(skirtX, CEILING_HEIGHT - crownHeight / 2, -skirtY);
      wallGroup.add(crownMesh);
    }

    this.group.add(wallGroup);
  }
}
