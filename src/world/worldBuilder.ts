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

  // Unified floors with polished brass doorway transition strips
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

    // Polished brass doorway threshold inlays
    const thresholds: [number, number, number, number][] = [
      // [centerX, planCenterY, width, depth]
      [0, -7.0, 8.0, 0.12],   // Foyer to Main Hall
      [-10.0, 0.0, 0.12, 4.0], // Main Hall to West Alcove
      [10.0, -3.0, 0.12, 4.0], // Main Hall to East Alcove
      [0, 9.0, 6.0, 0.12],     // Main Hall to Decision Alcove
      [-9.0, 12.5, 3.0, 0.12], // Left exit threshold
      [9.0, 12.5, 3.0, 0.12]   // Right exit threshold
    ];

    for (const [cx, cy, w, d] of thresholds) {
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(w, 0.008, d),
        this.materials.brassMaterial
      );
      strip.position.set(cx, 0.004, -cy);
      strip.receiveShadow = true;
      floorGroup.add(strip);
    }

    this.group.add(floorGroup);
  }

  // Ceiling with skylight mullions, frosted glass, and coffered beam grid
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
        // 4 ceiling plates surrounding the central skylight
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

        // Ornate skylight wrought iron frame and mullions: hole is [-3, 3] x [-2.5, 2.5]
        this.buildSkylightArchitecturalGrid(ceilingGroup);
      } else {
        const geo = new THREE.PlaneGeometry(width, depth);
        const mesh = new THREE.Mesh(geo, this.materials.ceilingMaterial);
        mesh.rotation.x = Math.PI / 2;
        mesh.position.set(centerX, CEILING_HEIGHT, -centerY);
        ceilingGroup.add(mesh);
      }
    }

    // Coffered Architectural Ceiling Beams in Main Hall
    // Transverse beams across X axis (spanning from x = -10 to +10, width = 20)
    const beamGeo = new THREE.BoxGeometry(20, 0.32, 0.28);
    for (const by of [-6, -4, 4, 6, 8]) {
      const beam = new THREE.Mesh(beamGeo, this.materials.beamMaterial);
      beam.position.set(0, CEILING_HEIGHT - 0.16, -by);
      beam.castShadow = true;
      ceilingGroup.add(beam);

      // Gold rosette bosses at intervals along the beams
      for (const rx of [-8, -5, 0, 5, 8]) {
        const rosette = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 0.04, 12),
          this.materials.goldTrimMaterial
        );
        rosette.position.set(rx, CEILING_HEIGHT - 0.33, -by);
        ceilingGroup.add(rosette);
      }
    }

    // Longitudinal connector beams forming coffered recessed bays
    const longBeamGeo = new THREE.BoxGeometry(0.28, 0.28, 16);
    for (const bx of [-7, 7]) {
      const longBeam = new THREE.Mesh(longBeamGeo, this.materials.beamMaterial);
      longBeam.position.set(bx, CEILING_HEIGHT - 0.14, -1);
      longBeam.castShadow = true;
      ceilingGroup.add(longBeam);
    }

    this.group.add(ceilingGroup);
  }

  // Wrought iron & brass skylight mullions with frosted glass
  private buildSkylightArchitecturalGrid(parent: THREE.Group): void {
    const skylightGroup = new THREE.Group();
    skylightGroup.name = 'SkylightGrid';

    // Outer border frame (6.2m x 5.2m, 0.15m height)
    const outerFrame = new THREE.Mesh(
      new THREE.BoxGeometry(6.2, 0.16, 0.12),
      this.materials.skylightFrameMaterial
    );
    // North and South frame bars
    const fN = outerFrame.clone();
    fN.position.set(0, CEILING_HEIGHT, -2.5);
    skylightGroup.add(fN);

    const fS = outerFrame.clone();
    fS.position.set(0, CEILING_HEIGHT, 2.5);
    skylightGroup.add(fS);

    // East and West frame bars
    const fSide = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.16, 5.12),
      this.materials.skylightFrameMaterial
    );
    const fW = fSide.clone();
    fW.position.set(-3.0, CEILING_HEIGHT, 0);
    skylightGroup.add(fW);

    const fE = fSide.clone();
    fE.position.set(3.0, CEILING_HEIGHT, 0);
    skylightGroup.add(fE);

    // Internal glass pane
    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(5.95, 4.95),
      this.materials.skylightGlassMaterial
    );
    glass.rotation.x = Math.PI / 2;
    glass.position.set(0, CEILING_HEIGHT + 0.02, 0);
    skylightGroup.add(glass);

    // Iron cross-mullions
    // Transverse ribs (across X)
    const ribGeoX = new THREE.BoxGeometry(6.0, 0.08, 0.06);
    for (const rz of [-1.25, 0, 1.25]) {
      const rib = new THREE.Mesh(ribGeoX, this.materials.skylightFrameMaterial);
      rib.position.set(0, CEILING_HEIGHT + 0.01, rz);
      skylightGroup.add(rib);
    }

    // Longitudinal ribs (along Z)
    const ribGeoZ = new THREE.BoxGeometry(0.06, 0.08, 5.0);
    for (const rx of [-1.5, 0, 1.5]) {
      const rib = new THREE.Mesh(ribGeoZ, this.materials.skylightFrameMaterial);
      rib.position.set(rx, CEILING_HEIGHT + 0.01, 0);
      skylightGroup.add(rib);
    }

    parent.add(skylightGroup);
  }

  // Exterior & Interior Walls with classical wainscoting and mouldings
  private buildWalls(): void {
    const wallGroup = new THREE.Group();
    wallGroup.name = 'Walls';

    const skirtingHeight = 0.16;
    const chairRailY = 1.05;
    const chairRailHeight = 0.06;
    const crownHeight = 0.16;

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

      const boxWidth = isHorizontal ? length : WALL_THICKNESS;
      const boxDepth = isHorizontal ? WALL_THICKNESS : length;

      // Main plaster wall
      const wallGeo = new THREE.BoxGeometry(boxWidth, CEILING_HEIGHT, boxDepth);
      const wallMesh = new THREE.Mesh(wallGeo, this.materials.wallMaterial);
      wallMesh.position.set(wallCenterX, CEILING_HEIGHT / 2, wallCenterZ);
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      wallGroup.add(wallMesh);

      const trimX = midX + (seg.nx * 0.02);
      const trimY = midY + (seg.ny * 0.02);

      // 1. Skirting board (base moulding in dark polished wood)
      const skirtingGeo = new THREE.BoxGeometry(
        isHorizontal ? length : 0.04,
        skirtingHeight,
        isHorizontal ? 0.04 : length
      );
      const skirtingMesh = new THREE.Mesh(skirtingGeo, this.materials.wainscotMaterial);
      skirtingMesh.position.set(trimX, skirtingHeight / 2, -trimY);
      skirtingMesh.receiveShadow = true;
      wallGroup.add(skirtingMesh);

      // Gold beading line directly above skirting
      const beadGeo = new THREE.BoxGeometry(
        isHorizontal ? length : 0.025,
        0.015,
        isHorizontal ? 0.025 : length
      );
      const beadMesh = new THREE.Mesh(beadGeo, this.materials.goldTrimMaterial);
      beadMesh.position.set(trimX, skirtingHeight + 0.008, -trimY);
      wallGroup.add(beadMesh);

      // 2. Chair Rail / Dado moulding at y = 1.05m
      const chairRailGeo = new THREE.BoxGeometry(
        isHorizontal ? length : 0.045,
        chairRailHeight,
        isHorizontal ? 0.045 : length
      );
      const chairRailMesh = new THREE.Mesh(chairRailGeo, this.materials.wainscotMaterial);
      chairRailMesh.position.set(trimX, chairRailY, -trimY);
      chairRailMesh.castShadow = true;
      wallGroup.add(chairRailMesh);

      // 3. Lower Boiserie Wainscoting Panels between skirting (0.16m) and chair rail (1.05m)
      if (length >= 1.6) {
        const panelCount = Math.max(1, Math.floor(length / 1.5));
        const panelWidth = (length - (panelCount + 1) * 0.15) / panelCount;
        const panelHeight = chairRailY - chairRailHeight / 2 - (skirtingHeight + 0.05);

        for (let i = 0; i < panelCount; i++) {
          const t = ((i + 0.5) / panelCount) - 0.5;
          const px = midX + (isHorizontal ? t * length : 0) + (seg.nx * 0.025);
          const py = midY + (isHorizontal ? 0 : t * length) + (seg.ny * 0.025);

          // Recessed wooden panel back
          const panelGeo = new THREE.BoxGeometry(
            isHorizontal ? panelWidth : 0.015,
            panelHeight,
            isHorizontal ? 0.015 : panelWidth
          );
          const panelMesh = new THREE.Mesh(panelGeo, this.materials.wainscotMaterial);
          panelMesh.position.set(px, (skirtingHeight + 0.05 + chairRailY - chairRailHeight / 2) / 2, -py);
          panelMesh.receiveShadow = true;
          wallGroup.add(panelMesh);
        }
      }

      // 4. Classical stepped crown cornice moulding along ceiling
      const crownGeo = new THREE.BoxGeometry(
        isHorizontal ? length : 0.08,
        crownHeight,
        isHorizontal ? 0.08 : length
      );
      const crownMesh = new THREE.Mesh(crownGeo, this.materials.mouldingMaterial);
      crownMesh.position.set(trimX, CEILING_HEIGHT - crownHeight / 2, -trimY);
      wallGroup.add(crownMesh);
    }

    this.group.add(wallGroup);
  }
}
