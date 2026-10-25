import * as THREE from 'three';
import { CharacterAnimator, CharacterLimbs } from './animator.js';

export type CharacterId = 'jenil' | 'rutu';

export interface CharacterModel {
  id: CharacterId;
  group: THREE.Group;
  animator: CharacterAnimator;
  nameTag: THREE.Sprite;
  materials: THREE.Material[];
  height: number;
  setOpacity: (opacity: number) => void;
  updateNameTagDistance: (cameraPos: THREE.Vector3) => void;
}

export class CharacterFactory {
  /**
   * Builds an attractive, properly proportioned 3D humanoid character for Jenil or Rutu.
   * Jenil: 1.75m height, tailored navy jacket, charcoal chinos, white-soled sneakers, styled hair.
   * Rutu: 1.65m height, chic wine blazer, cream pleated skirt, gold necklace & ponytail, feminine proportions.
   */
  public static createProcedural(id: CharacterId): CharacterModel {
    const isMale = id === 'jenil';
    const height = isMale ? 1.75 : 1.65;
    const scale = height / 1.75;

    const group = new THREE.Group();
    group.name = `Character_${id}`;

    const materials: THREE.Material[] = [];

    // --- 1. Materials ---
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xf5cfb3,
      roughness: 0.55,
      metalness: 0.04,
      transparent: true,
      opacity: 1.0
    });
    materials.push(skinMat);

    const hairMat = new THREE.MeshStandardMaterial({
      color: isMale ? 0x221a16 : 0x281914,
      roughness: 0.75,
      metalness: 0.05,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1.0
    });
    materials.push(hairMat);

    const jacketMat = new THREE.MeshStandardMaterial({
      color: isMale ? 0x223552 : 0x8a2542, // Tailored navy casual vs Chic wine blazer
      roughness: 0.65,
      metalness: 0.06,
      transparent: true,
      opacity: 1.0
    });
    materials.push(jacketMat);

    const shirtMat = new THREE.MeshStandardMaterial({
      color: isMale ? 0xf4f5f8 : 0xfcf4ee, // Crisp white tee vs Warm ivory
      roughness: 0.75,
      transparent: true,
      opacity: 1.0
    });
    materials.push(shirtMat);

    const pantsMat = new THREE.MeshStandardMaterial({
      color: isMale ? 0x242832 : 0xece3dc, // Charcoal slim chinos vs Cream pleated skirt
      roughness: 0.75,
      transparent: true,
      opacity: 1.0
    });
    materials.push(pantsMat);

    const shoeMat = new THREE.MeshStandardMaterial({
      color: isMale ? 0x1e222b : 0x261a16, // Dark sneaker upper vs Leather boot
      roughness: 0.5,
      transparent: true,
      opacity: 1.0
    });
    materials.push(shoeMat);

    const soleMat = new THREE.MeshStandardMaterial({
      color: 0xf4f4f6, // Clean white sneaker sole
      roughness: 0.4,
      transparent: true,
      opacity: 1.0
    });
    materials.push(soleMat);

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xdfb142,
      metalness: 0.85,
      roughness: 0.22,
      transparent: true,
      opacity: 1.0
    });
    materials.push(goldMat);

    const eyeDarkMat = new THREE.MeshBasicMaterial({
      color: 0x181822
    });
    materials.push(eyeDarkMat);

    const eyeWhiteMat = new THREE.MeshBasicMaterial({
      color: 0xffffff
    });
    materials.push(eyeWhiteMat);

    const lipMat = new THREE.MeshBasicMaterial({
      color: isMale ? 0xa85548 : 0xbe4458
    });
    materials.push(lipMat);

    // --- 2. Pelvis & Hips ---
    // Anatomical human hips: wider in X than Z (scaled 1.25, 1.0, 0.75)
    const pelvisGeo = new THREE.CylinderGeometry(0.13 * scale, 0.115 * scale, 0.13 * scale, 16);
    pelvisGeo.scale(1.22, 1.0, 0.78);
    const pelvisMesh = new THREE.Mesh(pelvisGeo, pantsMat);
    pelvisMesh.position.set(0, 0.75 * scale, 0);
    pelvisMesh.castShadow = true;
    group.add(pelvisMesh);

    // --- 3. Chest & Upper Body (Pivot at waist) ---
    const chestGroup = new THREE.Group();
    chestGroup.position.set(0, 0.81 * scale, 0);

    // Torso: Broad shoulders, tapered waist (wider across chest than deep)
    const torsoGeo = new THREE.CylinderGeometry(0.165 * scale, 0.125 * scale, 0.38 * scale, 18);
    torsoGeo.scale(1.35, 1.0, 0.74);
    const torsoMesh = new THREE.Mesh(torsoGeo, jacketMat);
    torsoMesh.position.set(0, 0.19 * scale, 0);
    torsoMesh.castShadow = true;
    chestGroup.add(torsoMesh);

    // Inner Shirt Insert at neckline
    const shirtGeo = new THREE.BoxGeometry(0.09 * scale, 0.14 * scale, 0.04 * scale);
    const shirtMesh = new THREE.Mesh(shirtGeo, shirtMat);
    shirtMesh.position.set(0, 0.29 * scale, 0.09 * scale);
    chestGroup.add(shirtMesh);

    // Rutu: Pleated Skirt around hips + Golden Pendant
    if (!isMale) {
      const skirtGeo = new THREE.ConeGeometry(0.25 * scale, 0.30 * scale, 20, 1, true);
      skirtGeo.scale(1.22, 1.0, 0.85);
      const skirtMesh = new THREE.Mesh(skirtGeo, pantsMat);
      skirtMesh.position.set(0, -0.05 * scale, 0);
      skirtMesh.castShadow = true;
      chestGroup.add(skirtMesh);

      // Gold necklace pendant
      const pendantGeo = new THREE.SphereGeometry(0.016 * scale, 10, 10);
      const pendantMesh = new THREE.Mesh(pendantGeo, goldMat);
      pendantMesh.position.set(0, 0.28 * scale, 0.10 * scale);
      chestGroup.add(pendantMesh);
    }

    // Neck
    const neckGeo = new THREE.CylinderGeometry(0.045 * scale, 0.050 * scale, 0.09 * scale, 14);
    neckGeo.scale(1.0, 1.0, 0.9);
    const neckMesh = new THREE.Mesh(neckGeo, skinMat);
    neckMesh.position.set(0, 0.40 * scale, 0);
    neckMesh.castShadow = true;
    chestGroup.add(neckMesh);

    // --- 4. Head Group (Pivot at neck top) ---
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.46 * scale, 0);

    // Head Sphere: oval human head
    const headGeo = new THREE.SphereGeometry(0.115 * scale, 28, 28);
    headGeo.scale(0.98, 1.08, 1.02);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.position.set(0, 0.12 * scale, 0);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Ears
    const earGeo = new THREE.SphereGeometry(0.022 * scale, 8, 8);
    earGeo.scale(0.4, 1.0, 0.7);
    const leftEar = new THREE.Mesh(earGeo, skinMat);
    leftEar.position.set(-0.115 * scale, 0.12 * scale, -0.01 * scale);
    headGroup.add(leftEar);
    const rightEar = new THREE.Mesh(earGeo, skinMat);
    rightEar.position.set(0.115 * scale, 0.12 * scale, -0.01 * scale);
    headGroup.add(rightEar);

    // Expressive Facial Features (Eyes, Highlights, Smile)
    const eyeSpacing = 0.038 * scale;
    const eyeY = 0.124 * scale;
    const eyeZ = 0.108 * scale;

    const eyeGeo = new THREE.SphereGeometry(0.015 * scale, 12, 12);
    eyeGeo.scale(1.0, 1.25, 0.35);

    const leftEye = new THREE.Mesh(eyeGeo, eyeDarkMat);
    leftEye.position.set(-eyeSpacing, eyeY, eyeZ);
    headGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeDarkMat);
    rightEye.position.set(eyeSpacing, eyeY, eyeZ);
    headGroup.add(rightEye);

    // White specular sparkles in eyes
    const glintGeo = new THREE.SphereGeometry(0.005 * scale, 8, 8);
    const leftGlint = new THREE.Mesh(glintGeo, eyeWhiteMat);
    leftGlint.position.set(-eyeSpacing - 0.004 * scale, eyeY + 0.005 * scale, eyeZ + 0.005 * scale);
    headGroup.add(leftGlint);

    const rightGlint = new THREE.Mesh(glintGeo, eyeWhiteMat);
    rightGlint.position.set(eyeSpacing - 0.004 * scale, eyeY + 0.005 * scale, eyeZ + 0.005 * scale);
    headGroup.add(rightGlint);

    // Friendly Smile
    const smileGeo = new THREE.BoxGeometry(0.036 * scale, 0.007 * scale, 0.015 * scale);
    const smileMesh = new THREE.Mesh(smileGeo, lipMat);
    smileMesh.position.set(0, 0.072 * scale, 0.111 * scale);
    headGroup.add(smileMesh);

    // Rutu: Soft blush cheeks
    if (!isMale) {
      const blushMat = new THREE.MeshBasicMaterial({
        color: 0xef7a92,
        transparent: true,
        opacity: 0.45
      });
      materials.push(blushMat);

      const blushGeo = new THREE.SphereGeometry(0.016 * scale, 10, 10);
      blushGeo.scale(1.2, 0.7, 0.3);

      const leftBlush = new THREE.Mesh(blushGeo, blushMat);
      leftBlush.position.set(-0.062 * scale, 0.102 * scale, 0.096 * scale);
      headGroup.add(leftBlush);

      const rightBlush = new THREE.Mesh(blushGeo, blushMat);
      rightBlush.position.set(0.062 * scale, 0.102 * scale, 0.096 * scale);
      headGroup.add(rightBlush);
    }

    // --- 5. Clean, Sculpted Hair (Enclosed volume, natural silhouette) ---
    if (isMale) {
      // Jenil: Styled modern short dark haircut (covers top, back, and sides; leaves face open)
      const hairMainGeo = new THREE.SphereGeometry(
        0.122 * scale,
        24,
        20,
        Math.PI * 0.76,
        Math.PI * 1.48,
        0,
        Math.PI * 0.72
      );
      hairMainGeo.scale(1.02, 1.04, 1.05);
      const hairMain = new THREE.Mesh(hairMainGeo, hairMat);
      hairMain.position.set(0, 0.128 * scale, 0);
      hairMain.castShadow = true;
      headGroup.add(hairMain);

      // Stylish front fringe/part
      const fringeGeo = new THREE.CylinderGeometry(0.018 * scale, 0.012 * scale, 0.13 * scale, 10);
      fringeGeo.scale(1.0, 1.0, 0.7);
      const hairFringe = new THREE.Mesh(fringeGeo, hairMat);
      hairFringe.rotation.z = Math.PI * 0.52;
      hairFringe.position.set(0, 0.21 * scale, 0.075 * scale);
      hairFringe.castShadow = true;
      headGroup.add(hairFringe);
    } else {
      // Rutu: Elegant flowing brunette hair + sleek ponytail
      const hairMainGeo = new THREE.SphereGeometry(
        0.124 * scale,
        24,
        20,
        Math.PI * 0.74,
        Math.PI * 1.52,
        0,
        Math.PI * 0.74
      );
      hairMainGeo.scale(1.03, 1.05, 1.06);
      const hairMain = new THREE.Mesh(hairMainGeo, hairMat);
      hairMain.position.set(0, 0.128 * scale, 0);
      hairMain.castShadow = true;
      headGroup.add(hairMain);

      // Face-framing side strands
      const lockGeo = new THREE.CylinderGeometry(0.016 * scale, 0.010 * scale, 0.16 * scale, 10);
      const leftLock = new THREE.Mesh(lockGeo, hairMat);
      leftLock.position.set(-0.11 * scale, 0.08 * scale, 0.04 * scale);
      leftLock.rotation.z = -0.1;
      headGroup.add(leftLock);

      const rightLock = new THREE.Mesh(lockGeo, hairMat);
      rightLock.position.set(0.11 * scale, 0.08 * scale, 0.04 * scale);
      rightLock.rotation.z = 0.1;
      headGroup.add(rightLock);

      // Hair flowing down back of neck
      const backFlowGeo = new THREE.CylinderGeometry(0.085 * scale, 0.060 * scale, 0.18 * scale, 12);
      backFlowGeo.scale(1.15, 1.0, 0.55);
      const backFlow = new THREE.Mesh(backFlowGeo, hairMat);
      backFlow.position.set(0, 0.02 * scale, -0.09 * scale);
      backFlow.castShadow = true;
      headGroup.add(backFlow);

      // Golden hair ring
      const ringGeo = new THREE.TorusGeometry(0.024 * scale, 0.007 * scale, 8, 16);
      const ringMesh = new THREE.Mesh(ringGeo, goldMat);
      ringMesh.rotation.x = Math.PI * 0.45;
      ringMesh.position.set(0, 0.18 * scale, -0.125 * scale);
      headGroup.add(ringMesh);

      // Sleek ponytail hanging down gracefully
      const ponytailGeo = new THREE.ConeGeometry(0.05 * scale, 0.30 * scale, 12);
      ponytailGeo.translate(0, -0.15 * scale, 0);
      const ponytail = new THREE.Mesh(ponytailGeo, hairMat);
      ponytail.rotation.x = 0.28;
      ponytail.position.set(0, 0.18 * scale, -0.135 * scale);
      ponytail.castShadow = true;
      headGroup.add(ponytail);
    }

    chestGroup.add(headGroup);

    // --- 6. Arms (Shoulder -> Bicep -> Forearm -> Hand) ---
    const shoulderWidth = 0.21 * scale;
    const shoulderGeo = new THREE.SphereGeometry(0.046 * scale, 12, 12);

    const upperArmLength = 0.18 * scale;
    const upperArmGeo = new THREE.CylinderGeometry(0.040 * scale, 0.035 * scale, upperArmLength, 12);
    upperArmGeo.translate(0, -upperArmLength / 2, 0);

    const forearmLength = 0.18 * scale;
    const forearmGeo = new THREE.CylinderGeometry(0.034 * scale, 0.029 * scale, forearmLength, 12);
    forearmGeo.translate(0, -forearmLength / 2, 0);

    const handGeo = new THREE.SphereGeometry(0.030 * scale, 10, 10);
    handGeo.scale(1.0, 1.25, 0.65);
    handGeo.translate(0, -0.20 * scale, 0);

    // Left Arm
    const leftArm = new THREE.Group();
    leftArm.position.set(-shoulderWidth, 0.32 * scale, 0);

    const leftShoulder = new THREE.Mesh(shoulderGeo, jacketMat);
    leftArm.add(leftShoulder);

    const leftUpperArm = new THREE.Mesh(upperArmGeo, jacketMat);
    leftUpperArm.castShadow = true;
    leftArm.add(leftUpperArm);

    const leftForearm = new THREE.Group();
    leftForearm.position.set(0, -upperArmLength, 0);

    const leftForearmMesh = new THREE.Mesh(forearmGeo, isMale ? jacketMat : skinMat);
    leftForearmMesh.castShadow = true;
    leftForearm.add(leftForearmMesh);

    const leftHand = new THREE.Mesh(handGeo, skinMat);
    leftForearm.add(leftHand);

    leftArm.add(leftForearm);
    chestGroup.add(leftArm);

    // Right Arm
    const rightArm = new THREE.Group();
    rightArm.position.set(shoulderWidth, 0.32 * scale, 0);

    const rightShoulder = new THREE.Mesh(shoulderGeo, jacketMat);
    rightArm.add(rightShoulder);

    const rightUpperArm = new THREE.Mesh(upperArmGeo, jacketMat);
    rightUpperArm.castShadow = true;
    rightArm.add(rightUpperArm);

    const rightForearm = new THREE.Group();
    rightForearm.position.set(0, -upperArmLength, 0);

    const rightForearmMesh = new THREE.Mesh(forearmGeo, isMale ? jacketMat : skinMat);
    rightForearmMesh.castShadow = true;
    rightForearm.add(rightForearmMesh);

    const rightHand = new THREE.Mesh(handGeo, skinMat);
    rightForearm.add(rightHand);

    rightArm.add(rightForearm);
    chestGroup.add(rightArm);

    group.add(chestGroup);

    // --- 7. Legs (Hip -> Thigh -> Calf -> Shoes) ---
    const legSpacing = 0.09 * scale;
    const thighLength = 0.35 * scale;
    const calfLength = 0.35 * scale;

    const thighGeo = new THREE.CylinderGeometry(0.052 * scale, 0.044 * scale, thighLength, 12);
    thighGeo.translate(0, -thighLength / 2, 0);

    const calfGeo = new THREE.CylinderGeometry(0.042 * scale, 0.036 * scale, calfLength, 12);
    calfGeo.translate(0, -calfLength / 2, 0);

    // Shoe with modern sole
    const shoeGroup = new THREE.Group();
    shoeGroup.position.set(0, -calfLength, 0);

    const shoeUpperGeo = new THREE.BoxGeometry(0.082 * scale, 0.055 * scale, 0.165 * scale);
    shoeUpperGeo.translate(0, -0.012 * scale, 0.025 * scale);
    const shoeUpper = new THREE.Mesh(shoeUpperGeo, shoeMat);
    shoeUpper.castShadow = true;
    shoeGroup.add(shoeUpper);

    if (isMale) {
      // White sneaker sole
      const soleGeo = new THREE.BoxGeometry(0.086 * scale, 0.022 * scale, 0.175 * scale);
      soleGeo.translate(0, -0.040 * scale, 0.025 * scale);
      const soleMesh = new THREE.Mesh(soleGeo, soleMat);
      soleMesh.castShadow = true;
      shoeGroup.add(soleMesh);
    }

    // Left Leg
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-legSpacing, 0.74 * scale, 0);

    const leftThigh = new THREE.Mesh(thighGeo, pantsMat);
    leftThigh.castShadow = true;
    leftLeg.add(leftThigh);

    const leftLowerLeg = new THREE.Group();
    leftLowerLeg.position.set(0, -thighLength, 0);

    const leftCalf = new THREE.Mesh(calfGeo, isMale ? pantsMat : skinMat);
    leftCalf.castShadow = true;
    leftLowerLeg.add(leftCalf);
    leftLowerLeg.add(shoeGroup.clone());
    leftLeg.add(leftLowerLeg);
    group.add(leftLeg);

    // Right Leg
    const rightLeg = new THREE.Group();
    rightLeg.position.set(legSpacing, 0.74 * scale, 0);

    const rightThigh = new THREE.Mesh(thighGeo, pantsMat);
    rightThigh.castShadow = true;
    rightLeg.add(rightThigh);

    const rightLowerLeg = new THREE.Group();
    rightLowerLeg.position.set(0, -thighLength, 0);

    const rightCalf = new THREE.Mesh(calfGeo, isMale ? pantsMat : skinMat);
    rightCalf.castShadow = true;
    rightLowerLeg.add(rightCalf);
    rightLowerLeg.add(shoeGroup.clone());
    rightLeg.add(rightLowerLeg);
    group.add(rightLeg);

    // --- 8. Floating Name Tag Sprite ---
    const nameTag = this.createNameTagSprite(isMale ? 'Jenil' : 'Rutu');
    nameTag.position.set(0, height + 0.22, 0);
    group.add(nameTag);

    const limbs: CharacterLimbs = {
      head: headGroup,
      chest: chestGroup,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      leftForearm,
      rightForearm,
      leftLowerLeg,
      rightLowerLeg
    };

    const animator = new CharacterAnimator(limbs);

    const setOpacity = (opacity: number) => {
      for (const mat of materials) {
        mat.opacity = opacity;
        mat.transparent = opacity < 1.0;
      }
    };

    const updateNameTagDistance = (cameraPos: THREE.Vector3) => {
      const worldPos = new THREE.Vector3();
      group.getWorldPosition(worldPos);
      const dist = worldPos.distanceTo(cameraPos);
      if (dist > 12) {
        nameTag.visible = false;
      } else {
        nameTag.visible = true;
        if (dist > 8) {
          nameTag.material.opacity = 1 - (dist - 8) / 4;
        } else {
          nameTag.material.opacity = 1.0;
        }
      }
    };

    return {
      id,
      group,
      animator,
      nameTag,
      materials,
      height,
      setOpacity,
      updateNameTagDistance
    };
  }

  private static createNameTagSprite(name: string): THREE.Sprite {
    if (typeof document === 'undefined') {
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, opacity: 1.0 }));
      sprite.name = `NameTag_${name}`;
      sprite.scale.set(0.85, 0.28, 1.0);
      return sprite;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 80;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'rgba(18, 22, 32, 0.8)';
    ctx.beginPath();
    ctx.roundRect(10, 10, 236, 60, 14);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, 128, 40);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;

    const spriteMat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthTest: false
    });

    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(0.85, 0.28, 1.0);
    return sprite;
  }
}
