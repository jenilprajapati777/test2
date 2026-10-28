import * as THREE from 'three';

export class LightingRig {
  public group: THREE.Group;
  public dustPoints: THREE.Points;
  public heartPoints: THREE.Points;
  public lightShaft: THREE.Mesh;
  public lightShaftInner: THREE.Mesh;
  private dustPositions: Float32Array;
  private heartPositions: Float32Array;
  private heartVelocities: Float32Array;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'LightingRig';

    // 1. Hemisphere Light (warm gallery ceiling glow, deep wooden floor bounce)
    const hemiLight = new THREE.HemisphereLight(0xfff8ed, 0x423832, 0.95);
    hemiLight.position.set(0, 10, 0);
    this.group.add(hemiLight);

    // 2. Directional Skylight over the central monument (casts soft detailed shadows)
    const skylight = new THREE.DirectionalLight(0xfff6e4, 1.45);
    skylight.position.set(1.8, 9.2, 1.5);
    skylight.target.position.set(0, 0, 0);
    skylight.castShadow = true;
    skylight.shadow.mapSize.width = 2048;
    skylight.shadow.mapSize.height = 2048;
    skylight.shadow.camera.near = 0.5;
    skylight.shadow.camera.far = 22;
    const d = 13;
    skylight.shadow.camera.left = -d;
    skylight.shadow.camera.right = d;
    skylight.shadow.camera.top = d;
    skylight.shadow.camera.bottom = -d;
    skylight.shadow.bias = -0.0004;
    this.group.add(skylight);
    this.group.add(skylight.target);

    // 3. Warm gallery key spotlights
    const hallSpot = new THREE.SpotLight(0xfff0da, 0.85, 26, Math.PI / 4.2, 0.4, 1.1);
    hallSpot.position.set(0, 4.4, 3.2);
    hallSpot.target.position.set(0, 0, 0);
    hallSpot.castShadow = true;
    hallSpot.shadow.mapSize.width = 1024;
    hallSpot.shadow.mapSize.height = 1024;
    hallSpot.shadow.bias = -0.0004;
    this.group.add(hallSpot);
    this.group.add(hallSpot.target);

    // 4. Warm gallery ambient fills across corridors and alcoves
    const point1 = new THREE.PointLight(0xffddbe, 0.75, 14, 1.2);
    point1.position.set(-13, 3.2, 0); // West photo alcove
    this.group.add(point1);

    const point2 = new THREE.PointLight(0xffddbe, 0.75, 14, 1.2);
    point2.position.set(13, 3.2, 3); // East video alcove
    this.group.add(point2);

    const point3 = new THREE.PointLight(0xffe4cc, 0.85, 15, 1.2);
    point3.position.set(0, 3.2, -12); // Decision corridor / exit foyer
    this.group.add(point3);

    const point4 = new THREE.PointLight(0xffebd2, 0.90, 15, 1.2);
    point4.position.set(0, 3.2, 10); // Entry foyer
    this.group.add(point4);

