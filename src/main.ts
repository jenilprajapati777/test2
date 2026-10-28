import * as THREE from 'three';
import { PLAYER_SPAWN, COMPANION_SPAWN, Slot } from './config/layout.js';
import { loadContent, ContentSchema } from './config/content.js';
import { GameStateMachine } from './core/stateMachine.js';
import { MaterialPalette } from './world/materials.js';
import { WorldBuilder } from './world/worldBuilder.js';
import { LightingRig } from './world/lighting.js';
import { PropsBuilder } from './world/props.js';
import { FramesBuilder } from './world/frames.js';
import { CollisionWorld } from './physics/collisionWorld.js';
import { CharacterFactory, CharacterId } from './characters/characterFactory.js';
import { PlayerController } from './characters/playerController.js';
import { Companion } from './characters/companion.js';
import { RaycastCamera } from './physics/raycastCamera.js';
import { MediaResolver } from './media/mediaResolver.js';
import { VideoManager } from './media/videoManager.js';
import { AudioManager } from './audio/audioManager.js';
import { LoadingScreen } from './ui/loading.js';
import { CharacterSelectUI } from './ui/characterSelect.js';
import { MuseumHUD } from './ui/hud.js';
import { InteractionPrompts } from './ui/prompts.js';
import { ViewersModal } from './ui/viewers.js';
import { MobileControls } from './ui/joystick.js';
import { EndingController } from './endings/endingController.js';
import { HellScene } from './endings/hellScene.js';
import { registerDebugApi } from './core/debugApi.js';

class MuseumApp {
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private cameraRig!: RaycastCamera;
  private collisionWorld!: CollisionWorld;
  private stateMachine!: GameStateMachine;

  private materials!: MaterialPalette;
  private worldBuilder!: WorldBuilder;
  private lightingRig!: LightingRig;
  private propsBuilder!: PropsBuilder;
  private framesBuilder!: FramesBuilder;
  private mediaResolver!: MediaResolver;
  private videoManager!: VideoManager;
  private audioManager!: AudioManager;

  private player!: PlayerController;
  private companion!: Companion;
  private endingController!: EndingController;
  private activeHellScene: HellScene | null = null;

  private loadingScreen!: LoadingScreen;
  private characterSelectUI!: CharacterSelectUI;
  private hud!: MuseumHUD;
  private prompts!: InteractionPrompts;
  private viewersModal!: ViewersModal;
  private mobileControls!: MobileControls;

  private content!: ContentSchema;
  private viewedSlots = new Set<string>();

  private isMouseDown = false;
  private isDancing = false;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private timeScale = 1.0;
  private lastFrameTime = performance.now();

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    const canvas = document.querySelector('#webgl-canvas') as HTMLCanvasElement;
    const uiContainer = document.querySelector('#ui-container') as HTMLElement;

