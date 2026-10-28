import * as THREE from 'three';
import { MaterialPalette, createDamaskRugTexture } from './materials.js';

export class PropsBuilder {
  public group: THREE.Group;
  public exit1Door: THREE.Mesh;
  public exit2Door: THREE.Mesh;
  private materials: MaterialPalette;
  private accentLights: THREE.PointLight[] = [];
  private glowingOrbs: THREE.Mesh[] = [];
  private rotatingArtifacts: THREE.Object3D[] = [];
  private fairyLights: THREE.Mesh[] = [];

  constructor(materials: MaterialPalette) {
    this.materials = materials;
    this.group = new THREE.Group();
    this.group.name = 'PropsGroup';

    this.exit1Door = this.createExitDoor('exit1', [-9, 12.5], 0xffb732);
    this.exit2Door = this.createExitDoor('exit2', [9, 12.5], 0x4aa3ff);

    this.buildPillar();
    this.buildBenches();
    this.buildPlants();
    this.buildStanchionsAndRopes();
    this.buildDoorways();
    this.buildFoyerPlaque();
    this.buildGalleryAtmosphere();
  }

  // 1. Marble Monument Pillar with Calacatta marble, brass trims, and title plaque
  private buildPillar(): void {
    // Plan x: [-3, 3], y: [-2.5, 2.5] -> Three.js x: 0, z: 0, width: 6, depth: 5, height: 4.5
    const pillarGeo = new THREE.BoxGeometry(6, 4.5, 5);
    const pillarMesh = new THREE.Mesh(pillarGeo, this.materials.marbleMaterial);
    pillarMesh.position.set(0, 2.25, 0);
    pillarMesh.castShadow = true;
    pillarMesh.receiveShadow = true;
    this.group.add(pillarMesh);

    // Decorative stepped base moulding
    const baseGeo = new THREE.BoxGeometry(6.3, 0.25, 5.3);
    const baseMesh = new THREE.Mesh(baseGeo, this.materials.mouldingMaterial);
    baseMesh.position.set(0, 0.125, 0);
    baseMesh.receiveShadow = true;
    this.group.add(baseMesh);

    const baseTrim = new THREE.Mesh(
      new THREE.BoxGeometry(6.35, 0.04, 5.35),
      this.materials.goldTrimMaterial
    );
    baseTrim.position.set(0, 0.26, 0);
    this.group.add(baseTrim);

    // Decorative stepped crown moulding
    const crownGeo = new THREE.BoxGeometry(6.3, 0.25, 5.3);
    const crownMesh = new THREE.Mesh(crownGeo, this.materials.mouldingMaterial);
    crownMesh.position.set(0, 4.375, 0);
    this.group.add(crownMesh);

    const crownTrim = new THREE.Mesh(
      new THREE.BoxGeometry(6.35, 0.04, 5.35),
      this.materials.goldTrimMaterial
    );
    crownTrim.position.set(0, 4.24, 0);
    this.group.add(crownTrim);

    // Polished brass corner guards on the pillar's 4 vertical edges
    const cornerGeo = new THREE.BoxGeometry(0.08, 4.2, 0.08);
    for (const cx of [-3.0, 3.0]) {
      for (const cz of [-2.5, 2.5]) {
        const corner = new THREE.Mesh(cornerGeo, this.materials.brassMaterial);
        corner.position.set(cx, 2.25, cz);
        this.group.add(corner);
      }
    }

    // T1 Title Plaque on South face (y = -2.5 -> z = +2.53 in Three.js)
    this.buildTitlePlaque();
  }

  private buildTitlePlaque(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 340;
    const ctx = canvas.getContext('2d')!;

    // Polished museum brass plaque
    const grad = ctx.createLinearGradient(0, 0, 1024, 340);
    grad.addColorStop(0, '#c79b3d');
    grad.addColorStop(0.3, '#f9e8a8');
    grad.addColorStop(0.5, '#edd187');
    grad.addColorStop(0.8, '#f7e39d');
    grad.addColorStop(1, '#a67b28');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 340);

    // Elaborate engraved double border
    ctx.strokeStyle = '#4a300a';
    ctx.lineWidth = 8;
    ctx.strokeRect(14, 14, 996, 312);