    // 5. Dual-layered soft volumetric sunbeam shafts streaming from skylight
    const shaftGeoOuter = new THREE.CylinderGeometry(2.4, 4.2, 4.5, 32, 1, true);
    const shaftMatOuter = new THREE.MeshBasicMaterial({
      color: 0xfff3d6,
      transparent: true,
      opacity: 0.09,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.lightShaft = new THREE.Mesh(shaftGeoOuter, shaftMatOuter);
    this.lightShaft.position.set(0, 2.25, 0);
    this.group.add(this.lightShaft);

    const shaftGeoInner = new THREE.CylinderGeometry(1.6, 2.8, 4.5, 32, 1, true);
    const shaftMatInner = new THREE.MeshBasicMaterial({
      color: 0xfffae8,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.lightShaftInner = new THREE.Mesh(shaftGeoInner, shaftMatInner);
    this.lightShaftInner.position.set(0, 2.25, 0);
    this.group.add(this.lightShaftInner);

    // 6. Atmospheric floating dust motes (240 particles drifting in sunbeams)
    const dustCount = 240;
    const dustGeo = new THREE.BufferGeometry();
    this.dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      this.dustPositions[i * 3 + 0] = (Math.random() - 0.5) * 6.5;
      this.dustPositions[i * 3 + 1] = Math.random() * 4.2 + 0.2;
      this.dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 6.0;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(this.dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xfffae6,
      size: 0.06,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.dustPoints = new THREE.Points(dustGeo, dustMat);
    this.group.add(this.dustPoints);

    // 7. Floating romantic pastel heart & petal sparkles around the monument
    const heartCount = 75;
    const heartGeo = new THREE.BufferGeometry();
    this.heartPositions = new Float32Array(heartCount * 3);
    this.heartVelocities = new Float32Array(heartCount);
    for (let i = 0; i < heartCount; i++) {
      const radius = 2.6 + Math.random() * 3.8;
      const angle = Math.random() * Math.PI * 2;
      this.heartPositions[i * 3 + 0] = Math.cos(angle) * radius;
      this.heartPositions[i * 3 + 1] = Math.random() * 3.6 + 0.4;
      this.heartPositions[i * 3 + 2] = Math.sin(angle) * radius;
      this.heartVelocities[i] = 0.15 + Math.random() * 0.15;
    }
    heartGeo.setAttribute('position', new THREE.BufferAttribute(this.heartPositions, 3));
    const heartMat = new THREE.PointsMaterial({
      color: 0xff8fa3,
      size: 0.13,
      transparent: true,
      opacity: 0.80,
      blending: THREE.NormalBlending,
      depthWrite: false
    });
    this.heartPoints = new THREE.Points(heartGeo, heartMat);
    this.group.add(this.heartPoints);
  }

  public update(dt: number, time: number): void {
    // Animate golden dust motes gently drifting in the sunlight
    const posAttr = this.dustPoints.geometry.attributes.position as THREE.BufferAttribute;
    const dArray = posAttr.array as Float32Array;
    const dustCount = dArray.length / 3;

    for (let i = 0; i < dustCount; i++) {
      const idx = i * 3;
      dArray[idx + 1] -= dt * 0.12;
      dArray[idx + 0] += Math.sin(time * 0.45 + i) * dt * 0.07;
      dArray[idx + 2] += Math.cos(time * 0.45 + i) * dt * 0.07;

      if (dArray[idx + 1] < 0.2) {
        dArray[idx + 1] = 4.2;
        dArray[idx + 0] = (Math.random() - 0.5) * 6.5;
        dArray[idx + 2] = (Math.random() - 0.5) * 6.0;
      }
    }
    posAttr.needsUpdate = true;

    // Animate floating heart / petal sparkles gracefully orbiting the monument
    const hAttr = this.heartPoints.geometry.attributes.position as THREE.BufferAttribute;
    const hArray = hAttr.array as Float32Array;
    const hCount = hArray.length / 3;

    for (let i = 0; i < hCount; i++) {
      const idx = i * 3;
      const x = hArray[idx + 0];
      const z = hArray[idx + 2];
      const currentAngle = Math.atan2(z, x);
      const r = Math.hypot(x, z);
      const speed = this.heartVelocities[i];
      const newAngle = currentAngle + dt * speed;

      hArray[idx + 0] = Math.cos(newAngle) * r;
      hArray[idx + 2] = Math.sin(newAngle) * r;
      hArray[idx + 1] += Math.sin(time * 1.2 + i) * dt * 0.16;

      if (hArray[idx + 1] > 4.1) hArray[idx + 1] = 0.4;
      if (hArray[idx + 1] < 0.3) hArray[idx + 1] = 3.9;
    }
    hAttr.needsUpdate = true;

    // Gentle rhythmic pulse on volumetric sun shafts
    const shaftOuterMat = this.lightShaft.material as THREE.MeshBasicMaterial;
    shaftOuterMat.opacity = 0.08 + Math.sin(time * 0.75) * 0.025;

    const shaftInnerMat = this.lightShaftInner.material as THREE.MeshBasicMaterial;
    shaftInnerMat.opacity = 0.11 + Math.cos(time * 0.75) * 0.03;
  }
}
