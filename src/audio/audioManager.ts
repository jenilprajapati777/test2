export class AudioManager {
  private audioCtx: AudioContext | null = null;
  private bgmAudio: HTMLAudioElement | null = null;
  private ambientOscillators: OscillatorNode[] = [];
  private ambientGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private isMuted = false;
  private isStarted = false;
  private footstepTimer = 0;

  constructor() {
    // Lazy init on first user click
    if (typeof window !== 'undefined') {
      const startAudio = () => {
        if (!this.isStarted) {
          this.init();
          window.removeEventListener('click', startAudio);
          window.removeEventListener('keydown', startAudio);
          window.removeEventListener('touchstart', startAudio);
        }
      };
      window.addEventListener('click', startAudio);
      window.addEventListener('keydown', startAudio);
      window.addEventListener('touchstart', startAudio);
    }
  }

  private init(): void {
    if (this.isStarted) return;
    this.isStarted = true;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.4, this.audioCtx.currentTime);
        this.masterGain.connect(this.audioCtx.destination);
      }
    } catch (e) {
      console.info('Web Audio not supported:', e);
    }

    // Try loading bgm.mp3
    this.tryLoadBgm();
  }

  private tryLoadBgm(): void {
    if (typeof document === 'undefined') return;

    const bgm = new Audio();
    bgm.src = './assets/audio/bgm.mp3';
    bgm.loop = true;
    bgm.volume = this.isMuted ? 0 : 0.35;

    bgm.play().then(() => {
      this.bgmAudio = bgm;
      console.info('Playing user background music: assets/audio/bgm.mp3');
    }).catch(() => {
      // Missing bgm.mp3 -> start soft procedural ambient pad
      this.startProceduralAmbientPad();
    });
  }

  private startProceduralAmbientPad(): void {
    if (!this.audioCtx || !this.masterGain) return;

    try {
      this.ambientGain = this.audioCtx.createGain();
      this.ambientGain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, this.audioCtx.currentTime);

      // Warm ambient minor/major 7th chord (D3, F#3, A3, C#4)
      const freqs = [146.83, 185.0, 220.0, 277.18];
      for (const f of freqs) {
        const osc = this.audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, this.audioCtx.currentTime);
        osc.connect(filter);
        osc.start();
        this.ambientOscillators.push(osc);
      }

      filter.connect(this.ambientGain);
      this.ambientGain.connect(this.masterGain);
    } catch {
      // Ignored
    }
  }

  public playFootstep(): void {
    if (this.isMuted || !this.audioCtx || !this.masterGain) return;

    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // Ignored
    }
  }

  public updateFootsteps(dt: number, speed: number, isRunning: boolean): void {
    if (speed < 0.2) {
      this.footstepTimer = 0;
      return;
    }

    const interval = isRunning ? 0.26 : 0.38;
    this.footstepTimer += dt;
    if (this.footstepTimer >= interval) {
      this.footstepTimer -= interval;
      this.playFootstep();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;

    if (this.bgmAudio) {
      this.bgmAudio.volume = this.isMuted ? 0 : 0.35;
    }

    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.4, this.audioCtx.currentTime);
    }

    return this.isMuted;
  }
}
