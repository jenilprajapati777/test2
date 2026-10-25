import { EXIT_1_TRIGGER, EXIT_2_TRIGGER, PLAYER_SPAWN, COMPANION_SPAWN } from '../config/layout.js';
import { GameStateMachine } from '../core/stateMachine.js';
import { PlayerController } from '../characters/playerController.js';
import { Companion } from '../characters/companion.js';
import { RaycastCamera } from '../physics/raycastCamera.js';
import { ContentSchema } from '../config/content.js';
import { RightPathEnding } from './rightPath.js';
import { HellScene } from './hellScene.js';

export interface EndingControllerOptions {
  stateMachine: GameStateMachine;
  player: PlayerController;
  companion: Companion;
  camera: RaycastCamera;
  content: ContentSchema;
  onSwitchToHell: (hell: HellScene) => void;
  onRestoreMuseum: () => void;
}

export class EndingController {
  private options: EndingControllerOptions;
  private fader: HTMLElement;
  private rightPathEnding: RightPathEnding;
  private currentHellScene: HellScene | null = null;
  private isProcessingTrigger = false;

  constructor(options: EndingControllerOptions) {
    this.options = options;

    this.fader = document.createElement('div');
    this.fader.id = 'screen-fader';
    document.body.appendChild(this.fader);

    this.rightPathEnding = new RightPathEnding({
      content: this.options.content,
      onReplay: () => this.handleRespawn()
    });
    document.body.appendChild(this.rightPathEnding.getElement());
  }

  public update(playerX: number, playerY: number): void {
    if (this.isProcessingTrigger || !this.options.stateMachine.isMovementAllowed()) {
      return;
    }

    // Check Exit 1 Trigger: [-9, -8.4] x [11, 14]
    if (
      playerX >= EXIT_1_TRIGGER.xMin &&
      playerX <= EXIT_1_TRIGGER.xMax &&
      playerY >= EXIT_1_TRIGGER.yMin &&
      playerY <= EXIT_1_TRIGGER.yMax
    ) {
      this.triggerExit1();
      return;
    }

    // Check Exit 2 Trigger: [8.4, 9] x [11, 14]
    if (
      playerX >= EXIT_2_TRIGGER.xMin &&
      playerX <= EXIT_2_TRIGGER.xMax &&
      playerY >= EXIT_2_TRIGGER.yMin &&
      playerY <= EXIT_2_TRIGGER.yMax
    ) {
      this.triggerExit2();
      return;
    }
  }

  private triggerExit1(): void {
    this.isProcessingTrigger = true;
    this.options.stateMachine.transitionTo('EXIT1_FADE');

    // Fade to black (0.8s)
    this.fadeToBlack(800, () => {
      // Hold black for 400ms
      setTimeout(() => {
        this.options.stateMachine.transitionTo('RIGHT_PATH');
        this.rightPathEnding.show();
        this.fadeIn(600, () => {
          this.isProcessingTrigger = false;
        });
      }, 400);
    });
  }

  private triggerExit2(): void {
    this.isProcessingTrigger = true;
    this.options.stateMachine.transitionTo('EXIT2_FADE');

    // Fade to black (0.8s)
    this.fadeToBlack(800, () => {
      // Switch to HellScene
      const hell = new HellScene(this.options.player.getModel(), this.options.content, {
        onYesRetry: () => this.handleRespawn(),
        onNoFarewell: () => {
          if (this.options.stateMachine.getState() === 'WRONG_PATH_PROMPT') {
            this.options.stateMachine.transitionTo('FAREWELL');
          }
        }
      });

      this.currentHellScene = hell;
      document.body.appendChild(hell.uiOverlay);
      this.options.onSwitchToHell(hell);

      hell.activate();
      this.options.stateMachine.transitionTo('HELL_FALL');

      // Fade in to hell (0.6s)
      this.fadeIn(600, () => {
        this.isProcessingTrigger = false;
        // Schedule state transition to WRONG_PATH_PROMPT at t = 6.0s
        setTimeout(() => {
          if (this.options.stateMachine.getState() === 'HELL_FALL') {
            this.options.stateMachine.transitionTo('WRONG_PATH_PROMPT');
          }
        }, 5000);
      });
    });
  }

  public handleRespawn(): void {
    this.isProcessingTrigger = true;
    this.options.stateMachine.transitionTo('RESPAWN');

    this.fadeToBlack(600, () => {
      // Clean up HellScene if active
      if (this.currentHellScene) {
        this.currentHellScene.dispose();
        if (this.currentHellScene.uiOverlay.parentElement) {
          this.currentHellScene.uiOverlay.parentElement.removeChild(this.currentHellScene.uiOverlay);
        }
        this.currentHellScene = null;
      }

      this.rightPathEnding.hide();
      this.options.onRestoreMuseum();

      // Reset positions to spawn
      this.options.player.teleport(PLAYER_SPAWN.x, PLAYER_SPAWN.y, PLAYER_SPAWN.yawDeg);
      this.options.companion.teleport(COMPANION_SPAWN.x, COMPANION_SPAWN.y, PLAYER_SPAWN.yawDeg);
      this.options.camera.snapTo(PLAYER_SPAWN.x, PLAYER_SPAWN.y, (PLAYER_SPAWN.yawDeg * Math.PI) / 180);

      // Fade in (800ms)
      this.fadeIn(800, () => {
        this.options.stateMachine.transitionTo('EXPLORING');
        this.isProcessingTrigger = false;
      });
    });
  }

  public fadeToBlack(durationMs: number, onComplete?: () => void): void {
    this.fader.style.transition = `opacity ${durationMs}ms ease-in-out`;
    this.fader.classList.add('opaque');
    setTimeout(() => {
      if (onComplete) onComplete();
    }, durationMs);
  }

  public fadeIn(durationMs: number, onComplete?: () => void): void {
    this.fader.style.transition = `opacity ${durationMs}ms ease-in-out`;
    this.fader.classList.remove('opaque');
    setTimeout(() => {
      if (onComplete) onComplete();
    }, durationMs);
  }

  public getHellScene(): HellScene | null {
    return this.currentHellScene;
  }
}
