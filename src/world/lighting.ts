import * as THREE from 'three';

export class LightingRig {
  public group: THREE.Group;
  public dustPoints: THREE.Points;
  public heartPoints: THREE.Points;
  public lightShaft: THREE.Mesh;
  private dustPositions: Float32Array;
  private heartPositions: Float32Array;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'LightingRig';

    // 1. Hemisphere Light (warm sky, cool floor)
    const hemiLight = new THREE.HemisphereLight(0xfff7e8, 0x3d3835, 0.85);
    hemiLight.position.set(0, 10, 0);
    this.group.add(hemiLight);

    // 2. Directional Skylight over pillar (casts shadows)
    const skylight = new THREE.DirectionalLight(0xfff5e0, 1.35);
    skylight.position.set(1.5, 9, 1.5);
    skylight.target.position.set(0, 0, 0);
    skylight.castShadow = true;
    skylight.shadow.mapSize.width = 2048;
    skylight.shadow.mapSize.height = 2048;
    skylight.shadow.camera.near = 0.5;
    skylight.shadow.camera.far = 20;
    const d = 12;
    skylight.shadow.camera.left = -d;
    skylight.shadow.camera.right = d;
    skylight.shadow.camera.top = d;
    skylight.shadow.camera.bottom = -d;
    skylight.shadow.bias = -0.0005;
    this.group.add(skylight);
    this.group.add(skylight.target);

    // 3. Key Spot in Main Hall (casts shadow)
    const hallSpot = new THREE.SpotLight(0xffecd2, 0.9, 25, Math.PI / 4, 0.35, 1);
    hallSpot.position.set(0, 4.3, 3);
    hallSpot.target.position.set(0, 0, 0);
    hallSpot.castShadow = true;
    hallSpot.shadow.mapSize.width = 1024;
    hallSpot.shadow.mapSize.height = 1024;
    hallSpot.shadow.bias = -0.0005;
    this.group.add(hallSpot);
    this.group.add(hallSpot.target);

    // 4. Point lights across alcoves/corridors (no shadows, efficient)
    const point1 = new THREE.PointLight(0xffd8b4, 0.7, 12, 1.2);
    point1.position.set(-13, 3.2, 0); // Left alcove
    this.group.add(point1);

    const point2 = new THREE.PointLight(0xffd8b4, 0.7, 12, 1.2);
    point2.position.set(13, 3.2, 3); // Right alcove
    this.group.add(point2);

    const point3 = new THREE.PointLight(0xffe2c4, 0.8, 14, 1.2);
    point3.position.set(0, 3.2, -12); // Decision alcove (plan y = 12 -> Three.js z = -12)
    this.group.add(point3);

    const point4 = new THREE.PointLight(0xffe6cb, 0.85, 14, 1.2);
    point4.position.set(0, 3.2, 10); // Entry foyer (plan y = -10 -> Three.js z = +10)
    this.group.add(point4);

    // 5. Skylight shaft mesh (additive cylinder/cone)
    const shaftGeo = new THREE.CylinderGeometry(2.2, 3.8, 4.5, 32, 1, true);
    const shaftMat = new THREE.MeshBasicMaterial({
      color: 0xfff3d6,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.lightShaft = new THREE.Mesh(shaftGeo, shaftMat);
    this.lightShaft.position.set(0, 2.25, 0);
    this.group.add(this.lightShaft);

    // 6. Dust motes (200 particles)
    const dustCount = 200;
    const dustGeo = new THREE.BufferGeometry();
    this.dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      this.dustPositions[i * 3 + 0] = (Math.random() - 0.5) * 5.5;
      this.dustPositions[i * 3 + 1] = Math.random() * 4.2 + 0.2;
      this.dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 5.0;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(this.dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xfffae6,
      size: 0.05,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.dustPoints = new THREE.Points(dustGeo, dustMat);
    this.group.add(this.dustPoints);

    // 7. Floating hearts / petals around the pillar (SHOULD)
    const heartCount = 60;
    const heartGeo = new THREE.BufferGeometry();
    this.heartPositions = new Float32Array(heartCount * 3);
    for (let i = 0; i < heartCount; i++) {
      const radius = 2.8 + Math.random() * 3.5;
      const angle = Math.random() * Math.PI * 2;
      this.heartPositions[i * 3 + 0] = Math.cos(angle) * radius;
      this.heartPositions[i * 3 + 1] = Math.random() * 3.5 + 0.5;
      this.heartPositions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    heartGeo.setAttribute('position', new THREE.BufferAttribute(this.heartPositions, 3));
    const heartMat = new THREE.PointsMaterial({
      color: 0xff7b90,
      size: 0.12,
      transparent: true,
      opacity: 0.75,
      blending: THREE.NormalBlending,
      depthWrite: false
    });
    this.heartPoints = new THREE.Points(heartGeo, heartMat);
    this.group.add(this.heartPoints);
  }

  public update(dt: number, time: number): void {
    // Animate dust motes gently drifting
    const posAttr = this.dustPoints.geometry.attributes.position as THREE.BufferAttribute;
    const dArray = posAttr.array as Float32Array;
    const dustCount = dArray.length / 3;

    for (let i = 0; i < dustCount; i++) {
      const idx = i * 3;
      dArray[idx + 1] -= dt * 0.15;
      dArray[idx + 0] += Math.sin(time * 0.5 + i) * dt * 0.08;
      dArray[idx + 2] += Math.cos(time * 0.5 + i) * dt * 0.08;

      if (dArray[idx + 1] < 0.2) {
        dArray[idx + 1] = 4.2;
        dArray[idx + 0] = (Math.random() - 0.5) * 5.5;
        dArray[idx + 2] = (Math.random() - 0.5) * 5.0;
      }
    }
    posAttr.needsUpdate = true;

    // Animate heart/petal drift around pillar
    const hAttr = this.heartPoints.geometry.attributes.position as THREE.BufferAttribute;
    const hArray = hAttr.array as Float32Array;
    const hCount = hArray.length / 3;

    for (let i = 0; i < hCount; i++) {
      const idx = i * 3;
      // Orbit around pillar slowly
      const x = hArray[idx + 0];
      const z = hArray[idx + 2];
      const currentAngle = Math.atan2(z, x);
      const r = Math.hypot(x, z);
      const newAngle = currentAngle + dt * 0.2;

      hArray[idx + 0] = Math.cos(newAngle) * r;
      hArray[idx + 2] = Math.sin(newAngle) * r;
      hArray[idx + 1] += Math.sin(time + i) * dt * 0.15;

      if (hArray[idx + 1] > 4.0) hArray[idx + 1] = 0.5;
      if (hArray[idx + 1] < 0.3) hArray[idx + 1] = 3.8;
    }
    hAttr.needsUpdate = true;

    // Gentle pulse on light shaft
    const shaftMat = this.lightShaft.material as THREE.MeshBasicMaterial;
    shaftMat.opacity = 0.1 + Math.sin(time * 0.8) * 0.03;
  }
}
