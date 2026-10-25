import * as THREE from 'three';
import { MaterialPalette } from './materials.js';

export class PropsBuilder {
  public group: THREE.Group;
  public exit1Door: THREE.Mesh;
  public exit2Door: THREE.Mesh;
  private materials: MaterialPalette;

  constructor(materials: MaterialPalette) {
    this.materials = materials;
    this.group = new THREE.Group();
    this.group.name = 'PropsGroup';

    this.exit1Door = this.createExitDoor('exit1', [-9, 12.5], 0xffb732);
    this.exit2Door = this.createExitDoor('exit2', [9, 12.5], 0x4aa3ff);

    this.buildPillar();
    this.buildBenches();
    this.buildPlants();
    this.buildStanchions();
    this.buildDoorways();
    this.buildFoyerPlaque();
  }

  // 1. Marble Monument Pillar
  private buildPillar(): void {
    // Plan x: [-3, 3], y: [-2.5, 2.5] -> Three.js x: 0, z: 0, width: 6, depth: 5, height: 4.5
    const pillarGeo = new THREE.BoxGeometry(6, 4.5, 5);
    const pillarMesh = new THREE.Mesh(pillarGeo, this.materials.marbleMaterial);
    pillarMesh.position.set(0, 2.25, 0);
    pillarMesh.castShadow = true;
    pillarMesh.receiveShadow = true;
    this.group.add(pillarMesh);

    // Decorative base moulding
    const baseGeo = new THREE.BoxGeometry(6.3, 0.25, 5.3);
    const baseMesh = new THREE.Mesh(baseGeo, this.materials.mouldingMaterial);
    baseMesh.position.set(0, 0.125, 0);
    baseMesh.receiveShadow = true;
    this.group.add(baseMesh);

    // Decorative crown moulding
    const crownGeo = new THREE.BoxGeometry(6.3, 0.25, 5.3);
    const crownMesh = new THREE.Mesh(crownGeo, this.materials.mouldingMaterial);
    crownMesh.position.set(0, 4.375, 0);
    this.group.add(crownMesh);

    // T1 Title Plaque on South face (y = -2.5 -> z = +2.5 in Three.js)
    // pos: (0, -2.5), normal: (0, -1) -> Three.js z: +2.5, normal faces +z
    this.buildTitlePlaque();
  }

