import * as THREE from 'three';

export interface CharacterLimbs {
  head: THREE.Object3D;
  chest: THREE.Object3D;
  leftArm: THREE.Object3D;
  rightArm: THREE.Object3D;
  leftLeg: THREE.Object3D;
  rightLeg: THREE.Object3D;
  leftForearm?: THREE.Object3D;
  rightForearm?: THREE.Object3D;
  leftLowerLeg?: THREE.Object3D;
  rightLowerLeg?: THREE.Object3D;
}

export class CharacterAnimator {
  private limbs: CharacterLimbs;
  private walkCycle = 0;
  private idleTime = 0;

  constructor(limbs: CharacterLimbs) {
    this.limbs = limbs;
  }

  public update(dt: number, speed: number, isRunning: boolean): void {
    if (speed < 0.1) {
      // Idle animation: breathing 0.5 Hz
      this.idleTime += dt;
      const breath = Math.sin(this.idleTime * Math.PI) * 0.02;
      this.limbs.chest.position.y += (breath - this.limbs.chest.position.y) * 0.1;
      this.limbs.chest.rotation.x = Math.sin(this.idleTime * Math.PI) * 0.02;

      // Reset limbs to resting position
      const damp = Math.min(1.0, dt * 10);
      this.limbs.leftLeg.rotation.x += (0 - this.limbs.leftLeg.rotation.x) * damp;
      this.limbs.rightLeg.rotation.x += (0 - this.limbs.rightLeg.rotation.x) * damp;
      this.limbs.leftArm.rotation.x += (0 - this.limbs.leftArm.rotation.x) * damp;
      this.limbs.rightArm.rotation.x += (0 - this.limbs.rightArm.rotation.x) * damp;
      this.limbs.leftArm.rotation.z += (0.08 - this.limbs.leftArm.rotation.z) * damp;
      this.limbs.rightArm.rotation.z += (-0.08 - this.limbs.rightArm.rotation.z) * damp;
      if (this.limbs.leftForearm) this.limbs.leftForearm.rotation.x += (0.1 - this.limbs.leftForearm.rotation.x) * damp;
      if (this.limbs.rightForearm) this.limbs.rightForearm.rotation.x += (0.1 - this.limbs.rightForearm.rotation.x) * damp;
      if (this.limbs.leftLowerLeg) this.limbs.leftLowerLeg.rotation.x += (0 - this.limbs.leftLowerLeg.rotation.x) * damp;
      if (this.limbs.rightLowerLeg) this.limbs.rightLowerLeg.rotation.x += (0 - this.limbs.rightLowerLeg.rotation.x) * damp;
      this.walkCycle = 0;
    } else {
      // Moving animation: frequency proportional to speed
      const freq = isRunning ? 12 : 8;
      this.walkCycle += dt * freq;

      const legAmplitude = isRunning ? (52 * Math.PI) / 180 : (36 * Math.PI) / 180;
      const armAmplitude = isRunning ? (42 * Math.PI) / 180 : (26 * Math.PI) / 180;

      const cycleSin = Math.sin(this.walkCycle);
      const cycleCos = Math.cos(this.walkCycle);

      this.limbs.leftLeg.rotation.x = cycleSin * legAmplitude;
      this.limbs.rightLeg.rotation.x = -cycleSin * legAmplitude;

      // Knee bending during leg backswing
      if (this.limbs.leftLowerLeg) {
        this.limbs.leftLowerLeg.rotation.x = Math.max(0, -cycleSin * legAmplitude * 0.9);
      }
      if (this.limbs.rightLowerLeg) {
        this.limbs.rightLowerLeg.rotation.x = Math.max(0, cycleSin * legAmplitude * 0.9);
      }

      // Arms swing opposite to legs
      this.limbs.leftArm.rotation.x = -cycleSin * armAmplitude;
      this.limbs.rightArm.rotation.x = cycleSin * armAmplitude;

      // Elbow flexion on forward swing
      if (this.limbs.leftForearm) {
        this.limbs.leftForearm.rotation.x = Math.max(0.1, -cycleSin * armAmplitude * 0.85);
      }
      if (this.limbs.rightForearm) {
        this.limbs.rightForearm.rotation.x = Math.max(0.1, cycleSin * armAmplitude * 0.85);
      }

      // Slight body bounce & tilt
      this.limbs.chest.position.y = Math.abs(cycleCos) * (isRunning ? 0.06 : 0.035);
      this.limbs.chest.rotation.y = -cycleSin * 0.08;
      this.limbs.chest.rotation.x = isRunning ? 0.12 : 0.04; // subtle athletic lean forward
    }
  }

  public setFallingPose(time: number): void {
    // Flailing limbs during hell fall
    this.limbs.leftArm.rotation.x = Math.sin(time * 12) * 1.2;
    this.limbs.rightArm.rotation.x = Math.cos(time * 12) * 1.2;
    this.limbs.leftArm.rotation.z = 0.8 + Math.sin(time * 10) * 0.4;
    this.limbs.rightArm.rotation.z = -0.8 - Math.cos(time * 10) * 0.4;

    if (this.limbs.leftForearm) this.limbs.leftForearm.rotation.x = 0.6 + Math.sin(time * 14) * 0.5;
    if (this.limbs.rightForearm) this.limbs.rightForearm.rotation.x = 0.6 + Math.cos(time * 14) * 0.5;

    this.limbs.leftLeg.rotation.x = Math.cos(time * 8) * 0.8;
    this.limbs.rightLeg.rotation.x = Math.sin(time * 8) * 0.8;
    this.limbs.leftLeg.rotation.z = 0.3;
    this.limbs.rightLeg.rotation.z = -0.3;

    if (this.limbs.leftLowerLeg) this.limbs.leftLowerLeg.rotation.x = 0.4 + Math.abs(Math.sin(time * 9)) * 0.6;
    if (this.limbs.rightLowerLeg) this.limbs.rightLowerLeg.rotation.x = 0.4 + Math.abs(Math.cos(time * 9)) * 0.6;
  }
}
