// BA-EJ Pull Engine v1.0 — Connects user input → meta.json → dynamic UI
class BA_EJ_Engine {
  constructor() {
    this.meta = null;
    this.history = ['welcome'];
    this.pullCount = 0;
    this.init();
  }

  async init() {
    // Load semantic database
    const res = await fetch('meta.json');
    this.meta = await res.json();
    
    // Setup UI
    document.getElementById('pull-btn').onclick = () => this.pullNext();
    document.getElementById('back-btn').onclick = () => this.goBack();
    
    // Load welcome patch
    this.loadPatch('welcome');
  }

  async pullNext() {
    // Simulate user input → match to seed word
    const userInput = "I want to work from a park with community";
    const matchedWord = this.findBestMatch(userInput);
    
    if (matchedWord) {
      this.loadPatchFromMeta(matchedWord.id);
    } else {
      // Fallback to next in sequence
      const next = this.getNextPatch(this.history[this.history.length - 1]);
      this.loadPatch(next);
    }
  }

  findBestMatch(input) {
    // Simple keyword matching (replace with vector search later)
    const lower = input.toLowerCase();
    for (const word of this.meta.words) {
      if (lower.includes('park') || lower.includes('community')) {
        if (word.id === 'komute') return word;
      }
      if (lower.includes('empty') || lower.includes('silence')) {
        if (word.id === 'void') return word;
      }
    }
    return null;
  }

  async loadPatchFromMeta(wordId) {
    const word = this.meta.words.find(w => w.id === wordId);
    if (!word) return this.showError('Patch not found');
    
    try {
      const res = await fetch(word.patch);
      const html = await res.text();
      this.render(html, word.gym_level);
      this.history.push(wordId);
      this.pullCount++;
    } catch (e) {
      this.showError(e.message);
    }
  }

  async loadPatch(patchName) {
    try {
      const res = await fetch(`patches/${patchName}.html`);
      const html = await res.text();
      this.render(html, 1);
      this.history.push(patchName);
      this.pullCount++;
    } catch (e) {
      this.showError(e.message);
    }
  }

  render(html, gymLevel) {
    document.getElementById('app').innerHTML = html;
    
    // Apply GyM mode styling
    document.body.className = `gym-${gymLevel}`;
    this.updateStyles(gymLevel);
    
    // Attach dynamic button handlers
    document.querySelectorAll('.dynamic-btn').forEach(btn => {
      btn.onclick = () => {
        const action = btn.dataset.action;
        if (action.startsWith('pull:')) {
          const target = action.split(':')[1];
          this.loadPatchFromMeta(target);
        }
      };
    });
  }

  updateStyles(gymLevel) {
    const root = document.documentElement;
    if (gymLevel === 1) {
      root.style.fontSize = '18px';
    } else if (gymLevel === 2) {
      root.style.fontSize = '16px';
    } else {
      root.style.fontSize = '14px';
    }
  }

  goBack() {
    if (this.history.length > 1) {
      this.history.pop();
      const prev = this.history[this.history.length - 1];
      if (prev === 'welcome') {
        this.loadPatch('welcome');
      } else {
        this.loadPatchFromMeta(prev);
      }
    }
  }

  getNextPatch(current) {
    const order = ['welcome', 'komute', 'void'];
    const idx = order.indexOf(current);
    return idx !== -1 && idx < order.length - 1 ? order[idx + 1] : 'welcome';
  }

  showError(msg) {
    document.getElementById('app').innerHTML = `<div class="error">⚠️ ${msg}</div>`;
  }
}

// Start the engine
document.addEventListener('DOMContentLoaded', () => {
  window.baEJ = new BA_EJ_Engine();
});
