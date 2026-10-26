import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
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
   * Builds a high-quality, properly proportioned 3D humanoid character for Jenil or Rutu.
   * Jenil: 1.75m height, athletic silhouette, tailored navy blazer, crisp white tee, charcoal chinos, designer sneakers.
   * Rutu: 1.65m height, chic feminine silhouette, rich wine blazer, ivory blouse, cream pleated skirt, gold necklace & ponytail.
   */
  public static createProcedural(id: CharacterId): CharacterModel {
    const isMale = id === 'jenil';
    // Slightly smaller, storybook proportions for a cute in-world look.
    const height = isMale ? 1.40 : 1.30;
    const scale = height / 1.75;

    const group = new THREE.Group();
    group.name = `Character_${id}`;

    const materials: THREE.Material[] = [];

    // --- 1. Materials ---
    const skinMat = new THREE.MeshStandardMaterial({
      color: isMale ? 0xf2cfb6 : 0xf9dfd2,
      roughness: isMale ? 0.55 : 0.50,
      metalness: 0.02,
      transparent: true,
      opacity: 1.0
    });
    materials.push(skinMat);

    const hairMat = new THREE.MeshStandardMaterial({
      color: isMale ? 0x1f1815 : 0x261914,
      roughness: isMale ? 0.65 : 0.60,
      metalness: 0.04,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1.0
    });
    materials.push(hairMat);

    const jacketMat = new THREE.MeshStandardMaterial({
      color: isMale ? 0x1e2e46 : 0x83243e, // Deep midnight navy vs Chic ruby wine
      roughness: 0.60,
      metalness: 0.05,
      transparent: true,
      opacity: 1.0
    });
    materials.push(jacketMat);

    const shirtMat = new THREE.MeshStandardMaterial({
      color: isMale ? 0xf6f7fa : 0xfcf7f0, // Crisp white tee vs Warm ivory
      roughness: 0.68,
      transparent: true,
      opacity: 1.0
    });
    materials.push(shirtMat);

    const pantsMat = new THREE.MeshStandardMaterial({
      color: isMale ? 0x262a34 : 0x222630, // Tailored charcoal slim trousers / slacks
      roughness: 0.70,
      transparent: true,
      opacity: 1.0
    });
    materials.push(pantsMat);

    const shoeMat = new THREE.MeshStandardMaterial({
      color: isMale ? 0x20242e : 0x231818, // Dark sneaker canvas vs Polished leather boot
      roughness: isMale ? 0.55 : 0.45,
      transparent: true,
      opacity: 1.0
    });
    materials.push(shoeMat);

    const soleMat = new THREE.MeshStandardMaterial({
      color: 0xf5f6fa, // Clean white sneaker rubber sole
      roughness: 0.38,
      transparent: true,
      opacity: 1.0
    });
    materials.push(soleMat);

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xe6be44,
      metalness: 0.85,
      roughness: 0.20,
      transparent: true,
      opacity: 1.0
    });
    materials.push(goldMat);

    const eyeDarkMat = new THREE.MeshBasicMaterial({
      color: 0x16151e
    });
    materials.push(eyeDarkMat);

    const eyeWhiteMat = new THREE.MeshBasicMaterial({
      color: 0xffffff
    });
    materials.push(eyeWhiteMat);

    const browMat = new THREE.MeshBasicMaterial({
      color: isMale ? 0x181412 : 0x201511
    });
    materials.push(browMat);

    const lipMat = new THREE.MeshBasicMaterial({
      color: isMale ? 0x9c5549 : 0xc24d62
    });
    materials.push(lipMat);

    // --- 2. Pelvis & Hips ---
    // Smooth natural capsule for pelvis
    const pelvisGeo = new THREE.CapsuleGeometry(0.092 * scale, 0.10 * scale, 10, 16);
    pelvisGeo.scale(1.30, 1.0, 0.78);
    const pelvisMesh = new THREE.Mesh(pelvisGeo, pantsMat);
    pelvisMesh.position.set(0, 0.74 * scale, 0);
    pelvisMesh.castShadow = true;
    pelvisMesh.receiveShadow = true;
    group.add(pelvisMesh);

    // Rutu: Chic waist belt with gold buckle
    if (!isMale) {
      const beltGroup = new THREE.Group();
      beltGroup.position.set(0, 0.74 * scale, 0);

      const beltGeo = new THREE.CylinderGeometry(0.122 * scale, 0.126 * scale, 0.035 * scale, 18);
      beltGeo.scale(1.28, 1.0, 0.78);
      const beltMesh = new THREE.Mesh(beltGeo, shoeMat);
      beltGroup.add(beltMesh);

      const buckleGeo = new THREE.BoxGeometry(0.024 * scale, 0.020 * scale, 0.010 * scale);
      const buckleMesh = new THREE.Mesh(buckleGeo, goldMat);
      buckleMesh.position.set(0, 0, 0.100 * scale);
      beltGroup.add(buckleMesh);

      group.add(beltGroup);
    }

    // --- 3. Chest & Torso (Pivots at waist y = 0.80) ---
    const chestGroup = new THREE.Group();
    chestGroup.position.set(0, 0.80 * scale, 0);

    // Torso: Smooth tapered capsule
    const torsoGeo = new THREE.CapsuleGeometry(0.125 * scale, 0.22 * scale, 12, 18);
    torsoGeo.scale(1.36, 1.0, 0.78);
    const torsoMesh = new THREE.Mesh(torsoGeo, jacketMat);
    torsoMesh.position.set(0, 0.18 * scale, 0);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    chestGroup.add(torsoMesh);

    // Jacket Lapels
    const lapelGeo = new THREE.BoxGeometry(0.038 * scale, 0.18 * scale, 0.022 * scale);

    const leftLapel = new THREE.Mesh(lapelGeo, jacketMat);
    leftLapel.position.set(-0.065 * scale, 0.23 * scale, 0.095 * scale);
    leftLapel.rotation.set(0, 0.1, -0.15);
    chestGroup.add(leftLapel);

    const rightLapel = new THREE.Mesh(lapelGeo, jacketMat);
    rightLapel.position.set(0.065 * scale, 0.23 * scale, 0.095 * scale);
    rightLapel.rotation.set(0, -0.1, 0.15);
    chestGroup.add(rightLapel);

    // Inner Shirt Insert
    const shirtGeo = new THREE.BoxGeometry(0.085 * scale, 0.14 * scale, 0.030 * scale);
    const shirtMesh = new THREE.Mesh(shirtGeo, shirtMat);
    shirtMesh.position.set(0, 0.24 * scale, 0.090 * scale);
    chestGroup.add(shirtMesh);

    // Rutu: Gold Necklace & Pendant
    if (!isMale) {
      const necklaceGeo = new THREE.TorusGeometry(0.052 * scale, 0.005 * scale, 8, 20);
      const necklaceMesh = new THREE.Mesh(necklaceGeo, goldMat);
      necklaceMesh.rotation.set(Math.PI * 0.42, 0, 0);
      necklaceMesh.position.set(0, 0.28 * scale, 0.065 * scale);
      chestGroup.add(necklaceMesh);

      const pendantGeo = new THREE.SphereGeometry(0.016 * scale, 12, 12);
      const pendantMesh = new THREE.Mesh(pendantGeo, goldMat);
      pendantMesh.position.set(0, 0.24 * scale, 0.106 * scale);
      chestGroup.add(pendantMesh);
    }

    // Neck
    const neckGeo = new THREE.CylinderGeometry(0.042 * scale, 0.048 * scale, 0.08 * scale, 16);
    const neckMesh = new THREE.Mesh(neckGeo, skinMat);
    neckMesh.position.set(0, 0.38 * scale, 0);
    neckMesh.castShadow = true;
    chestGroup.add(neckMesh);

    // --- 4. Head Group (Pivots at neck top) ---
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.44 * scale, 0);

    // Head Sphere: sculpted humanoid head
    const headGeo = new THREE.SphereGeometry(0.118 * scale, 32, 28);
    headGeo.scale(0.96, 1.08, 1.02);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.position.set(0, 0.12 * scale, 0);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Ears
    const earGeo = new THREE.SphereGeometry(0.022 * scale, 10, 10);
    earGeo.scale(0.4, 1.0, 0.7);

    const leftEar = new THREE.Mesh(earGeo, skinMat);
    leftEar.position.set(-0.116 * scale, 0.12 * scale, -0.01 * scale);
    headGroup.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, skinMat);
    rightEar.position.set(0.116 * scale, 0.12 * scale, -0.01 * scale);
    headGroup.add(rightEar);

    // --- Eyes with Sclera, Iris, and Dual Specular Highlights ---
    const eyeSpacing = 0.038 * scale;
    const eyeY = 0.124 * scale;
    const eyeZ = 0.106 * scale;

    const eyeWhiteGeo = new THREE.SphereGeometry(0.018 * scale, 14, 14);
    eyeWhiteGeo.scale(1.0, 1.25, 0.28);

    const leftEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    leftEyeWhite.position.set(-eyeSpacing, eyeY, eyeZ);
    headGroup.add(leftEyeWhite);

    const rightEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    rightEyeWhite.position.set(eyeSpacing, eyeY, eyeZ);
    headGroup.add(rightEyeWhite);

    const irisGeo = new THREE.SphereGeometry(0.014 * scale, 14, 14);
    irisGeo.scale(1.0, 1.22, 0.25);

    const leftIris = new THREE.Mesh(irisGeo, eyeDarkMat);
    leftIris.position.set(-eyeSpacing, eyeY, eyeZ + 0.003 * scale);
    headGroup.add(leftIris);

    const rightIris = new THREE.Mesh(irisGeo, eyeDarkMat);
    rightIris.position.set(eyeSpacing, eyeY, eyeZ + 0.003 * scale);
    headGroup.add(rightIris);

    // Primary & Secondary Specular Sparkles
    const glint1Geo = new THREE.SphereGeometry(0.0055 * scale, 8, 8);
    const glint2Geo = new THREE.SphereGeometry(0.0030 * scale, 8, 8);

    const leftGlint1 = new THREE.Mesh(glint1Geo, eyeWhiteMat);
    leftGlint1.position.set(-eyeSpacing - 0.004 * scale, eyeY + 0.005 * scale, eyeZ + 0.007 * scale);
    headGroup.add(leftGlint1);

    const leftGlint2 = new THREE.Mesh(glint2Geo, eyeWhiteMat);
    leftGlint2.position.set(-eyeSpacing + 0.004 * scale, eyeY - 0.004 * scale, eyeZ + 0.007 * scale);
    headGroup.add(leftGlint2);

    const rightGlint1 = new THREE.Mesh(glint1Geo, eyeWhiteMat);
    rightGlint1.position.set(eyeSpacing - 0.004 * scale, eyeY + 0.005 * scale, eyeZ + 0.007 * scale);
    headGroup.add(rightGlint1);

    const rightGlint2 = new THREE.Mesh(glint2Geo, eyeWhiteMat);
    rightGlint2.position.set(eyeSpacing + 0.004 * scale, eyeY - 0.004 * scale, eyeZ + 0.007 * scale);
    headGroup.add(rightGlint2);

    // Eyebrows
    const browGeo = new THREE.CapsuleGeometry(0.0055 * scale, 0.034 * scale, 6, 8);

    const leftBrow = new THREE.Mesh(browGeo, browMat);
    leftBrow.rotation.set(0, 0, isMale ? 0.15 : 0.22);
    leftBrow.position.set(-eyeSpacing, eyeY + 0.026 * scale, eyeZ + 0.005 * scale);
    headGroup.add(leftBrow);

    const rightBrow = new THREE.Mesh(browGeo, browMat);
    rightBrow.rotation.set(0, 0, isMale ? -0.15 : -0.22);
    rightBrow.position.set(eyeSpacing, eyeY + 0.026 * scale, eyeZ + 0.005 * scale);
    headGroup.add(rightBrow);

    // Cute Nose Bump
    const noseGeo = new THREE.SphereGeometry(0.009 * scale, 8, 8);
    const noseMesh = new THREE.Mesh(noseGeo, skinMat);
    noseMesh.position.set(0, 0.100 * scale, 0.118 * scale);
    headGroup.add(noseMesh);

    // Friendly Smile
    const smileGeo = new THREE.BoxGeometry(0.034 * scale, 0.007 * scale, 0.012 * scale);
    const smileMesh = new THREE.Mesh(smileGeo, lipMat);
    smileMesh.position.set(0, 0.068 * scale, 0.112 * scale);
    headGroup.add(smileMesh);

    // Rutu: Soft blush cheeks
    if (!isMale) {
      const blushMat = new THREE.MeshBasicMaterial({
        color: 0xf08094,
        transparent: true,
        opacity: 0.42
      });
      materials.push(blushMat);

      const blushGeo = new THREE.SphereGeometry(0.018 * scale, 12, 12);
      blushGeo.scale(1.2, 0.7, 0.25);

      const leftBlush = new THREE.Mesh(blushGeo, blushMat);
      leftBlush.position.set(-0.064 * scale, 0.096 * scale, 0.098 * scale);
      headGroup.add(leftBlush);

      const rightBlush = new THREE.Mesh(blushGeo, blushMat);
      rightBlush.position.set(0.064 * scale, 0.096 * scale, 0.098 * scale);
      headGroup.add(rightBlush);
    }

    // --- 5. Clean, Sculpted Hair ---
    if (isMale) {
      // Jenil: Modern textured tapered haircut
      const hairCrownGeo = new THREE.SphereGeometry(0.124 * scale, 28, 24, 0, Math.PI * 2, 0, Math.PI * 0.58);
      hairCrownGeo.scale(1.02, 1.05, 1.04);
      const hairCrown = new THREE.Mesh(hairCrownGeo, hairMat);
      hairCrown.position.set(0, 0.130 * scale, -0.008 * scale);
      hairCrown.castShadow = true;
      headGroup.add(hairCrown);

      // Side tapers
      const sideGeo = new THREE.SphereGeometry(0.045 * scale, 12, 12);
      sideGeo.scale(0.3, 1.2, 1.0);

      const leftSide = new THREE.Mesh(sideGeo, hairMat);
      leftSide.position.set(-0.118 * scale, 0.135 * scale, -0.01 * scale);
      headGroup.add(leftSide);

      const rightSide = new THREE.Mesh(sideGeo, hairMat);
      rightSide.position.set(0.118 * scale, 0.135 * scale, -0.01 * scale);
      headGroup.add(rightSide);

      // Swept front bangs
      const fringeMainGeo = new THREE.CapsuleGeometry(0.018 * scale, 0.10 * scale, 8, 12);
      const fringeMain = new THREE.Mesh(fringeMainGeo, hairMat);
      fringeMain.rotation.set(0.25, 0.1, Math.PI * 0.52);
      fringeMain.position.set(0.01 * scale, 0.21 * scale, 0.075 * scale);
      fringeMain.castShadow = true;
      headGroup.add(fringeMain);

      const fringeAccentGeo = new THREE.CapsuleGeometry(0.014 * scale, 0.06 * scale, 8, 12);
      const fringeAccent = new THREE.Mesh(fringeAccentGeo, hairMat);
      fringeAccent.rotation.set(-0.1, -0.2, 0.35);
      fringeAccent.position.set(-0.04 * scale, 0.20 * scale, 0.088 * scale);
      headGroup.add(fringeAccent);

      // Nape taper
      const napeGeo = new THREE.SphereGeometry(0.08 * scale, 14, 14);
      napeGeo.scale(1.0, 0.8, 0.5);
      const napeMesh = new THREE.Mesh(napeGeo, hairMat);
      napeMesh.position.set(0, 0.08 * scale, -0.095 * scale);
      headGroup.add(napeMesh);
    } else {
      // Rutu: Elegant layered brunette hair with high ponytail & gold cuff
      const hairCrownGeo = new THREE.SphereGeometry(0.126 * scale, 28, 24, 0, Math.PI * 2, 0, Math.PI * 0.60);
      const hairCrown = new THREE.Mesh(hairCrownGeo, hairMat);
      hairCrown.position.set(0, 0.132 * scale, -0.006 * scale);
      hairCrown.castShadow = true;
      headGroup.add(hairCrown);

      // Front side-swept bangs
      const bangGeo = new THREE.CapsuleGeometry(0.016 * scale, 0.08 * scale, 8, 12);

      const leftBang = new THREE.Mesh(bangGeo, hairMat);
      leftBang.rotation.set(0.2, -0.1, 0.55);
      leftBang.position.set(-0.04 * scale, 0.20 * scale, 0.082 * scale);
      headGroup.add(leftBang);

      const rightBang = new THREE.Mesh(bangGeo, hairMat);
      rightBang.rotation.set(0.2, 0.1, -0.55);
      rightBang.position.set(0.04 * scale, 0.20 * scale, 0.082 * scale);
      headGroup.add(rightBang);

      // Face-framing side locks
      const lockGeo = new THREE.CapsuleGeometry(0.014 * scale, 0.14 * scale, 8, 10);

      const leftLock = new THREE.Mesh(lockGeo, hairMat);
      leftLock.position.set(-0.112 * scale, 0.08 * scale, 0.04 * scale);
      headGroup.add(leftLock);

      const rightLock = new THREE.Mesh(lockGeo, hairMat);
      rightLock.position.set(0.112 * scale, 0.08 * scale, 0.04 * scale);
      headGroup.add(rightLock);

      // Gold Hair Ring / Cuff
      const ringGeo = new THREE.TorusGeometry(0.026 * scale, 0.008 * scale, 10, 20);
      const ringMesh = new THREE.Mesh(ringGeo, goldMat);
      ringMesh.rotation.set(Math.PI * 0.40, 0, 0);
      ringMesh.position.set(0, 0.19 * scale, -0.120 * scale);
      headGroup.add(ringMesh);

      // Cascading Ponytail: tapers gently downward from gold cuff
      const ponytailGeo = new THREE.CylinderGeometry(0.038 * scale, 0.014 * scale, 0.26 * scale, 16);
      ponytailGeo.translate(0, -0.13 * scale, 0);
      const ponytail = new THREE.Mesh(ponytailGeo, hairMat);
      ponytail.rotation.x = 0.22;
      ponytail.position.set(0, 0.19 * scale, -0.120 * scale);
      ponytail.castShadow = true;
      headGroup.add(ponytail);
    }

    chestGroup.add(headGroup);

    // --- 6. Arms (Shoulder -> Bicep -> Forearm -> Hand) ---
    const shoulderWidth = 0.21 * scale;
    const shoulderGeo = new THREE.SphereGeometry(0.046 * scale, 14, 14);

    const upperArmLength = 0.18 * scale;
    const upperArmGeo = new THREE.CapsuleGeometry(0.038 * scale, 0.14 * scale, 10, 14);
    upperArmGeo.translate(0, -upperArmLength / 2, 0);

    const forearmLength = 0.18 * scale;
    const forearmGeo = new THREE.CapsuleGeometry(0.032 * scale, 0.14 * scale, 10, 14);
    forearmGeo.translate(0, -forearmLength / 2, 0);

    const handGeo = new THREE.SphereGeometry(0.028 * scale, 12, 12);
    handGeo.scale(1.0, 1.25, 0.6);

    const thumbGeo = new THREE.CapsuleGeometry(0.009 * scale, 0.020 * scale, 8, 8);

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
    leftHand.position.set(0, -forearmLength, 0);
    leftForearm.add(leftHand);

    const leftThumb = new THREE.Mesh(thumbGeo, skinMat);
    leftThumb.rotation.set(0.3, 0, -0.4);
    leftThumb.position.set(0.018 * scale, -forearmLength + 0.006 * scale, 0.010 * scale);
    leftForearm.add(leftThumb);

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
    rightHand.position.set(0, -forearmLength, 0);
    rightForearm.add(rightHand);

    const rightThumb = new THREE.Mesh(thumbGeo, skinMat);
    rightThumb.rotation.set(0.3, 0, 0.4);
    rightThumb.position.set(-0.018 * scale, -forearmLength + 0.006 * scale, 0.010 * scale);
    rightForearm.add(rightThumb);

    rightArm.add(rightForearm);
    chestGroup.add(rightArm);

    group.add(chestGroup);

    // --- 7. Legs (Hip -> Thigh -> Calf -> Shoes) ---
    const legSpacing = 0.095 * scale;
    const thighLength = 0.34 * scale;
    const calfLength = 0.34 * scale;

    const thighGeo = new THREE.CapsuleGeometry(0.048 * scale, 0.26 * scale, 12, 16);
    thighGeo.translate(0, -thighLength / 2, 0);

    const calfGeo = new THREE.CapsuleGeometry(0.038 * scale, 0.26 * scale, 12, 16);
    calfGeo.translate(0, -calfLength / 2, 0);

    // Shoe Construction
    const shoeGroup = new THREE.Group();
    shoeGroup.position.set(0, -calfLength, 0);

    if (isMale) {
      // Jenil: Designer Sneakers
      const sneakerBodyGeo = new THREE.CapsuleGeometry(0.038 * scale, 0.10 * scale, 10, 14);
      sneakerBodyGeo.rotateX(Math.PI / 2);
      sneakerBodyGeo.scale(1.05, 0.85, 1.45);
      const sneakerBody = new THREE.Mesh(sneakerBodyGeo, shoeMat);
      sneakerBody.position.set(0, -0.018 * scale, 0.028 * scale);
      sneakerBody.castShadow = true;
      shoeGroup.add(sneakerBody);

      const soleGeo = new THREE.CapsuleGeometry(0.040 * scale, 0.10 * scale, 10, 14);
      soleGeo.rotateX(Math.PI / 2);
      soleGeo.scale(1.10, 0.40, 1.50);
      const soleMesh = new THREE.Mesh(soleGeo, soleMat);
      soleMesh.position.set(0, -0.042 * scale, 0.028 * scale);
      soleMesh.castShadow = true;
      shoeGroup.add(soleMesh);
    } else {
      // Rutu: Chic Ankle Boots
      const bootBodyGeo = new THREE.CapsuleGeometry(0.035 * scale, 0.09 * scale, 10, 14);
      bootBodyGeo.rotateX(Math.PI / 2);
      bootBodyGeo.scale(1.0, 0.9, 1.4);
      const bootBody = new THREE.Mesh(bootBodyGeo, shoeMat);
      bootBody.position.set(0, -0.020 * scale, 0.025 * scale);
      bootBody.castShadow = true;
      shoeGroup.add(bootBody);

      const heelGeo = new THREE.BoxGeometry(0.065 * scale, 0.025 * scale, 0.050 * scale);
      const heelMesh = new THREE.Mesh(heelGeo, shoeMat);
      heelMesh.position.set(0, -0.042 * scale, -0.025 * scale);
      heelMesh.castShadow = true;
      shoeGroup.add(heelMesh);
    }

    // Left Leg
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-legSpacing, 0.74 * scale, 0);

    const leftThigh = new THREE.Mesh(thighGeo, pantsMat);
    leftThigh.castShadow = true;
    leftLeg.add(leftThigh);

    const leftLowerLeg = new THREE.Group();
    leftLowerLeg.position.set(0, -thighLength, 0);

    const leftCalf = new THREE.Mesh(calfGeo, pantsMat);
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

    const rightCalf = new THREE.Mesh(calfGeo, pantsMat);
    rightCalf.castShadow = true;
    rightLowerLeg.add(rightCalf);
    rightLowerLeg.add(shoeGroup.clone());
    rightLeg.add(rightLowerLeg);
    group.add(rightLeg);

    // --- 8. Modern Frosted Glass Name Tag ---
    const nameTag = this.createNameTagSprite(isMale ? 'Jenil' : 'Rutu');
    nameTag.position.set(0, height + 0.20, 0);
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
    // Keep the procedural character available while the asset downloads, then replace
    // it with the supplied character model without delaying the rest of the museum.
    const proceduralParts = group.children.filter((child) => child !== nameTag);
    this.loadCharacterAsset(id, group, proceduralParts, nameTag, height, materials, animator);

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

      // Clean distance-based visibility:
      // Hide if camera is close (< 2.2m) to prevent obstructing third-person player view
      if (dist < 2.2) {
        nameTag.visible = false;
      } else if (dist > 14) {
        nameTag.visible = false;
      } else {
        nameTag.visible = true;
        if (dist > 9) {
          nameTag.material.opacity = Math.max(0, 1 - (dist - 9) / 5);
        } else if (dist < 3.0) {
          nameTag.material.opacity = Math.max(0, (dist - 2.2) / 0.8);
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

  private static loadCharacterAsset(
    id: CharacterId,
    group: THREE.Group,
    proceduralParts: THREE.Object3D[],
    nameTag: THREE.Sprite,
    targetHeight: number,
    materials: THREE.Material[],
    animator: CharacterAnimator
  ): void {
    const loader = new GLTFLoader();
    // The original character GLBs are static. Use the supplied rigged walk
    // versions as the rendered models so their skeleton clips can play.
    const hasRiggedAnimations = id === 'jenil' || id === 'rutu';
    const assetUrl = hasRiggedAnimations
      ? `/assets/characters/${id}_walk_animation.glb`
      : `/assets/characters/${id}.glb`;
    loader.load(
      assetUrl,
      (gltf) => {
        const asset = gltf.scene;
        const bounds = new THREE.Box3().setFromObject(asset);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());

        if (size.y <= 0) {
          console.error(`Character asset for ${id} has no height.`);
          return;
        }

        // Scale and center every source model consistently with the player's collider.
        const scale = targetHeight / size.y;
        asset.scale.setScalar(scale);
        asset.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
        asset.name = `CharacterAsset_${id}`;

        const motionPivot = new THREE.Group();
        motionPivot.name = `CharacterMotion_${id}`;
        motionPivot.add(asset);

        asset.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          object.castShadow = true;
          object.receiveShadow = true;
          const meshMaterials = Array.isArray(object.material) ? object.material : [object.material];
          for (const material of meshMaterials) {
            if (!materials.includes(material)) materials.push(material);
          }
        });

        for (const part of proceduralParts) group.remove(part);
        group.add(motionPivot);
        const walkClipName = id === 'rutu' ? 'Walking_Woman' : 'Walking';
        const danceClipName = id === 'rutu' ? 'You_Groove' : 'Boom_Dance';
        const walkClip = gltf.animations.find((clip) => clip.name === walkClipName);
        if (!hasRiggedAnimations || !walkClip) {
          animator.setModelVisual(motionPivot);
        } else {
          animator.setGLTFAnimations(motionPivot, walkClip, null);
          loader.load(
            `/assets/characters/${id}_dance_animation.glb`,
            (danceGltf) => {
              const danceClip = danceGltf.animations.find((clip) => clip.name === danceClipName) ?? null;
              animator.setGLTFAnimations(motionPivot, walkClip, danceClip);
            },
            undefined,
            (error) => console.error(`Unable to load ${id} dance animation.`, error)
          );
        }
        // The label is deliberately kept above the normalized source model.
        nameTag.position.y = targetHeight + 0.20;
      },
      undefined,
      (error) => console.error(`Unable to load ${id} character asset.`, error)
    );
  }

  private static createNameTagSprite(name: string): THREE.Sprite {
    if (typeof document === 'undefined') {
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, opacity: 1.0 }));
      sprite.name = `NameTag_${name}`;
      sprite.scale.set(0.65, 0.19, 1.0);
      return sprite;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 112;
    const ctx = canvas.getContext('2d')!;

    // Elegant frosted pill background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.beginPath();
    ctx.roundRect(12, 12, 360, 88, 22);
    ctx.fill();

    // Subtle luminescent border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Crisp typography with subtle drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, 192, 56);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;

    const spriteMat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthTest: false
    });

    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(0.65, 0.19, 1.0);
    return sprite;
  }
}