  private buildTitlePlaque(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 300;
    const ctx = canvas.getContext('2d')!;

    // Polished brass plaque
    const grad = ctx.createLinearGradient(0, 0, 1024, 300);
    grad.addColorStop(0, '#cda851');
    grad.addColorStop(0.5, '#f7df96');
    grad.addColorStop(1, '#a67d2e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 300);

    // Inner bevel border
    ctx.strokeStyle = '#5a3d0f';
    ctx.lineWidth = 10;
    ctx.strokeRect(15, 15, 994, 270);

    // Engraved text
    ctx.fillStyle = '#2c1a04';
    ctx.font = 'bold 54px "Cinzel", "Times New Roman", serif, system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Jenil & Rutu', 512, 105);

    ctx.font = '36px "Cinzel", "Times New Roman", serif, system-ui';
    ctx.fillStyle = '#422806';
    ctx.fillText('— Our Museum —', 512, 185);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const plaqueGeo = new THREE.BoxGeometry(3.0, 0.9, 0.05);
    const plaqueMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.3,
      metalness: 0.7
    });
    const plaqueMesh = new THREE.Mesh(plaqueGeo, plaqueMat);
    // South face in 2D is y = -2.5 -> Three.js z = +2.53 (sits 0.03m in front of wall)
    plaqueMesh.position.set(0, 2.2, 2.53);
    this.group.add(plaqueMesh);
  }

  // 2. Benches A and B
  private buildBenches(): void {
    // Bench A: x [0.5, 3.5], y [4.6, 5.2] -> width 3.0, depth 0.6, center x = 2.0, y = 4.9 -> Three.js z = -4.9
    const benchGeo = new THREE.BoxGeometry(3.0, 0.1, 0.6);
    const benchAMesh = new THREE.Mesh(benchGeo, this.materials.woodMaterial);
    benchAMesh.position.set(2.0, 0.45, -4.9);
    benchAMesh.castShadow = true;
    benchAMesh.receiveShadow = true;
    this.group.add(benchAMesh);

    // Legs for Bench A
    const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.45);
    const legMat = this.materials.doorFrameMaterial;
    for (const lx of [0.7, 3.3]) {
      for (const lz of [-4.7, -5.1]) {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(lx, 0.225, lz);
        this.group.add(leg);
      }
    }

    // Bench B: x [-5.9, -5.3], y [-1.5, 1.5] -> width 0.6, depth 3.0, center x = -5.6, y = 0 -> Three.js z = 0
    const benchBGeo = new THREE.BoxGeometry(0.6, 0.1, 3.0);
    const benchBMesh = new THREE.Mesh(benchBGeo, this.materials.woodMaterial);
    benchBMesh.position.set(-5.6, 0.45, 0);
    benchBMesh.castShadow = true;
    benchBMesh.receiveShadow = true;
    this.group.add(benchBMesh);

    // Legs for Bench B
    for (const lx of [-5.4, -5.8]) {
      for (const lz of [-1.3, 1.3]) {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(lx, 0.225, lz);
        this.group.add(leg);
      }
    }
  }

  // 3. Potted Plants
  private buildPlants(): void {
    const plantCoords: [number, number][] = [
      [-9, 8],
      [9, 8],
      [-9, -6],
      [9, -6]
    ];

    const potGeo = new THREE.CylinderGeometry(0.38, 0.28, 0.7, 16);
    const potMat = new THREE.MeshStandardMaterial({ color: 0xe8e2d8, roughness: 0.6 });
    const foliageGeo = new THREE.DodecahedronGeometry(0.55, 1);
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x2e663a, roughness: 0.7 });

    for (const [x, y] of plantCoords) {
      const z = -y; // Three.js coordinate mapping
      const pot = new THREE.Mesh(potGeo, potMat);
      pot.position.set(x, 0.35, z);
      pot.castShadow = true;
      pot.receiveShadow = true;
      this.group.add(pot);

      const foliage = new THREE.Mesh(foliageGeo, foliageMat);
      foliage.position.set(x, 0.95, z);
      foliage.scale.set(1.0, 1.25, 1.0);
      foliage.castShadow = true;
      this.group.add(foliage);
    }
  }

  // 4. Stanchions around the pillar
  private buildStanchions(): void {
    const postGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.95, 12);
    const baseGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.05, 16);
    const postMat = this.materials.brassMaterial;

    // Posts at 1m offset from pillar boundary: x in [-4, 4], y in [-3.5, 3.5]
    const posts: [number, number][] = [
      [-3.8, -3.2], [0, -3.2], [3.8, -3.2],
      [-3.8, 3.2], [0, 3.2], [3.8, 3.2],
      [-3.8, 0], [3.8, 0]
    ];

    for (const [x, y] of posts) {
      const z = -y;
      const base = new THREE.Mesh(baseGeo, postMat);
      base.position.set(x, 0.025, z);
      this.group.add(base);

      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(x, 0.475, z);
      this.group.add(post);

      const topBall = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), postMat);
      topBall.position.set(x, 0.975, z);
      this.group.add(topBall);
    }
  }

  // 5. Doorways & Archways
  private buildDoorways(): void {
    // Archway between Entry Foyer and Main Hall (opening 8m wide at y = -7, z = +7)
    const archPillarGeo = new THREE.BoxGeometry(0.4, 4.5, 0.4);
    const archPillar1 = new THREE.Mesh(archPillarGeo, this.materials.doorFrameMaterial);
    archPillar1.position.set(-4.0, 2.25, 7.0);
    this.group.add(archPillar1);

    const archPillar2 = new THREE.Mesh(archPillarGeo, this.materials.doorFrameMaterial);
    archPillar2.position.set(4.0, 2.25, 7.0);
    this.group.add(archPillar2);

    const archHeaderGeo = new THREE.BoxGeometry(8.4, 0.4, 0.5);
    const archHeader = new THREE.Mesh(archHeaderGeo, this.materials.doorFrameMaterial);
    archHeader.position.set(0, 3.8, 7.0);
    this.group.add(archHeader);

    // Corridor exit doorways (opening 3m wide, 2.8m high at y = 12.5, z = -12.5)
    for (const x of [-3, 3]) {
      const doorHeaderGeo = new THREE.BoxGeometry(0.4, 0.3, 3.2);
      const doorHeader = new THREE.Mesh(doorHeaderGeo, this.materials.doorFrameMaterial);
      doorHeader.position.set(x, 2.8, -12.5);
      this.group.add(doorHeader);
    }
  }

  // 6. Glowing Exit Doors
  private createExitDoor(id: string, planPos: [number, number], colorHex: number): THREE.Mesh {
    const [x, y] = planPos;
    const z = -y;

    const doorGeo = new THREE.PlaneGeometry(3.0, 2.8);
    const doorMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });

    const doorMesh = new THREE.Mesh(doorGeo, doorMat);
    doorMesh.name = id;
    doorMesh.position.set(x, 1.4, z);
    // Orient plane across the corridor (corridors run along X, so plane faces X)
    doorMesh.rotation.y = Math.PI / 2;
    this.group.add(doorMesh);
    return doorMesh;
  }

  // 7. Foyer Credit Plaque
  private buildFoyerPlaque(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#2a1a0f';
    ctx.fillRect(0, 0, 512, 256);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, 492, 236);

    ctx.fillStyle = '#e6c875';
    ctx.font = '28px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Made with love by Jenil', 256, 128);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;

    const plaque = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 0.8),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4, metalness: 0.3 })
    );
    plaque.rotation.x = -Math.PI / 2;
    // Embed in floor at Entry foyer (y = -10.5 -> z = +10.5)
    plaque.position.set(0, 0.01, 10.5);
    this.group.add(plaque);
  }

  public update(time: number): void {
    // Pulse exit door glow gently
    const pulse1 = 0.75 + Math.sin(time * 2.5) * 0.2;
    const pulse2 = 0.75 + Math.cos(time * 2.5) * 0.2;
    (this.exit1Door.material as THREE.MeshBasicMaterial).opacity = pulse1;
    (this.exit2Door.material as THREE.MeshBasicMaterial).opacity = pulse2;
  }
}
