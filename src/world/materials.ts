import * as THREE from 'three';

/**
 * Procedural canvas textures generator
 */

// Procedural parquet floor texture
export function createParquetTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#b38256';
  ctx.fillRect(0, 0, 1024, 1024);

  // Draw herringbone or parquet planks
  const tileSize = 64;
  for (let x = 0; x < 1024; x += tileSize) {
    for (let y = 0; y < 1024; y += tileSize) {
      const isAlt = (Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2 === 0;
      ctx.fillStyle = isAlt ? '#a67246' : '#bd8c5e';
      ctx.fillRect(x + 1, y + 1, tileSize - 2, tileSize - 2);

      // Wood grain lines
      ctx.strokeStyle = isAlt ? 'rgba(120, 75, 40, 0.15)' : 'rgba(150, 95, 55, 0.15)';
      ctx.lineWidth = 1;
      for (let i = 4; i < tileSize; i += 8) {
        ctx.beginPath();
        if (isAlt) {
          ctx.moveTo(x + i, y);
          ctx.lineTo(x + i, y + tileSize);
        } else {
          ctx.moveTo(x, y + i);
          ctx.lineTo(x + tileSize, y + i);
        }
        ctx.stroke();
      }
    }
  }

  // Border plank grooves
  ctx.strokeStyle = 'rgba(60, 35, 15, 0.4)';
  ctx.lineWidth = 2;
  for (let x = 0; x <= 1024; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
    ctx.stroke();
  }
  for (let y = 0; y <= 1024; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural plaster wall texture
export function createWallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f8f4ec'; // Warm gallery off-white
  ctx.fillRect(0, 0, 512, 512);

  // Subtle noise for plaster texture
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 12;
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

// Procedural marble texture for pillar
export function createMarbleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#e8e6e3';
  ctx.fillRect(0, 0, 512, 512);

  // Soft marble veins
  ctx.strokeStyle = 'rgba(160, 155, 150, 0.4)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * 512, 0);
    ctx.bezierCurveTo(
      Math.random() * 512, 170,
      Math.random() * 512, 340,
      Math.random() * 512, 512
    );
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export class MaterialPalette {
  public floorMaterial: THREE.MeshStandardMaterial;
  public wallMaterial: THREE.MeshStandardMaterial;
  public ceilingMaterial: THREE.MeshStandardMaterial;
  public beamMaterial: THREE.MeshStandardMaterial;
  public mouldingMaterial: THREE.MeshStandardMaterial;
  public marbleMaterial: THREE.MeshStandardMaterial;
  public woodMaterial: THREE.MeshStandardMaterial;
  public frameMaterial: THREE.MeshStandardMaterial;
  public brassMaterial: THREE.MeshStandardMaterial;
  public doorFrameMaterial: THREE.MeshStandardMaterial;

  constructor() {
    const parquetTex = typeof document !== 'undefined' ? createParquetTexture() : null;
    const wallTex = typeof document !== 'undefined' ? createWallTexture() : null;
    const marbleTex = typeof document !== 'undefined' ? createMarbleTexture() : null;

    this.floorMaterial = new THREE.MeshStandardMaterial({
      map: parquetTex,
      color: 0xdfb890,
      roughness: 0.35,
      metalness: 0.05
    });

    this.wallMaterial = new THREE.MeshStandardMaterial({
      map: wallTex,
      color: 0xfdfaf4,
      roughness: 0.85,
      metalness: 0.02
    });

    this.ceilingMaterial = new THREE.MeshStandardMaterial({
      color: 0xede8e1,
      roughness: 0.9,
      metalness: 0.0
    });

    this.beamMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a2e18,
      roughness: 0.6,
      metalness: 0.05
    });

    this.mouldingMaterial = new THREE.MeshStandardMaterial({
      color: 0xe6e0d5,
      roughness: 0.5,
      metalness: 0.05
    });

    this.marbleMaterial = new THREE.MeshStandardMaterial({
      map: marbleTex,
      color: 0xf0ece6,
      roughness: 0.25,
      metalness: 0.08
    });

    this.woodMaterial = new THREE.MeshStandardMaterial({
      color: 0x5c381e,
      roughness: 0.5,
      metalness: 0.05
    });

    this.frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x362113, // Rich dark wood frame
      roughness: 0.4,
      metalness: 0.1
    });

    this.brassMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // Polished brass
      roughness: 0.3,
      metalness: 0.75
    });

    this.doorFrameMaterial = new THREE.MeshStandardMaterial({
      color: 0x2e2015,
      roughness: 0.4,
      metalness: 0.1
    });
  }
}
