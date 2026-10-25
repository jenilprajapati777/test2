import { describe, it, expect } from 'vitest';
import { GameStateMachine } from '../../src/core/stateMachine.js';

describe('U-08: Game state machine transitions and invariants', () => {
  it('all legal state transitions succeed in both Exit 1 and Exit 2 sequences', () => {
    // 1. Boot flow
    const sm = new GameStateMachine(true);
    expect(sm.getState()).toBe('BOOT');

    sm.transitionTo('LOADING');
    expect(sm.getState()).toBe('LOADING');

    sm.transitionTo('CHARACTER_SELECT');
    expect(sm.getState()).toBe('CHARACTER_SELECT');

    sm.transitionTo('INTRO');
    expect(sm.getState()).toBe('INTRO');

    sm.transitionTo('EXPLORING');
    expect(sm.getState()).toBe('EXPLORING');
    expect(sm.isMovementAllowed()).toBe(true);

    // Media viewing
    sm.transitionTo('VIEWING_MEDIA');
    expect(sm.isMovementAllowed()).toBe(false);
    sm.transitionTo('EXPLORING');
    expect(sm.isMovementAllowed()).toBe(true);

    // Exit 1 Flow: Right Path
    sm.transitionTo('EXIT1_FADE');
    expect(sm.isMovementAllowed()).toBe(false);
    sm.transitionTo('RIGHT_PATH');
    sm.transitionTo('RESPAWN');
    sm.transitionTo('EXPLORING');
    expect(sm.getState()).toBe('EXPLORING');

    // Exit 2 Flow A: Wrong Path with 'Yes, give me another chance'
    sm.transitionTo('EXIT2_FADE');
    expect(sm.isMovementAllowed()).toBe(false);
    sm.transitionTo('HELL_FALL');
    sm.transitionTo('WRONG_PATH_PROMPT');
    sm.transitionTo('RESPAWN');
    sm.transitionTo('EXPLORING');
    expect(sm.getState()).toBe('EXPLORING');

    // Exit 2 Flow B: Wrong Path with 'No' -> Farewell -> 'Actually, let me try again'
    sm.transitionTo('EXIT2_FADE');
    sm.transitionTo('HELL_FALL');
    sm.transitionTo('WRONG_PATH_PROMPT');
    sm.transitionTo('FAREWELL');
    sm.transitionTo('RESPAWN');
    sm.transitionTo('EXPLORING');
    expect(sm.getState()).toBe('EXPLORING');
  });

  it('rejects illegal state transitions and throws in dev mode', () => {
    const sm = new GameStateMachine(true);
    // BOOT cannot jump to EXPLORING
    expect(() => sm.transitionTo('EXPLORING')).toThrow(/Illegal state transition/);

    // In prod mode (isDev = false), logs warning and returns false without throwing
    const prodSm = new GameStateMachine(false);
    const success = prodSm.transitionTo('EXPLORING');
    expect(success).toBe(false);
    expect(prodSm.getState()).toBe('BOOT');
  });
});
