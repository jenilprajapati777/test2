import * as THREE from 'three';
import { SLOTS, Slot } from '../config/layout.js';
import { MaterialPalette } from './materials.js';
import { ContentSchema } from '../config/content.js';
import { PlaceholderTextures } from '../media/placeholderTextures.js';
import { MediaResolver } from '../media/mediaResolver.js';
import { VideoManager } from '../media/videoManager.js';

export interface FrameMeshItem {
  slot: Slot;
  group: THREE.Group;
  contentMesh: THREE.Mesh;
  update?: (time: number) => void;
  updateTexture?: (tex: THREE.Texture) => void;
}

export class FramesBuilder {
  public group: THREE.Group;
  public frameItems = new Map<string, FrameMeshItem>();
  private materials: MaterialPalette;
  private content: ContentSchema;
  private mediaResolver: MediaResolver;
  private videoManager?: VideoManager;
  private textureLoader = new THREE.TextureLoader();

  constructor(
    materials: MaterialPalette,
    content: ContentSchema,
    mediaResolver: MediaResolver,
    videoManager?: VideoManager
  ) {
    this.materials = materials;
    this.content = content;
    this.mediaResolver = mediaResolver;
    this.videoManager = videoManager;
    this.group = new THREE.Group();
    this.group.name = 'FramesGroup';

    this.buildAllFrames();
  }

  private buildAllFrames(): void {
    for (const slot of SLOTS) {
      if (slot.type === 'title plaque') {
        // T1 is built as part of the monument pillar in PropsBuilder
        continue;
      }

      const itemGroup = new THREE.Group();
      itemGroup.name = `Slot_${slot.id}`;

      // Coordinate mapping: Plan (x, y) -> Three.js (x, elev, -y)
      const [px, py] = slot.pos;
      const [nx, ny] = slot.n;
      // In Three.js: normal vector is (nx, 0, -ny)
      const threeNx = nx;
      const threeNz = -ny;

      // Position sits 0.03m in front of the wall surface along normal
      const posX = px + threeNx * 0.03;
      const posY = slot.elev;
      const posZ = -py + threeNz * 0.03;

      itemGroup.position.set(posX, posY, posZ);

      // Rotation to align with normal:
      // When normal is (0, -1) in plan -> Three.js (0, 1), angle is 0
      const yaw = Math.atan2(threeNx, threeNz);
      itemGroup.rotation.y = yaw;

      if (slot.type === 'photo') {
        this.buildPhotoFrame(slot, itemGroup);
      } else if (slot.type === 'video') {
        this.buildVideoScreen(slot, itemGroup);
      } else if (slot.type === 'board') {
        this.buildBoardPlaque(slot, itemGroup);
      } else if (slot.type === 'exit sign') {
        this.buildExitSign(slot, itemGroup);
      }

      // Add fake spotlight cone above the frame
      this.addFakeSpotlight(itemGroup, slot.box[1]);

      this.group.add(itemGroup);
    }
  }

  private buildPhotoFrame(slot: Slot, parent: THREE.Group): void {
    const [boxW, boxH] = slot.box;
    const frameDepth = 0.05;
    const border = 0.08;

    // Outer wooden frame
    const outerGeo = new THREE.BoxGeometry(boxW, boxH, frameDepth);
    const outerMesh = new THREE.Mesh(outerGeo, this.materials.frameMaterial);
    outerMesh.castShadow = true;
    parent.add(outerMesh);

    // Inner gold liner rim
    const goldLiner = new THREE.Mesh(
      new THREE.PlaneGeometry(boxW - border * 1.4, boxH - border * 1.4),
      this.materials.goldTrimMaterial
    );
    goldLiner.position.set(0, 0, frameDepth / 2 + 0.001);
    parent.add(goldLiner);

    // Inner white matte
    const matteGeo = new THREE.PlaneGeometry(boxW - border * 2, boxH - border * 2);
    const matteMat = new THREE.MeshStandardMaterial({ color: 0xfaf8f5, roughness: 0.9 });
    const matteMesh = new THREE.Mesh(matteGeo, matteMat);
    matteMesh.position.set(0, 0, frameDepth / 2 + 0.002);
    parent.add(matteMesh);

    // Photo plane (centered on matte)
    const photoW = boxW - border * 3;
    const photoH = boxH - border * 3;
    const photoGeo = new THREE.PlaneGeometry(photoW, photoH);
    const photoMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const photoMesh = new THREE.Mesh(photoGeo, photoMat);
    photoMesh.position.set(0, 0, frameDepth / 2 + 0.004);
    parent.add(photoMesh);

    // Small brass plaque below the photo
    const plaqueGeo = new THREE.PlaneGeometry(Math.min(0.6, boxW * 0.5), 0.08);
    const plaqueMesh = new THREE.Mesh(plaqueGeo, this.materials.brassMaterial);
    plaqueMesh.position.set(0, -boxH / 2 + 0.04, frameDepth / 2 + 0.003);
    parent.add(plaqueMesh);

    const frameItem: FrameMeshItem = {
      slot,
      group: parent,
      contentMesh: photoMesh,
      updateTexture: (tex: THREE.Texture) => {
        photoMesh.material = new THREE.MeshBasicMaterial({ map: tex });
      }
    };

    // Load initial texture via mediaResolver
    this.mediaResolver.resolvePhoto(slot.id).then((info) => {
      this.textureLoader.load(info.source, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        // Auto-fit aspect ratio inside box
        const imgAspect = tex.image.width / tex.image.height;
        const boxAspect = photoW / photoH;
        if (imgAspect > boxAspect) {
          photoMesh.scale.set(1.0, boxAspect / imgAspect, 1.0);
        } else {
          photoMesh.scale.set(imgAspect / boxAspect, 1.0, 1.0);
        }
        frameItem.updateTexture!(tex);
      });
    });

