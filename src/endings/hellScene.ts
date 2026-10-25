import * as THREE from 'three';
import { CharacterModel } from '../characters/characterFactory.js';
import { ContentSchema } from '../config/content.js';

export interface HellSceneCallbacks {
  onYesRetry: () => void;
  onNoFarewell?: () => void;
}

export class HellScene {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public uiOverlay: HTMLElement;

  private characterModel: CharacterModel;
  private content: ContentSchema;
  private callbacks: HellSceneCallbacks;

  private cylinderMesh: THREE.Mesh;
  private lavaTexture: THREE.CanvasTexture | null = null;
  private emberPoints: THREE.Points;
  private emberDrift: Float32Array;
  private bottomDisc: THREE.Mesh;
  private bottomDiscTexture: THREE.CanvasTexture | null = null;
  private flameSprites: THREE.Sprite[] = [];
  private lights: THREE.PointLight[] = [];

  private characterVelocity = 0; // m/s downwards
  private fallDistance = 0; // Accumulated distance fallen
  private elapsedTime = 0;
  private isActiveFlag = false;

  private resultTextEl: HTMLElement | null = null;
  private retryPanelEl: HTMLElement | null = null;

  constructor(
    characterModel: CharacterModel,
    content: ContentSchema,
    callbacks: HellSceneCallbacks
  ) {
    this.characterModel = characterModel;
    this.content = content;
    this.callbacks = callbacks;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x180300, 0.009);

    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 500);

    // Cavern Shaft with Glowing Magma Fractures
    this.cylinderMesh = this.createShaft();
    this.scene.add(this.cylinderMesh);

    // Swirling Fiery Embers (600 particles)
    const { points, drift } = this.createEmbers();
    this.emberPoints = points;
    this.emberDrift = drift;
    this.scene.add(this.emberPoints);

    // Boiling Molten Lava Sea Below
    this.bottomDisc = this.createBottomDisc();
    this.scene.add(this.bottomDisc);

    this.createFlameSprites();
    this.createLights();

    // Add tumbling character
    this.characterModel.group.position.set(0, 0, 0);
    this.scene.add(this.characterModel.group);

    // Camera initial position: 4.2m above character looking down into the abyss
    this.camera.position.set(0, 4.2, 0.8);
    this.camera.lookAt(0, 0, 0);

    this.uiOverlay = this.createUiOverlay();
  }

  private createShaft(): THREE.Mesh {
    // Open-ended cylinder, radius 7.5 m, height 350 m, inside faces
    const geo = new THREE.CylinderGeometry(7.5, 7.5, 350, 36, 1, true);

    let canvasTex: THREE.CanvasTexture | null = null;
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d')!;

      // Deep dark volcanic obsidian rock base
      ctx.fillStyle = '#0f0402';
      ctx.fillRect(0, 0, 512, 1024);

      // Craggy rock stippling & texture
      for (let i = 0; i < 2000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 1024;
        const radius = Math.random() * 3 + 1;
        ctx.fillStyle = Math.random() > 0.5 ? '#1a0804' : '#0a0201';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Layer 1: Broad glowing volcanic fissure glow
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#ff3300';
      for (let i = 0; i < 35; i++) {
        ctx.strokeStyle = '#cc2200';
        ctx.lineWidth = Math.random() * 10 + 6;
        ctx.beginPath();
        let x = Math.random() * 512;
        let y = Math.random() * 1024;
        ctx.moveTo(x, y);
        for (let j = 0; j < 6; j++) {
          x += (Math.random() - 0.5) * 90;
          y += Math.random() * 130 + 30;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Layer 2: Molten orange-yellow core fissures
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ffbb00';
      for (let i = 0; i < 40; i++) {
        ctx.strokeStyle = i % 3 === 0 ? '#ffea33' : '#ff6600';
        ctx.lineWidth = Math.random() * 4 + 2;
        ctx.beginPath();
        let x = Math.random() * 512;
        let y = Math.random() * 1024;
        ctx.moveTo(x, y);
        for (let j = 0; j < 6; j++) {
          x += (Math.random() - 0.5) * 80;
          y += Math.random() * 120 + 25;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.shadowBlur = 0;

      canvasTex = new THREE.CanvasTexture(canvas);
      canvasTex.wrapS = THREE.RepeatWrapping;
      canvasTex.wrapT = THREE.RepeatWrapping;
      canvasTex.repeat.set(4, 14);
      this.lavaTexture = canvasTex;
    }

    const mat = new THREE.MeshStandardMaterial({
      map: canvasTex,
      emissiveMap: canvasTex,
      emissive: new THREE.Color(0xff3311),
      emissiveIntensity: 0.85,
      roughness: 0.82,
      metalness: 0.15,
      side: THREE.BackSide
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, 0, 0);
    return mesh;
  }

  private createEmbers(): { points: THREE.Points; drift: Float32Array } {
    // 600 ember particles streaming upward past camera in a swirling firestorm
    const count = 600;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const drift = new Float32Array(count * 3); // [orbitAngle, orbitRadius, speedMultiplier]

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 6.5;
      const y = (Math.random() - 0.5) * 100;

      positions[i * 3 + 0] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      // Color variation: Gold, Blazing Orange, Intense Red
      const t = Math.random();
      if (t > 0.6) {
        colors[i * 3 + 0] = 1.0;
        colors[i * 3 + 1] = 0.85;
        colors[i * 3 + 2] = 0.2; // Gold
      } else if (t > 0.25) {
        colors[i * 3 + 0] = 1.0;
        colors[i * 3 + 1] = 0.45;
        colors[i * 3 + 2] = 0.05; // Bright Orange
      } else {
        colors[i * 3 + 0] = 0.95;
        colors[i * 3 + 1] = 0.15;
        colors[i * 3 + 2] = 0.02; // Crimson
      }

      drift[i * 3 + 0] = angle;
      drift[i * 3 + 1] = radius;
      drift[i * 3 + 2] = 0.7 + Math.random() * 0.8;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.35,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    return { points: new THREE.Points(geo, mat), drift };
  }

  private createBottomDisc(): THREE.Mesh {
    // Dynamic molten lava lake at bottom
    const geo = new THREE.CircleGeometry(7.4, 48);

    let canvasTex: THREE.CanvasTexture | null = null;
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d')!;

      // Blazing radial molten lake gradient
      const grad = ctx.createRadialGradient(256, 256, 10, 256, 256, 256);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.15, '#ffea44');
      grad.addColorStop(0.45, '#ff5500');
      grad.addColorStop(0.8, '#aa1100');
      grad.addColorStop(1, '#330501');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);

      // Floating crust islands
      for (let i = 0; i < 30; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const r = Math.random() * 40 + 15;
        ctx.fillStyle = 'rgba(25, 8, 4, 0.75)';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      canvasTex = new THREE.CanvasTexture(canvas);
      this.bottomDiscTexture = canvasTex;
    }

    const mat = new THREE.MeshBasicMaterial({
      map: canvasTex,
      color: 0xff6600,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(0, -165, 0);
    return mesh;
  }

  private createFlameSprites(): void {
    if (typeof document === 'undefined') return;

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.25, '#ffcc00');
    grad.addColorStop(0.55, '#ff4400');
    grad.addColorStop(0.85, 'rgba(180, 20, 0, 0.4)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({
      map: tex,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.8
    });

    for (let i = 0; i < 40; i++) {
      const sprite = new THREE.Sprite(mat);
      const angle = (i / 40) * Math.PI * 2;
      const radius = 7.1;
      sprite.position.set(
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 140,
        Math.sin(angle) * radius
      );
      sprite.scale.set(3.2, 3.2, 3.2);
      this.scene.add(sprite);
      this.flameSprites.push(sprite);
    }
  }

  private createLights(): void {
    // 3 dynamic pulsing fiery lights
    const l1 = new THREE.PointLight(0xff7700, 3.5, 30);
    const l2 = new THREE.PointLight(0xff2200, 4.0, 35);
    const l3 = new THREE.PointLight(0xffaa00, 4.5, 40);

    this.scene.add(l1);
    this.scene.add(l2);
    this.scene.add(l3);

    this.lights.push(l1, l2, l3);
  }

  private createUiOverlay(): HTMLElement {
    const overlay = document.createElement('div');
    overlay.className = 'ending-overlay';
    overlay.id = 'hell-ui-overlay';
    overlay.style.display = 'none';

    overlay.innerHTML = `
      <div class="hell-result-text" id="hell-result-text" style="display: none;">
        ${this.content.exits.exit2.resultText}
      </div>

      <div class="hell-retry-panel" id="hell-retry-panel" style="display: none;">
        <h2 class="hell-retry-question" id="hell-retry-question">${this.content.exits.exit2.retryQuestion}</h2>
        <div class="hell-buttons" id="hell-buttons-container">
          <button class="primary-btn" id="btn-hell-yes">${this.content.exits.exit2.yesLabel}</button>
          <button class="primary-btn btn-secondary" id="btn-hell-no">${this.content.exits.exit2.noLabel}</button>
        </div>
      </div>
    `;

    this.resultTextEl = overlay.querySelector('#hell-result-text');
    this.retryPanelEl = overlay.querySelector('#hell-retry-panel');

    const btnYes = overlay.querySelector('#btn-hell-yes') as HTMLButtonElement;
    const btnNo = overlay.querySelector('#btn-hell-no') as HTMLButtonElement;
    const questionEl = overlay.querySelector('#hell-retry-question') as HTMLElement;
    const btnContainer = overlay.querySelector('#hell-buttons-container') as HTMLElement;

    btnYes?.addEventListener('click', () => {
      this.callbacks.onYesRetry();
    });

    btnNo?.addEventListener('click', () => {
      questionEl.textContent = this.content.exits.exit2.farewellText;
      btnContainer.innerHTML = `
        <button class="primary-btn" id="btn-hell-try-again">${this.content.exits.exit2.tryAgainLabel}</button>
      `;
      btnContainer.querySelector('#btn-hell-try-again')?.addEventListener('click', () => {
        this.callbacks.onYesRetry();
      });
      if (this.callbacks.onNoFarewell) {
        this.callbacks.onNoFarewell();
      }
    });

    return overlay;
  }

  public activate(): void {
    this.isActiveFlag = true;
    this.elapsedTime = 0;
    this.characterVelocity = 0;
    this.fallDistance = 0;
    this.uiOverlay.style.display = 'block';
    if (this.resultTextEl) this.resultTextEl.style.display = 'none';
    if (this.retryPanelEl) this.retryPanelEl.style.display = 'none';
  }

  public update(dt: number): void {
    if (!this.isActiveFlag) return;

    this.elapsedTime += dt;

    // Fall velocity eases 0 -> 32 m/s over 3 seconds
    if (this.elapsedTime < 3.0) {
      this.characterVelocity = (this.elapsedTime / 3.0) * 32;
    } else {
      this.characterVelocity = 32;
    }

    this.fallDistance += this.characterVelocity * dt;

    // Scroll volcanic lava wall texture upwards
    if (this.lavaTexture) {
      this.lavaTexture.offset.y = (this.fallDistance * 0.025) % 1;
    }

    // Swirl & rush ember particles upward in a cyclonic vortex
    const attr = this.emberPoints.geometry.attributes.position as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const count = arr.length / 3;

    for (let i = 0; i < count; i++) {
      // Swirl angle
      this.emberDrift[i * 3 + 0] += dt * 2.2 * this.emberDrift[i * 3 + 2];
      const angle = this.emberDrift[i * 3 + 0];
      const radius = this.emberDrift[i * 3 + 1];

      arr[i * 3 + 0] = Math.cos(angle) * radius;
      arr[i * 3 + 2] = Math.sin(angle) * radius;

      // Fast upward rush
      arr[i * 3 + 1] += this.characterVelocity * dt * 1.6 * this.emberDrift[i * 3 + 2];
      if (arr[i * 3 + 1] > 35) {
        arr[i * 3 + 1] = -55;
      }
    }
    attr.needsUpdate = true;

    // Dramatic multi-axis character tumble with aerodynamic flailing
    this.characterModel.group.rotation.x += dt * 3.8;
    this.characterModel.group.rotation.y += dt * 1.5;
    this.characterModel.group.rotation.z += dt * 2.9;
    this.characterModel.animator.setFallingPose(this.elapsedTime);

    // Realistic volcanic camera shake (low rumble + sharp shudder)
    const shakeAmp = Math.min(0.22, 0.06 + this.elapsedTime * 0.035);
    const shakeX = (Math.sin(this.elapsedTime * 28) + Math.cos(this.elapsedTime * 19)) * shakeAmp * 0.5;
    const shakeZ = (Math.cos(this.elapsedTime * 25) + Math.sin(this.elapsedTime * 21)) * shakeAmp * 0.5;

    // Camera tracks above player looking into the deep fiery crater
    this.camera.position.set(shakeX, 4.0 - (this.fallDistance * 0.05), 0.8 + shakeZ);
    this.camera.rotation.z = Math.sin(this.elapsedTime * 1.8) * 0.1;
    this.camera.lookAt(0, -(this.fallDistance * 0.05), 0);

    // Multi-frequency flickering firelight
    const f1 = Math.sin(this.elapsedTime * 14) * 0.5 + Math.cos(this.elapsedTime * 9) * 0.5;
    const f2 = Math.cos(this.elapsedTime * 17) * 0.5 + Math.sin(this.elapsedTime * 11) * 0.5;

    this.lights[0].intensity = 3.5 + f1 * 1.2;
    this.lights[0].position.set(Math.sin(this.elapsedTime * 8) * 2.5, 1.2, Math.cos(this.elapsedTime * 8) * 2.5);

    this.lights[1].intensity = 4.0 + f2 * 1.5;
    this.lights[1].position.set(Math.cos(this.elapsedTime * 10) * 3, -1.5, Math.sin(this.elapsedTime * 10) * 3);

    this.lights[2].intensity = 4.5 + Math.sin(this.elapsedTime * 20) * 1.0;
    this.lights[2].position.set(0, -3.5, 0);

    // Expand bottom lava sea to simulate plunging closer
    const discScale = Math.min(2.4, 1.0 + this.elapsedTime * 0.18);
    this.bottomDisc.scale.set(discScale, discScale, discScale);
    this.bottomDisc.rotation.z += dt * 0.3;

    // Atmospheric volcanic fog density ramps up
    if (this.scene.fog && this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.density = Math.min(0.025, 0.009 + this.elapsedTime * 0.0025);
    }

    // Timings
    if (this.elapsedTime >= 3.0 && this.resultTextEl && this.resultTextEl.style.display === 'none') {
      this.resultTextEl.style.display = 'block';
    }

    if (this.elapsedTime >= 6.0 && this.retryPanelEl && this.retryPanelEl.style.display === 'none') {
      this.retryPanelEl.style.display = 'block';
    }
  }

  public getCameraY(): number {
    return this.camera.position.y;
  }

  public getParticleCount(): number {
    return 600;
  }

  public isActive(): boolean {
    return this.isActiveFlag;
  }

  public dispose(): void {
    this.isActiveFlag = false;
    this.uiOverlay.style.display = 'none';

    // Remove falling character from hell scene and dispose its resources
    this.scene.remove(this.characterModel.group);
    this.characterModel.group.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        (obj as THREE.Mesh).geometry?.dispose();
      }
    });
    for (const mat of this.characterModel.materials) {
      mat.dispose();
    }

    // Dispose geometries and materials
    this.cylinderMesh.geometry.dispose();
    if (Array.isArray(this.cylinderMesh.material)) {
      this.cylinderMesh.material.forEach(m => m.dispose());
    } else {
      this.cylinderMesh.material.dispose();
    }

    if (this.lavaTexture) {
      this.lavaTexture.dispose();
      this.lavaTexture = null;
    }

    this.emberPoints.geometry.dispose();
    (this.emberPoints.material as THREE.Material).dispose();

    this.bottomDisc.geometry.dispose();
    (this.bottomDisc.material as THREE.Material).dispose();

    if (this.bottomDiscTexture) {
      this.bottomDiscTexture.dispose();
      this.bottomDiscTexture = null;
    }

    for (const f of this.flameSprites) {
      f.material.dispose();
    }
    this.flameSprites = [];

    for (const l of this.lights) {
      l.dispose();
    }
    this.lights = [];
  }
}
