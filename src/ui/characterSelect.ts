import { CharacterId } from '../characters/characterFactory.js';

export interface CharacterSelectOptions {
  defaultCharacter?: CharacterId;
  onSelect: (selected: CharacterId) => void;
}

export class CharacterSelectUI {
  private container: HTMLElement;
  private options: CharacterSelectOptions;

  constructor(options: CharacterSelectOptions) {
    this.options = options;
    this.container = document.createElement('div');
    this.container.id = 'character-select-screen';
    this.container.className = 'screen-overlay';

    this.render();
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  public hide(): void {
    const isTest = typeof window !== 'undefined' && window.location.search.includes('test=1');
    if (isTest) {
      this.container.style.display = 'none';
      return;
    }

    this.container.classList.add('fade-out');
    setTimeout(() => {
      this.container.style.display = 'none';
    }, 600);
  }

  public show(): void {
    this.container.style.display = 'flex';
    this.container.classList.remove('fade-out');
  }

  private render(): void {
    const defaultChar = this.options.defaultCharacter || 'rutu';

    this.container.innerHTML = `
      <div class="character-select-modal">
        <h1 class="select-title">Welcome to Our Museum</h1>
        <p class="select-subtitle">Choose who you want to walk as. The other will walk with you!</p>

        <div class="characters-grid">
          <!-- Rutu Card -->
          <div class="character-card ${defaultChar === 'rutu' ? 'recommended' : ''}" data-character="rutu" id="card-rutu">
            <div class="char-preview-box">
              <div class="char-avatar-badge rutu-badge">👩</div>
            </div>
            <h2 class="char-name">Rutu</h2>
            <p class="char-role">Special Guest &amp; Owner</p>
            <span class="char-tag">Recommended</span>
            <button class="select-btn btn-rutu" id="btn-select-rutu">Walk as Rutu</button>
          </div>

          <!-- Jenil Card -->
          <div class="character-card ${defaultChar === 'jenil' ? 'recommended' : ''}" data-character="jenil" id="card-jenil">
            <div class="char-preview-box">
              <div class="char-avatar-badge jenil-badge">👨</div>
            </div>
            <h2 class="char-name">Jenil</h2>
            <p class="char-role">Museum Creator</p>
            <span class="char-tag">Creator</span>
            <button class="select-btn btn-jenil" id="btn-select-jenil">Walk as Jenil</button>
          </div>
        </div>

        <p class="select-hint">WASD / Arrow Keys to walk &bull; Drag mouse to look &bull; Press E to interact</p>
      </div>
    `;

    const btnRutu = this.container.querySelector('#btn-select-rutu') as HTMLButtonElement;
    const btnJenil = this.container.querySelector('#btn-select-jenil') as HTMLButtonElement;
    const cardRutu = this.container.querySelector('#card-rutu') as HTMLElement;
    const cardJenil = this.container.querySelector('#card-jenil') as HTMLElement;

    const select = (id: CharacterId) => {
      this.hide();
      this.options.onSelect(id);
    };

    btnRutu?.addEventListener('click', (e) => {
      e.stopPropagation();
      select('rutu');
    });

    btnJenil?.addEventListener('click', (e) => {
      e.stopPropagation();
      select('jenil');
    });

    cardRutu?.addEventListener('click', () => select('rutu'));
    cardJenil?.addEventListener('click', () => select('jenil'));
  }
}
