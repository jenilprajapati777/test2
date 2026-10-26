export const SETTINGS = {
  player: {
    radius: 0.35,
    walkSpeed: 3.0,
    runSpeed: 5.5,
    acceleration: 20.0,
    deceleration: 30.0,
    turnSpeed: 12.0,
    jenilHeight: 1.40,
    rutuHeight: 1.30
  },
  companion: {
    followDistance: 1.8,
    sideOffset: 0.6,
    speedMultiplier: 1.05,
    idleDistance: 1.2,
    teleportDistance: 12.0
  },
  camera: {
    targetHeight: 1.4,
    defaultDistance: 4.2,
    minDistance: 0.8,
    maxDistance: 5.0,
    defaultPitchDeg: 20,
    minPitchDeg: -10,
    maxPitchDeg: 60,
    orbitSensitivity: 0.0045,
    dampingFactor: 8.0,
    wallBuffer: 0.3,
    // Keep the view clean when the camera is pushed close by a wall.
    fadeDistance: 1.9,
    playerFadeOpacity: 0.06,
    fovDesktop: 60,
    fovMobile: 70,
    near: 0.05,
    far: 120
  },
  timings: {
    exitFadeOut: 0.8,
    exit1PopupDelay: 1.2,
    exit2HellDelay: 1.0,
    hellResultTextTime: 3.0,
    hellRetryPanelTime: 6.0,
    respawnFadeOut: 0.6,
    respawnFadeIn: 0.8
  }
} as const;
