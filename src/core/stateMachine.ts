export type GameState =
  | 'BOOT'
  | 'LOADING'
  | 'CHARACTER_SELECT'
  | 'INTRO'
  | 'EXPLORING'
  | 'VIEWING_MEDIA'
  | 'EXIT1_FADE'
  | 'RIGHT_PATH'
  | 'EXIT2_FADE'
  | 'HELL_FALL'
  | 'WRONG_PATH_PROMPT'
  | 'FAREWELL'
  | 'RESPAWN';

export type StateListener = (from: GameState, to: GameState) => void;

export class GameStateMachine {
  private currentState: GameState = 'BOOT';
  private listeners: StateListener[] = [];
  private isDev = true;

  // Legal transitions map
  private readonly legalTransitions: Record<GameState, GameState[]> = {
    BOOT: ['LOADING'],
    LOADING: ['CHARACTER_SELECT', 'EXPLORING'],
    CHARACTER_SELECT: ['INTRO', 'EXPLORING'],
    INTRO: ['EXPLORING'],
    EXPLORING: ['VIEWING_MEDIA', 'EXIT1_FADE', 'EXIT2_FADE'],
    VIEWING_MEDIA: ['EXPLORING'],
    EXIT1_FADE: ['RIGHT_PATH'],
    RIGHT_PATH: ['RESPAWN'],
    EXIT2_FADE: ['HELL_FALL'],
    HELL_FALL: ['WRONG_PATH_PROMPT'],
    WRONG_PATH_PROMPT: ['RESPAWN', 'FAREWELL'],
    FAREWELL: ['RESPAWN'],
    RESPAWN: ['EXPLORING']
  };

  constructor(isDev = true) {
    this.isDev = isDev;
  }

  public getState(): GameState {
    return this.currentState;
  }

  public canTransitionTo(target: GameState): boolean {
    const allowed = this.legalTransitions[this.currentState] || [];
    return allowed.includes(target);
  }

  public transitionTo(target: GameState): boolean {
    if (this.currentState === target) return true;

    if (!this.canTransitionTo(target)) {
      const msg = `Illegal state transition from ${this.currentState} to ${target}`;
      if (this.isDev) {
        throw new Error(msg);
      } else {
        console.warn(msg);
        return false;
      }
    }

    const prev = this.currentState;
    this.currentState = target;
    for (const listener of this.listeners) {
      try {
        listener(prev, target);
      } catch (err) {
        console.error('Error in state machine listener:', err);
      }
    }
    return true;
  }

  public onTransition(listener: StateListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public isMovementAllowed(): boolean {
    return this.currentState === 'EXPLORING';
  }
}
