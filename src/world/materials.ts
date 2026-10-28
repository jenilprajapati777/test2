import * as THREE from 'three';

/**
 * Procedural canvas textures generator for luxury museum aesthetics
 */

// Procedural warm herringbone parquet floor texture
export function createParquetTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#b37d4e';
  ctx.fillRect(0, 0, 1024, 1024);

  const plankW = 32;
  const plankH = 128;
  const tones = ['#a36e40', '#b88251', '#976235', '#be8956', '#aa7445', '#af7948'];

  // Draw herringbone interlocking rows
  for (let y = -plankH; y < 1024 + plankH; y += plankW * 2) {
    for (let x = -plankH; x < 1024 + plankH; x += plankH) {
      // Slanted left plank
      const tone1 = tones[Math.abs(Math.floor(x * 13 + y * 7)) % tones.length];
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = tone1;
      ctx.fillRect(0, 0, plankH - 1.5, plankW - 1.5);

      // Fine wood fibers
      ctx.strokeStyle = 'rgba(70, 40, 18, 0.14)';
      ctx.lineWidth = 1;
      for (let f = 3; f < plankW; f += 6) {
        ctx.beginPath();
        ctx.moveTo(0, f);
        ctx.bezierCurveTo(plankH * 0.3, f + 1, plankH * 0.7, f - 1, plankH, f);
        ctx.stroke();
      }
      ctx.restore();

      // Slanted right plank
      const tone2 = tones[Math.abs(Math.floor(x * 19 + y * 11)) % tones.length];
      ctx.save();
      ctx.translate(x + plankH / 2, y + plankW);
      ctx.fillStyle = tone2;
      ctx.fillRect(0, 0, plankW - 1.5, plankH - 1.5);

      // Wood fibers
      ctx.strokeStyle = 'rgba(70, 40, 18, 0.14)';
      ctx.lineWidth = 1;
      for (let f = 3; f < plankW; f += 6) {
        ctx.beginPath();
        ctx.moveTo(f, 0);
        ctx.bezierCurveTo(f + 1, plankH * 0.3, f - 1, plankH * 0.7, f, plankH);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // Polished wax satin sheen overlay
  const grad = ctx.createRadialGradient(512, 512, 50, 512, 512, 650);
  grad.addColorStop(0, 'rgba(255, 235, 200, 0.08)');
  grad.addColorStop(1, 'rgba(60, 30, 10, 0.10)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 1024);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 5);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural plaster wall texture
export function createWallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#faf6f0'; // Warm gallery off-white linen
  ctx.fillRect(0, 0, 512, 512);

  // Subtle noise for plaster texture
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 10;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 2);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural Calacatta marble texture for monument pillar
export function createMarbleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f3f0ea';
  ctx.fillRect(0, 0, 512, 512);

  // Soft clouded tones
  for (let i = 0; i < 20; i++) {
    const rad = ctx.createRadialGradient(
      Math.random() * 512, Math.random() * 512, 10,
      Math.random() * 512, Math.random() * 512, 180
    );
    rad.addColorStop(0, 'rgba(230, 222, 210, 0.45)');
    rad.addColorStop(1, 'rgba(243, 240, 234, 0)');
    ctx.fillStyle = rad;
    ctx.fillRect(0, 0, 512, 512);
  }

  // Soft golden-grey veins
  const veinColors = ['rgba(145, 132, 118, 0.35)', 'rgba(195, 160, 115, 0.28)', 'rgba(110, 100, 90, 0.22)'];
  for (let i = 0; i < 12; i++) {
    ctx.strokeStyle = veinColors[i % veinColors.length];
    ctx.lineWidth = 1 + Math.random() * 3.5;
    ctx.beginPath();
    let x = Math.random() * 512;
    let y = 0;
    ctx.moveTo(x, y);
    while (y < 512) {
      const stepY = 40 + Math.random() * 70;
      const stepX = (Math.random() - 0.48) * 80;
      ctx.bezierCurveTo(x + stepX * 0.5, y + stepY * 0.3, x + stepX, y + stepY * 0.7, x + stepX, y + stepY);
      x += stepX;
      y += stepY;
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural ornate woven damask rug texture
export function createDamaskRugTexture(primaryHex: string, borderHex: string, goldHex: string = '#d4af37'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Plush velvet field
  ctx.fillStyle = primaryHex;
  ctx.fillRect(0, 0, 512, 512);

  // Outer border
  ctx.fillStyle = borderHex;
  ctx.fillRect(16, 16, 480, 480);
  ctx.fillStyle = primaryHex;
  ctx.fillRect(44, 44, 424, 424);

  // Gold filigree border bands
  ctx.strokeStyle = goldHex;
  ctx.lineWidth = 4;
  ctx.strokeRect(16, 16, 480, 480);
  ctx.strokeRect(44, 44, 424, 424);

  // Corner floral flourishes
  for (const [cx, cy] of [[70, 70], [442, 70], [70, 442], [442, 442]]) {
    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, Math.PI * 2);
    ctx.strokeStyle = goldHex;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.fillStyle = goldHex;
    ctx.fill();
  }

  // Central royal medallion
  ctx.beginPath();
  ctx.ellipse(256, 256, 120, 80, 0, 0, Math.PI * 2);
  ctx.strokeStyle = goldHex;
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(256, 256, 100, 64, 0, 0, Math.PI * 2);
  ctx.fillStyle = borderHex;
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(256, 256, 32, 0, Math.PI * 2);
  ctx.fillStyle = goldHex;
  ctx.fill();

  // Subtle woven fiber texture overlay
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  for (let i = 0; i < 512; i += 4) {
    ctx.fillRect(i, 0, 1, 512);
    ctx.fillRect(0, i, 512, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export class MaterialPalette {
  public floorMaterial: THREE.MeshStandardMaterial;
  public wallMaterial: THREE.MeshStandardMaterial;
  public wainscotMaterial: THREE.MeshStandardMaterial;
  public ceilingMaterial: THREE.MeshStandardMaterial;
  public beamMaterial: THREE.MeshStandardMaterial;
  public mouldingMaterial: THREE.MeshStandardMaterial;
  public marbleMaterial: THREE.MeshStandardMaterial;
  public woodMaterial: THREE.MeshStandardMaterial;
  public frameMaterial: THREE.MeshStandardMaterial;
  public brassMaterial: THREE.MeshStandardMaterial;
  public goldTrimMaterial: THREE.MeshStandardMaterial;
  public doorFrameMaterial: THREE.MeshStandardMaterial;
  public velvetRopeMaterial: THREE.MeshStandardMaterial;
  public tuftedCushionMaterial: THREE.MeshStandardMaterial;
  public skylightFrameMaterial: THREE.MeshStandardMaterial;
  public skylightGlassMaterial: THREE.MeshStandardMaterial;

  constructor() {
    const parquetTex = typeof document !== 'undefined' ? createParquetTexture() : null;
    const wallTex = typeof document !== 'undefined' ? createWallTexture() : null;
    const marbleTex = typeof document !== 'undefined' ? createMarbleTexture() : null;

    this.floorMaterial = new THREE.MeshStandardMaterial({
      map: parquetTex,
      color: 0xdfb589,
      roughness: 0.32,
      metalness: 0.04
    });

    this.wallMaterial = new THREE.MeshStandardMaterial({
      map: wallTex,
      color: 0xfdfaf5,
      roughness: 0.88,
      metalness: 0.02
    });

    this.wainscotMaterial = new THREE.MeshStandardMaterial({
      color: 0x482b19, // Deep warm walnut boiserie paneling
      roughness: 0.42,
      metalness: 0.06
    });

    this.ceilingMaterial = new THREE.MeshStandardMaterial({
      color: 0xf1ece4,
      roughness: 0.92,
      metalness: 0.0
    });

    this.beamMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d2313, // Rich dark oak architectural beams
      roughness: 0.55,
      metalness: 0.04
    });

    this.mouldingMaterial = new THREE.MeshStandardMaterial({
      color: 0xf3eee5, // Classical off-white plaster moulding
      roughness: 0.52,
      metalness: 0.03
    });

    this.marbleMaterial = new THREE.MeshStandardMaterial({
      map: marbleTex,
      color: 0xf3efe8,
      roughness: 0.22,
      metalness: 0.06
    });

    this.woodMaterial = new THREE.MeshStandardMaterial({
      color: 0x543219,
      roughness: 0.48,
      metalness: 0.05
    });

    this.frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x2e1a0d, // Dark mahogany picture frame
      roughness: 0.38,
      metalness: 0.12
    });

    this.brassMaterial = new THREE.MeshStandardMaterial({
      color: 0xd8b248, // Museum-grade polished brass
      roughness: 0.24,
      metalness: 0.82
    });

    this.goldTrimMaterial = new THREE.MeshStandardMaterial({
      color: 0xebb948,
      roughness: 0.20,
      metalness: 0.90
    });

    this.doorFrameMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a1c11,
      roughness: 0.42,
      metalness: 0.08
    });

    this.velvetRopeMaterial = new THREE.MeshStandardMaterial({
      color: 0x82162a, // Rich royal burgundy velvet rope
      roughness: 0.78,
      metalness: 0.04
    });

    this.tuftedCushionMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a1827, // Button-tufted velvet cushion
      roughness: 0.65,
      metalness: 0.05
    });

    this.skylightFrameMaterial = new THREE.MeshStandardMaterial({
      color: 0x1f2125, // Wrought architectural iron
      roughness: 0.35,
      metalness: 0.7
    });

    this.skylightGlassMaterial = new THREE.MeshStandardMaterial({
      color: 0xe6f3ff,
      roughness: 0.1,
      metalness: 0.15,
      transparent: true,
      opacity: 0.45
    });
  }
}