    this.frameItems.set(slot.id, frameItem);
  }

  private buildVideoScreen(slot: Slot, parent: THREE.Group): void {
    const [boxW, boxH] = slot.box;
    const bezelDepth = 0.06;

    // Cinema dark bezel
    const bezelGeo = new THREE.BoxGeometry(boxW, boxH, bezelDepth);
    const bezelMat = new THREE.MeshStandardMaterial({ color: 0x111114, roughness: 0.3, metalness: 0.8 });
    const bezelMesh = new THREE.Mesh(bezelGeo, bezelMat);
    parent.add(bezelMesh);

    // 16:9 Screen plane
    const screenGeo = new THREE.PlaneGeometry(boxW - 0.08, boxH - 0.08);
    const { texture: phTex, update: phUpdate } = PlaceholderTextures.createVideoPlaceholder(slot.id);
    const screenMat = new THREE.MeshBasicMaterial({ map: phTex, toneMapped: false });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.set(0, 0, bezelDepth / 2 + 0.002);
    parent.add(screenMesh);

    const frameItem: FrameMeshItem = {
      slot,
      group: parent,
      contentMesh: screenMesh,
      update: phUpdate,
      updateTexture: (tex: THREE.Texture) => {
        screenMesh.material = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
      }
    };

    this.frameItems.set(slot.id, frameItem);

    // Bind continuous live video playback directly to 3D museum screen
    if (this.videoManager) {
      this.videoManager.onTextureReady(slot.id, (tex) => {
        frameItem.updateTexture!(tex);
        frameItem.update = undefined;
      });
    }
  }

  private buildBoardPlaque(slot: Slot, parent: THREE.Group): void {
    const [boxW, boxH] = slot.box;
    const text = this.content.boards[slot.id] || `Dummy text for ${slot.id} - edit me later.`;

    const boardTex = PlaceholderTextures.createBoardTexture(slot.id, text);
    const boardGeo = new THREE.PlaneGeometry(boxW, boxH);
    const boardMat = new THREE.MeshBasicMaterial({ map: boardTex });
    const boardMesh = new THREE.Mesh(boardGeo, boardMat);
    boardMesh.position.set(0, 0, 0.02);
    parent.add(boardMesh);

    const frameItem: FrameMeshItem = {
      slot,
      group: parent,
      contentMesh: boardMesh
    };

    this.frameItems.set(slot.id, frameItem);
  }

  private buildExitSign(slot: Slot, parent: THREE.Group): void {
    const [boxW, boxH] = slot.box;
    const isExit1 = slot.id === 'S1';
    const text = isExit1 ? this.content.exits.exit1.signText : this.content.exits.exit2.signText;

    const signTex = PlaceholderTextures.createSignTexture(slot.id, text);
    const signGeo = new THREE.PlaneGeometry(boxW, boxH);
    const signMat = new THREE.MeshBasicMaterial({ map: signTex });
    const signMesh = new THREE.Mesh(signGeo, signMat);
    signMesh.position.set(0, 0, 0.02);
    parent.add(signMesh);

    const frameItem: FrameMeshItem = {
      slot,
      group: parent,
      contentMesh: signMesh
    };

    this.frameItems.set(slot.id, frameItem);
  }

  // Faked spotlight: brass picture lamp fixture + additive light cone
  private addFakeSpotlight(parent: THREE.Group, itemHeight: number): void {
    // Picture lamp horizontal brass arm & hood
    const armGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.16, 8);
    const arm = new THREE.Mesh(armGeo, this.materials.brassMaterial);
    arm.rotation.x = Math.PI / 2;
    arm.position.set(0, itemHeight / 2 + 0.16, 0.08);
    parent.add(arm);

    const hoodGeo = new THREE.CylinderGeometry(0.035, 0.035, Math.min(0.55, parent.position.length() > 0 ? 0.45 : 0.4), 12);
    const hood = new THREE.Mesh(hoodGeo, this.materials.brassMaterial);
    hood.rotation.z = Math.PI / 2;
    hood.position.set(0, itemHeight / 2 + 0.16, 0.16);
    parent.add(hood);

    // Warm soft additive light cone
    const coneGeo = new THREE.ConeGeometry(0.72, 1.5, 16, 1, true);
    coneGeo.translate(0, -0.75, 0);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xfff2d6,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.set(0, itemHeight / 2 + 0.16, 0.16);
    cone.rotation.x = -0.20;
    parent.add(cone);
  }

  public update(time: number): void {
    for (const item of this.frameItems.values()) {
      if (item.update) {
        item.update(time);
      }
    }
  }
}