    // 1. Renderer setup with adaptive device performance
    const isMobileOrLowEnd =
      typeof navigator !== 'undefined' &&
      (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4) ||
        window.innerWidth < 800);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !isMobileOrLowEnd,
      powerPreference: 'high-performance',
      precision: isMobileOrLowEnd ? 'mediump' : 'highp'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    const maxDpr = isMobileOrLowEnd ? 1.25 : 1.5;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    // 2. State & Core Systems
    this.stateMachine = new GameStateMachine(false);
    this.collisionWorld = new CollisionWorld();
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0e0d0c);

    // 3. UI: Loading Screen
    this.loadingScreen = new LoadingScreen();
    uiContainer.appendChild(this.loadingScreen.getElement());
    this.stateMachine.transitionTo('LOADING');

    // 4. Content & Media
    this.loadingScreen.setProgress(20, 'Loading configuration...');
    this.content = await loadContent();
    this.mediaResolver = new MediaResolver();
    this.videoManager = new VideoManager(this.mediaResolver);
    this.audioManager = new AudioManager();

    // 5. 3D World Construction
    this.loadingScreen.setProgress(45, 'Building gallery halls...');
    this.materials = new MaterialPalette();
    this.worldBuilder = new WorldBuilder(this.materials);
    this.scene.add(this.worldBuilder.group);

    this.lightingRig = new LightingRig();
    this.scene.add(this.lightingRig.group);

    this.propsBuilder = new PropsBuilder(this.materials);
    this.scene.add(this.propsBuilder.group);

    this.framesBuilder = new FramesBuilder(this.materials, this.content, this.mediaResolver, this.videoManager);
    this.scene.add(this.framesBuilder.group);

    // 6. Camera & Characters Setup
    this.loadingScreen.setProgress(75, 'Preparing characters...');
    this.cameraRig = new RaycastCamera(this.collisionWorld);

    // Default: Rutu is player, Jenil is companion
    const defaultChar = this.content.meta.defaultCharacter || 'rutu';
    const playerModel = CharacterFactory.createProcedural(defaultChar);
    const companionId: CharacterId = defaultChar === 'rutu' ? 'jenil' : 'rutu';
    const companionModel = CharacterFactory.createProcedural(companionId);

    this.scene.add(playerModel.group);
    this.scene.add(companionModel.group);

    this.player = new PlayerController(
      playerModel,
      this.collisionWorld,
      PLAYER_SPAWN.x,
      PLAYER_SPAWN.y,
      PLAYER_SPAWN.yawDeg
    );

    this.companion = new Companion(
      companionModel,
      this.collisionWorld,
      COMPANION_SPAWN.x,
      COMPANION_SPAWN.y,
      PLAYER_SPAWN.yawDeg
    );

    this.cameraRig.snapTo(PLAYER_SPAWN.x, PLAYER_SPAWN.y, (PLAYER_SPAWN.yawDeg * Math.PI) / 180);

    // 7. Endings & UI Overlays
    this.endingController = new EndingController({
      stateMachine: this.stateMachine,
      player: this.player,
      companion: this.companion,
      camera: this.cameraRig,
      content: this.content,
      onSwitchToHell: (hell) => {
        this.activeHellScene = hell;
      },
      onRestoreMuseum: () => {
        this.activeHellScene = null;
        // Defensive check: ensure both player and companion models are parented to scene and fully visible
        const pModel = this.player.getModel();
        const cModel = this.companion.getModel();
        if (!this.scene.children.includes(pModel.group)) {
          this.scene.add(pModel.group);
        }
        if (!this.scene.children.includes(cModel.group)) {
          this.scene.add(cModel.group);
        }
        pModel.setOpacity(1.0);
        cModel.setOpacity(1.0);
        pModel.group.visible = true;
        cModel.group.visible = true;
        pModel.group.rotation.set(0, (PLAYER_SPAWN.yawDeg * Math.PI) / 180 + Math.PI, 0);
        cModel.group.rotation.set(0, (PLAYER_SPAWN.yawDeg * Math.PI) / 180 + Math.PI, 0);
      }
    });

    this.hud = new MuseumHUD({
      onToggleMute: () => this.audioManager.toggleMute(),
      onToggleDance: () => this.toggleDance()
    });
    uiContainer.appendChild(this.hud.getElement());

    this.prompts = new InteractionPrompts((slot) => {
      this.handleInteract(slot);
    });
    uiContainer.appendChild(this.prompts.getElement());

    this.viewersModal = new ViewersModal(
      this.content,
      this.mediaResolver,
      this.videoManager,
      () => {
        if (this.stateMachine.getState() === 'VIEWING_MEDIA') {
          this.stateMachine.transitionTo('EXPLORING');
        }
      }
    );
    uiContainer.appendChild(this.viewersModal.getElement());

    this.mobileControls = new MobileControls(
      this.player,
      this.cameraRig,
      () => this.prompts.triggerInteract()
    );
    uiContainer.appendChild(this.mobileControls.getElement());

    // 8. Character Select Screen
    this.characterSelectUI = new CharacterSelectUI({
      defaultCharacter: defaultChar,
      onSelect: (selectedId) => {
        this.switchCharacter(selectedId);
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('test') === '1') {
          this.stateMachine.transitionTo('EXPLORING');
        } else {
          // Play brief 1.5s intro fade into exploring
          this.stateMachine.transitionTo('INTRO');
          setTimeout(() => {
            if (this.stateMachine.getState() === 'INTRO') {
              this.stateMachine.transitionTo('EXPLORING');
            }
          }, 1500);
        }
      }
    });
    uiContainer.appendChild(this.characterSelectUI.getElement());

    // 9. Input & Window Listeners
    this.setupEventListeners(canvas);

    // 10. Register Debug API (if ?test=1)
    registerDebugApi({
      stateMachine: this.stateMachine,
      player: this.player,
      companion: this.companion,
      camera: this.cameraRig,
      getNearbyInteractable: () => this.prompts.getCurrentSlotId(),
      interact: () => this.prompts.triggerInteract(),
      closeViewer: () => this.viewersModal.close(),
      getViewedSlots: () => Array.from(this.viewedSlots),
      getSlotInfo: (id: string) => this.mediaResolver.getSlotInfo(id),
      getStats: () => ({
        fps: 60,
        drawCalls: this.renderer.info.render.calls,
        triangles: this.renderer.info.render.triangles,
        memory: {
          geometries: this.renderer.info.memory.geometries,
          textures: this.renderer.info.memory.textures
        }
      }),
      getHellStats: () => ({
        cameraY: this.activeHellScene ? this.activeHellScene.getCameraY() : 0,
        particleCount: this.activeHellScene ? this.activeHellScene.getParticleCount() : 0,
        isActive: this.activeHellScene ? this.activeHellScene.isActive() : false
      }),
      setTimeScale: (scale: number) => {
        this.timeScale = scale;
      }
    });

    // 11. Complete Loading & Show Character Select
    this.stateMachine.transitionTo('CHARACTER_SELECT');
    this.loadingScreen.hide(() => {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('test') === '1' && urlParams.get('autoSelect') === '1') {
        // Auto select in automated test environments
        this.characterSelectUI.hide();
        this.stateMachine.transitionTo('EXPLORING');
      }
    });

    // 12. Start Render Loop
    requestAnimationFrame((t) => this.loop(t));
  }

  private switchCharacter(selectedId: CharacterId): void {
    const companionId: CharacterId = selectedId === 'rutu' ? 'jenil' : 'rutu';

    // Remove old models from scene
    this.scene.remove(this.player.getModel().group);
    this.scene.remove(this.companion.getModel().group);

    // Create new models
    const newPlayerModel = CharacterFactory.createProcedural(selectedId);
    const newCompanionModel = CharacterFactory.createProcedural(companionId);

    this.scene.add(newPlayerModel.group);
    this.scene.add(newCompanionModel.group);

    this.player.setModel(newPlayerModel);
    this.companion.setModel(newCompanionModel);
  }

  private handleInteract(slot: Slot): void {
    if (this.viewersModal.isOpen()) return;

    // Mark as viewed and update counter
    if (!this.viewedSlots.has(slot.id)) {
      this.viewedSlots.add(slot.id);
      this.hud.updateMemoryCount(this.viewedSlots.size, 15);
    }

    this.stateMachine.transitionTo('VIEWING_MEDIA');
    this.viewersModal.open(slot);
  }

  private setupEventListeners(_canvas: HTMLCanvasElement): void {
    window.addEventListener('keydown', (e) => {
      if (e.code !== 'KeyG' || e.repeat) return;
      this.toggleDance();
    });

    const startDrag = (clientX: number, clientY: number, target: EventTarget | null) => {
      // Don't intercept button or interactive clicks
      if (target instanceof HTMLElement && (
        target.tagName === 'BUTTON' ||
        target.closest('button') ||
        target.closest('.viewer-modal') ||
        target.closest('.character-select-modal') ||
        target.closest('#joystick-base') ||
        target.closest('#interact-action-btn')
      )) {
        return;
      }
      this.isMouseDown = true;
      this.lastMouseX = clientX;
      this.lastMouseY = clientY;
    };

    // Mouse drag orbit (responsive anywhere on screen)
    window.addEventListener('mousedown', (e) => {
      startDrag(e.clientX, e.clientY, e.target);
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isMouseDown) return;
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this.cameraRig.handleOrbit(dx, dy);
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
    });

    // Touch drag orbit for mobile
    window.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        startDrag(e.touches[0].clientX, e.touches[0].clientY, e.target);
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!this.isMouseDown || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const dx = touch.clientX - this.lastMouseX;
      const dy = touch.clientY - this.lastMouseY;
      this.lastMouseX = touch.clientX;
      this.lastMouseY = touch.clientY;
      this.cameraRig.handleOrbit(dx, dy);
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.isMouseDown = false;
    });

    // Mouse wheel zoom
    window.addEventListener('wheel', (e) => {
      this.cameraRig.handleZoom(e.deltaY);
    }, { passive: true });

    // Resize handler
    window.addEventListener('resize', () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      this.renderer.setSize(width, height);
      const isMobilePortrait = width < 600 && height > width;
      this.cameraRig.setAspectRatio(width / height, isMobilePortrait);
    });
  }

  private toggleDance(): boolean {
    this.isDancing = !this.isDancing;
    this.player.getModel().animator.setDancing(this.isDancing);
    this.companion.getModel().animator.setDancing(this.isDancing);
    this.hud.setDanceMode(this.isDancing);
    return this.isDancing;
  }

  private loop(now: number): void {
    requestAnimationFrame((t) => this.loop(t));

    const rawDt = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;
    const dt = Math.min(0.1, rawDt) * this.timeScale;
    const time = now / 1000;

    // Check if in HellScene
    if (this.activeHellScene && this.activeHellScene.isActive()) {
      this.activeHellScene.update(dt);
      this.renderer.render(this.activeHellScene.scene, this.activeHellScene.camera);
      return;
    }

    // Normal Museum Update
    const inputAllowed = this.stateMachine.isMovementAllowed();

    // 1. Update Player
    this.player.update(dt, this.cameraRig.yaw, inputAllowed);

    // 2. Update Companion
    this.companion.update(dt, this.player.planX, this.player.planY, this.player.yawRad, this.player.speed);

    // 3. Update Camera
    this.cameraRig.update(dt, this.player.planX, this.player.planY, (opacity) => {
      this.player.getModel().setOpacity(opacity);
    });

    // 4. Update Name tags
    this.player.getModel().updateNameTagDistance(this.cameraRig.camera.position);
    this.companion.getModel().updateNameTagDistance(this.cameraRig.camera.position);

    // 5. Update World Visuals
    this.lightingRig.update(dt, time);
    this.propsBuilder.update(time);
    this.framesBuilder.update(time);

    // 6. Audio & Video
    this.audioManager.updateFootsteps(dt, this.player.speed, this.player.isRunning);
    this.videoManager.update(this.player.planX, this.player.planY);

    // 7. Prompts & Triggers
    this.prompts.update(this.player.planX, this.player.planY, this.player.yawRad, this.cameraRig.yaw);
    this.endingController.update(this.player.planX, this.player.planY);

    // 8. Minimap
    this.hud.minimap.update(
      this.player.planX,
      this.player.planY,
      this.player.yawRad,
      this.companion.planX,
      this.companion.planY,
      this.viewedSlots
    );

    // 9. Render Museum Scene
    this.renderer.render(this.scene, this.cameraRig.camera);
  }
}

// Bootstrap
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => {
      new MuseumApp();
    });
  } else {
    new MuseumApp();
  }
}
