export class LoadingScreen {
  private container: HTMLElement;
  private progressBar: HTMLElement;
  private progressText: HTMLElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'loading-screen';
    this.container.className = 'screen-overlay';

    this.container.innerHTML = `
      <div class="loading-modal">
        <div class="museum-icon">🏛️</div>
        <h1 class="loading-title">Jenil &amp; Rutu</h1>
        <p class="loading-subtitle">Preparing our 3D museum...</p>
        <div class="progress-track">
          <div class="progress-fill" id="loading-progress-bar"></div>
        </div>
        <p class="progress-status" id="loading-progress-text">Loading galleries (0%)...</p>
      </div>
    `;

    this.progressBar = this.container.querySelector('#loading-progress-bar') as HTMLElement;
    this.progressText = this.container.querySelector('#loading-progress-text') as HTMLElement;
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  public setProgress(percent: number, message?: string): void {
    const clamped = Math.min(100, Math.max(0, percent));
    this.progressBar.style.width = `${clamped}%`;
    this.progressText.textContent = message || `Loading galleries (${Math.round(clamped)}%)...`;
  }

  public hide(onComplete?: () => void): void {
    const isTest = typeof window !== 'undefined' && window.location.search.includes('test=1');
    if (isTest) {
      this.container.style.display = 'none';
      if (onComplete) onComplete();
      return;
    }

    this.setProgress(100, 'Welcome to the museum!');
    setTimeout(() => {
      this.container.classList.add('fade-out');
      setTimeout(() => {
        this.container.style.display = 'none';
        if (onComplete) onComplete();
      }, 500);
    }, 300);
  }
}