    ctx.strokeStyle = '#7c5417';
    ctx.lineWidth = 3;
    ctx.strokeRect(26, 26, 972, 288);

    // Corner decorative rosettes
    for (const [cx, cy] of [[36, 36], [988, 36], [36, 304], [988, 304]]) {
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#3d2506';
      ctx.fill();
    }

    // Elegant engraved typography
    ctx.fillStyle = '#261402';
    ctx.font = 'bold 64px "Cinzel", "Times New Roman", "Georgia", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Rutu', 512, 115);

    ctx.font = '34px "Cinzel", "Times New Roman", "Georgia", serif';
    ctx.fillStyle = '#3d2406';
    ctx.fillText('— M U S E U M —', 512, 195);

    ctx.font = 'italic 24px "Times New Roman", serif';
    ctx.fillStyle = '#5c390b';
    ctx.fillText('A curated collection of memories and moments', 512, 255);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const plaqueGeo = new THREE.BoxGeometry(3.2, 1.05, 0.05);
    const plaqueMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.28,
      metalness: 0.75
    });
    const plaqueMesh = new THREE.Mesh(plaqueGeo, plaqueMat);
    // South face in 2D is y = -2.5 -> Three.js z = +2.53
    plaqueMesh.position.set(0, 2.2, 2.53);
    plaqueMesh.castShadow = true;
    this.group.add(plaqueMesh);
  }

  // 2. Luxury Gallery Benches with Button-Tufted Velvet Cushions
  private buildBenches(): void {
    // Bench A: x [0.5, 3.5], y [4.6, 5.2] -> width 3.0, depth 0.6, center x = 2.0, y = 4.9 -> Three.js z = -4.9
    this.createTuftedBench(2.0, -4.9, 3.0, 0.6, false);

    // Bench B: x [-5.9, -5.3], y [-1.5, 1.5] -> width 0.6, depth 3.0, center x = -5.6, y = 0 -> Three.js z = 0
    this.createTuftedBench(-5.6, 0.0, 0.6, 3.0, true);
  }

  private createTuftedBench(x: number, z: number, width: number, depth: number, isVertical: boolean): void {
    // Dark mahogany bench frame
    const baseGeo = new THREE.BoxGeometry(width, 0.12, depth);
    const baseMesh = new THREE.Mesh(baseGeo, this.materials.woodMaterial);
    baseMesh.position.set(x, 0.42, z);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    this.group.add(baseMesh);

    // Brass perimeter accent rim
    const rimGeo = new THREE.BoxGeometry(width + 0.04, 0.03, depth + 0.04);
    const rimMesh = new THREE.Mesh(rimGeo, this.materials.brassMaterial);
    rimMesh.position.set(x, 0.47, z);
    this.group.add(rimMesh);

    // Button-tufted velvet cushion
    const cushionGeo = new THREE.BoxGeometry(width - 0.08, 0.14, depth - 0.08);
    const cushionMesh = new THREE.Mesh(cushionGeo, this.materials.tuftedCushionMaterial);
    cushionMesh.position.set(x, 0.54, z);
    cushionMesh.castShadow = true;
    cushionMesh.receiveShadow = true;
    this.group.add(cushionMesh);

    // Gold tufting buttons across the cushion
    const buttonGeo = new THREE.SphereGeometry(0.022, 10, 8);
    const numButtons = 6;
    for (let i = 0; i < numButtons; i++) {
      const t = ((i + 0.5) / numButtons) - 0.5;
      const bx = isVertical ? x : x + t * (width - 0.5);
      const bz = isVertical ? z + t * (depth - 0.5) : z;
      const button = new THREE.Mesh(buttonGeo, this.materials.goldTrimMaterial);
      button.position.set(bx, 0.615, bz);
      this.group.add(button);
    }

    // Cylindrical bolster armrests at both bench ends
    const armrestGeo = new THREE.CylinderGeometry(0.08, 0.08, isVertical ? width : depth - 0.04, 16);
    const arm1 = new THREE.Mesh(armrestGeo, this.materials.tuftedCushionMaterial);
    const arm2 = new THREE.Mesh(armrestGeo, this.materials.tuftedCushionMaterial);
    if (isVertical) {
      arm1.rotation.z = Math.PI / 2;
      arm2.rotation.z = Math.PI / 2;
      arm1.position.set(x, 0.62, z - depth / 2 + 0.12);
      arm2.position.set(x, 0.62, z + depth / 2 - 0.12);
    } else {
      arm1.rotation.x = Math.PI / 2;
      arm2.rotation.x = Math.PI / 2;
      arm1.position.set(x - width / 2 + 0.12, 0.62, z);
      arm2.position.set(x + width / 2 - 0.12, 0.62, z);
    }
    this.group.add(arm1);
    this.group.add(arm2);

    // Turned brass & dark wood legs
    const legMat = this.materials.doorFrameMaterial;
    const legGeo = new THREE.CylinderGeometry(0.038, 0.025, 0.42, 12);
    const legOffsets = isVertical
      ? [[x - width / 2 + 0.08, z - depth / 2 + 0.18], [x + width / 2 - 0.08, z - depth / 2 + 0.18],
         [x - width / 2 + 0.08, z + depth / 2 - 0.18], [x + width / 2 - 0.08, z + depth / 2 - 0.18]]
      : [[x - width / 2 + 0.18, z - depth / 2 + 0.08], [x + width / 2 - 0.18, z - depth / 2 + 0.08],
         [x - width / 2 + 0.18, z + depth / 2 - 0.08], [x + width / 2 - 0.18, z + depth / 2 - 0.08]];

    for (const [lx, lz] of legOffsets) {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(lx, 0.21, lz);
      this.group.add(leg);

      const foot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.035, 0.06, 12),
        this.materials.brassMaterial
      );
      foot.position.set(lx, 0.03, lz);
      this.group.add(foot);
    }
  }

  // 3. Lush Sculpted Botanical Planters
  private buildPlants(): void {
    const plantCoords: [number, number][] = [
      [-9, 8],
      [9, 8],
      [-9, -6],
      [9, -6]
    ];

    const potMat = new THREE.MeshStandardMaterial({
      color: 0xf5f0ea,
      roughness: 0.35,
      metalness: 0.08
    });
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x24170d, roughness: 0.95 });
    const leafMatDark = new THREE.MeshStandardMaterial({ color: 0x1f5c32, roughness: 0.55 });
    const leafMatMid = new THREE.MeshStandardMaterial({ color: 0x2a7a42, roughness: 0.5 });
    const leafMatLight = new THREE.MeshStandardMaterial({ color: 0x3d9e58, roughness: 0.45 });

    for (const [x, y] of plantCoords) {
      const z = -y;

      // Fluted ceramic planter body
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.28, 0.74, 20), potMat);
      pot.position.set(x, 0.37, z);
      pot.castShadow = true;
      pot.receiveShadow = true;
      this.group.add(pot);

      // Gold base ring and rim lip
      const baseRim = new THREE.Mesh(new THREE.TorusGeometry(0.30, 0.035, 12, 24), this.materials.goldTrimMaterial);
      baseRim.rotation.x = Math.PI / 2;
      baseRim.position.set(x, 0.035, z);
      this.group.add(baseRim);

      const topRim = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.04, 12, 24), this.materials.goldTrimMaterial);
      topRim.rotation.x = Math.PI / 2;
      topRim.position.set(x, 0.74, z);
      this.group.add(topRim);

      // Dark potting soil
      const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.39, 0.06, 16), soilMat);
      soil.position.set(x, 0.72, z);
      this.group.add(soil);

      // Multi-tiered organic foliage with varied fan-out and leaf angles
      const foliageGroup = new THREE.Group();
      foliageGroup.position.set(x, 0.74, z);

      // Central stem
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.7, 8), leafMatDark);
      stem.position.set(0, 0.35, 0);
      foliageGroup.add(stem);

      // 10 broad fan-out monstera / fig leaves
      const leafCount = 10;
      for (let i = 0; i < leafCount; i++) {
        const angle = (i / leafCount) * Math.PI * 2 + (i % 2) * 0.25;
        const radius = 0.35 + (i % 3) * 0.12;
        const height = 0.25 + (i / leafCount) * 0.55;
        const mat = i % 3 === 0 ? leafMatLight : i % 2 === 0 ? leafMatMid : leafMatDark;

        const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.55, 6), mat);
        leaf.scale.set(1.4, 0.12, 1.0);
        leaf.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
        leaf.rotation.x = Math.sin(angle) * 0.75;
        leaf.rotation.z = -Math.cos(angle) * 0.75;
        leaf.rotation.y = angle;
        leaf.castShadow = true;
        foliageGroup.add(leaf);
      }

      this.group.add(foliageGroup);
    }
  }

  // 4. Stanchions with Gracefully Draped Royal Velvet Ropes
  private buildStanchionsAndRopes(): void {
    const postGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.95, 14);
    const baseGeo = new THREE.CylinderGeometry(0.16, 0.18, 0.06, 20);
    const postMat = this.materials.brassMaterial;

    // Posts at 1m offset from pillar boundary: x in [-4, 4], y in [-3.5, 3.5]
    // Arranged in closed clockwise loop
    const posts: [number, number][] = [
      [-3.8, -3.2],
      [0, -3.2],
      [3.8, -3.2],
      [3.8, 0],
      [3.8, 3.2],
      [0, 3.2],
      [-3.8, 3.2],
      [-3.8, 0]
    ];

    for (const [x, y] of posts) {
      const z = -y;
      const base = new THREE.Mesh(baseGeo, postMat);
      base.position.set(x, 0.03, z);
      this.group.add(base);

      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(x, 0.505, z);
      this.group.add(post);

      const ringCollar = new THREE.Mesh(new THREE.TorusGeometry(0.048, 0.015, 8, 16), postMat);
      ringCollar.position.set(x, 0.90, z);
      this.group.add(ringCollar);

      const topBall = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 14), postMat);
      topBall.position.set(x, 1.01, z);
      this.group.add(topBall);
    }

    // Connect adjacent stanchion posts with gracefully sagging crimson velvet ropes
    for (let i = 0; i < posts.length; i++) {
      const p1 = posts[i];
      const p2 = posts[(i + 1) % posts.length];
      const p1x = p1[0];
      const p1z = -p1[1];
      const p2x = p2[0];
      const p2z = -p2[1];

      // Quadratic curve sagging in the center
      const midX = (p1x + p2x) / 2;
      const midZ = (p1z + p2z) / 2;
      const sagY = 0.68; // Lowest point of sag

      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(p1x, 0.90, p1z),
        new THREE.Vector3(midX, sagY, midZ),
        new THREE.Vector3(p2x, 0.90, p2z)
      );

      const ropeGeo = new THREE.TubeGeometry(curve, 18, 0.024, 8, false);
      const ropeMesh = new THREE.Mesh(ropeGeo, this.materials.velvetRopeMaterial);
      ropeMesh.castShadow = true;
      this.group.add(ropeMesh);

      // Gold clasp rings at both endpoints
      for (const [cx, cz] of [[p1x, p1z], [p2x, p2z]]) {
        const clasp = new THREE.Mesh(
          new THREE.TorusGeometry(0.038, 0.012, 8, 12),
          this.materials.goldTrimMaterial
        );
        clasp.position.set(cx, 0.90, cz);
        this.group.add(clasp);
      }
    }
  }

  // 5. Doorways & Archways with Classical Columns and Fairy Lights
  private buildDoorways(): void {
    // Grand 8m wide entrance archway between Entry Foyer and Main Hall at y = -7, z = +7
    const pilasterGeo = new THREE.BoxGeometry(0.5, 4.5, 0.5);
    const pilaster1 = new THREE.Mesh(pilasterGeo, this.materials.doorFrameMaterial);
    pilaster1.position.set(-4.0, 2.25, 7.0);
    this.group.add(pilaster1);

    const pilaster2 = new THREE.Mesh(pilasterGeo, this.materials.doorFrameMaterial);
    pilaster2.position.set(4.0, 2.25, 7.0);
    this.group.add(pilaster2);

    // Gold capitals on pilasters
    for (const px of [-4.0, 4.0]) {
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.18, 0.62), this.materials.goldTrimMaterial);
      cap.position.set(px, 3.8, 7.0);
      this.group.add(cap);

      const basePlinth = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.25, 0.62), this.materials.wainscotMaterial);
      basePlinth.position.set(px, 0.125, 7.0);
      this.group.add(basePlinth);
    }

    // Molded arch header beam
    const archHeader = new THREE.Mesh(
      new THREE.BoxGeometry(8.5, 0.45, 0.55),
      this.materials.doorFrameMaterial
    );
    archHeader.position.set(0, 3.85, 7.0);
    this.group.add(archHeader);

    // Classical ornamental keystone in arch center
    const keystone = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.55, 0.62),
      this.materials.goldTrimMaterial
    );
    keystone.position.set(0, 3.95, 7.0);
    this.group.add(keystone);

    // Romantic twinkling fairy lights draped across the entrance archway
    this.buildArchwayFairyLights(0, 7.0, 8.0, 3.9);

    // Corridor exit doorways (3m wide, 2.8m high at y = 12.5, z = -12.5)
    for (const x of [-3, 3]) {
      const doorHeaderGeo = new THREE.BoxGeometry(0.45, 0.35, 3.2);
      const doorHeader = new THREE.Mesh(doorHeaderGeo, this.materials.doorFrameMaterial);
      doorHeader.position.set(x, 2.8, -12.5);
      this.group.add(doorHeader);

      const pediment = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.08, 3.35),
        this.materials.goldTrimMaterial
      );
      pediment.position.set(x, 2.98, -12.5);
      this.group.add(pediment);
    }
  }

  // Twinkling fairy lights string across archway
  private buildArchwayFairyLights(centerX: number, centerZ: number, spanWidth: number, heightY: number): void {
    const bulbCount = 22;
    const bulbGeo = new THREE.SphereGeometry(0.04, 10, 8);
    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xfffae0,
      emissive: 0xffb54a,
      emissiveIntensity: 1.5,
      roughness: 0.2
    });

    for (let i = 0; i < bulbCount; i++) {
      const t = (i / (bulbCount - 1)) - 0.5;
      const x = centerX + t * (spanWidth - 0.6);
      // Soft catenary sag across the arch
      const y = heightY - 0.15 - Math.cos(t * Math.PI) * 0.18;
      const z = centerZ;

      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.set(x, y, z);
      this.group.add(bulb);
      this.fairyLights.push(bulb);
    }
  }

  // 6. Glowing Exit Doors with Arch Portals
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
    doorMesh.rotation.y = Math.PI / 2;
    this.group.add(doorMesh);

    // Glowing architectural portal arch frame surrounding each exit door
    const portalFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 3.0, 3.2),
      new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.6,
        roughness: 0.3
      })
    );
    portalFrame.position.set(x, 1.5, z);
    this.group.add(portalFrame);

    return doorMesh;
  }

  // 7. Foyer Credit Plaque
  private buildFoyerPlaque(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#22150b';
    ctx.fillRect(0, 0, 512, 256);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, 492, 236);

    ctx.strokeStyle = '#8c6b23';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, 472, 216);

    ctx.fillStyle = '#f3d98c';
    ctx.font = 'bold 32px "Cinzel", "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Made by Jenil', 256, 128);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;

    const plaque = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 0.8),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.32, metalness: 0.5 })
    );
    plaque.rotation.x = -Math.PI / 2;
    // Embed in floor at Entry foyer (y = -10.5 -> z = +10.5)
    plaque.position.set(0, 0.015, 10.5);
    plaque.receiveShadow = true;
    this.group.add(plaque);
  }

  // 8. Gallery Atmosphere: Luxury Damask Rugs, Museum Glass Vitrines & Sconces
  private buildGalleryAtmosphere(): void {
    // A. Luxury Damask Carpets & Runners
    // Grand entrance red runner in Entry Foyer
    this.createOrnateDamaskRug(0, -9.5, 3.4, 4.6, '#66162a', '#440f1d');
    // Grand red runner framing south approach to monument
    this.createOrnateDamaskRug(0, -4.8, 4.2, 2.4, '#5e1526', '#3e0c19');
    // Sapphire blue runner in West Photo Alcove
    this.createOrnateDamaskRug(-13.0, 0.0, 3.4, 1.4, '#1b324d', '#112033');
    // Plum & Rose runner in East Video Alcove
    this.createOrnateDamaskRug(13.0, -3.0, 3.4, 1.4, '#4d1c3a', '#331126');
    // Emerald runner approaching Decision Alcove
    this.createOrnateDamaskRug(0, 10.2, 3.8, 4.2, '#18472f', '#0f2d1e');

    // B. Wall Sconces with Brass & Opal Glass
    const sconces: [number, number, number][] = [
      [-9.78, 2.5, -5.0], [-9.78, 2.5, -1.3], [-9.78, 2.5, 3.8],
      [9.78, 2.5, -4.5], [9.78, 2.5, -0.2], [9.78, 2.5, 4.4],
      [-13, 2.5, -1.9], [-13, 2.5, 1.9], [13, 2.5, -4.9], [13, 2.5, -1.2]
    ];
    for (const [x, y, z] of sconces) this.createSconce(x, y, z);

    // C. Pendant Globes framing the Central Skylight
    for (const [x, z] of [[-4.5, -3.4], [4.5, -3.4], [-4.5, 3.4], [4.5, 3.4]]) {
      this.createPendant(x, z);
    }

    // D. Glass Exhibition Vitrines with Rotating Cute Romantic Keepsakes
    this.createGlassDisplayVitrine(-14.6, 0.0, 'heart'); // West Alcove: Glowing Rose Quartz Heart
    this.createGlassDisplayVitrine(14.6, -3.0, 'star');  // East Alcove: Iridescent Star Relic
    this.createGlassDisplayVitrine(0.0, 14.2, 'flower'); // Decision Alcove: Luminous Crystal Blossom against north wall
  }

  private createOrnateDamaskRug(planX: number, planY: number, width: number, depth: number, primaryHex: string, borderHex: string): void {
    const tex = typeof document !== 'undefined' ? createDamaskRugTexture(primaryHex, borderHex) : null;
    const rugMat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.85,
      metalness: 0.04
    });

    const rug = new THREE.Mesh(new THREE.BoxGeometry(width, 0.02, depth), rugMat);
    rug.position.set(planX, 0.015, -planY);
    rug.receiveShadow = true;
    this.group.add(rug);

    // Polished gold border piping
    const edgeMat = this.materials.goldTrimMaterial;
    const edgeY = 0.03;
    const edgeZ = -planY;
    for (const [w, d, x, z] of [
      [width, 0.04, planX, edgeZ - depth / 2],
      [width, 0.04, planX, edgeZ + depth / 2],
      [0.04, depth, planX - width / 2, edgeZ],
      [0.04, depth, planX + width / 2, edgeZ]
    ]) {
      const edge = new THREE.Mesh(new THREE.BoxGeometry(w, 0.016, d), edgeMat);
      edge.position.set(x, edgeY, z);
      this.group.add(edge);
    }
  }

  private createSconce(x: number, y: number, z: number): void {
    const plate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 0.035, 16),
      this.materials.brassMaterial
    );
    plate.rotation.x = Math.PI / 2;
    plate.position.set(x, y, z);
    this.group.add(plate);

    const shadeMat = new THREE.MeshStandardMaterial({
      color: 0xffe2bc,
      emissive: 0xffa055,
      emissiveIntensity: 1.4,
      roughness: 0.25
    });
    const shade = new THREE.Mesh(new THREE.SphereGeometry(0.12, 18, 12), shadeMat);
    shade.position.set(x, y, z);
    this.group.add(shade);
    this.glowingOrbs.push(shade);

    const light = new THREE.PointLight(0xffbe7a, 0.38, 4.2, 2);
    light.position.set(x, y, z);
    this.group.add(light);
    this.accentLights.push(light);
  }

  private createPendant(x: number, z: number): void {
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.15, 8), this.materials.brassMaterial);
    cord.position.set(x, 3.82, z);
    this.group.add(cord);

    const globeMat = new THREE.MeshStandardMaterial({
      color: 0xffe8c2,
      emissive: 0xffad55,
      emissiveIntensity: 1.2,
      roughness: 0.18,
      metalness: 0.08
    });
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.20, 20, 14), globeMat);
    globe.position.set(x, 3.22, z);
    globe.castShadow = true;
    this.group.add(globe);
    this.glowingOrbs.push(globe);

    const light = new THREE.PointLight(0xffc885, 0.48, 5.8, 2);
    light.position.copy(globe.position);
    this.group.add(light);
    this.accentLights.push(light);
  }

  // Elegant Glass Exhibition Vitrine with glowing rotating keepsake
  private createGlassDisplayVitrine(planX: number, planY: number, artifactType: 'heart' | 'star' | 'flower'): void {
    const z = -planY;
    const vitrineGroup = new THREE.Group();
    vitrineGroup.position.set(planX, 0, z);

    // 1. Mahogany Pedestal Base
    const pedestal = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.95, 0.72),
      this.materials.wainscotMaterial
    );
    pedestal.position.set(0, 0.475, 0);
    pedestal.castShadow = true;
    pedestal.receiveShadow = true;
    vitrineGroup.add(pedestal);

    // Gold trim band around pedestal
    const trim = new THREE.Mesh(
      new THREE.BoxGeometry(0.76, 0.04, 0.76),
      this.materials.goldTrimMaterial
    );
    trim.position.set(0, 0.93, 0);
    vitrineGroup.add(trim);

    // 2. Velvet Cushion inside case
    const cushion = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.08, 0.55),
      this.materials.tuftedCushionMaterial
    );
    cushion.position.set(0, 0.99, 0);
    vitrineGroup.add(cushion);

    // 3. Crystal Clear Glass Cube Vitrine
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.05,
      metalness: 0.1,
      transparent: true,
      opacity: 0.32
    });
    const glassCube = new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 0.72, 0.68),
      glassMat
    );
    glassCube.position.set(0, 1.39, 0);
    vitrineGroup.add(glassCube);

    // 4. Rotating Cute Romantic Keepsake
    let artifact: THREE.Object3D;
    if (artifactType === 'heart') {
      const heartMat = new THREE.MeshStandardMaterial({
        color: 0xff6688,
        emissive: 0xff3366,
        emissiveIntensity: 0.8,
        metalness: 0.4,
        roughness: 0.2
      });
      // Torus knot resembling an infinity heart
      artifact = new THREE.Mesh(new THREE.TorusKnotGeometry(0.12, 0.04, 48, 8, 2, 3), heartMat);
    } else if (artifactType === 'star') {
      const starMat = new THREE.MeshStandardMaterial({
        color: 0xffcc33,
        emissive: 0xff9900,
        emissiveIntensity: 0.8,
        metalness: 0.7,
        roughness: 0.2
      });
      artifact = new THREE.Mesh(new THREE.OctahedronGeometry(0.15, 0), starMat);
    } else {
      const flowerMat = new THREE.MeshStandardMaterial({
        color: 0xff88bb,
        emissive: 0xff5599,
        emissiveIntensity: 0.8,
        metalness: 0.3,
        roughness: 0.25
      });
      artifact = new THREE.Mesh(new THREE.IcosahedronGeometry(0.14, 0), flowerMat);
    }

    artifact.position.set(0, 1.26, 0);
    vitrineGroup.add(artifact);
    this.rotatingArtifacts.push(artifact);

    // Mini interior spotlight illuminating the artifact from top of glass
    const miniSpot = new THREE.PointLight(0xfffae0, 0.6, 2.5, 2);
    miniSpot.position.set(0, 1.68, 0);
    vitrineGroup.add(miniSpot);

    this.group.add(vitrineGroup);
  }

  public update(time: number): void {
    // Pulse exit door glow gently
    const pulse1 = 0.75 + Math.sin(time * 2.5) * 0.2;
    const pulse2 = 0.75 + Math.cos(time * 2.5) * 0.2;
    (this.exit1Door.material as THREE.MeshBasicMaterial).opacity = pulse1;
    (this.exit2Door.material as THREE.MeshBasicMaterial).opacity = pulse2;

    // Warm breathing pulse on sconce and pendant accent lights
    const warmPulse = 0.82 + Math.sin(time * 1.7) * 0.12;
    for (const light of this.accentLights) {
      light.intensity = warmPulse * (light.distance > 5 ? 0.48 : 0.38);
    }

    // Gentle rotation of the romantic vitrine keepsakes
    for (let i = 0; i < this.rotatingArtifacts.length; i++) {
      const art = this.rotatingArtifacts[i];
      art.rotation.y += 0.012 + i * 0.003;
      art.rotation.x = Math.sin(time * 1.5 + i) * 0.15;
    }

    // Twinkling fairy lights sparkle
    for (let i = 0; i < this.fairyLights.length; i++) {
      const bulb = this.fairyLights[i];
      const mat = bulb.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 1.2 + Math.sin(time * 3.5 + i * 1.3) * 0.5;
    }
  }
}
