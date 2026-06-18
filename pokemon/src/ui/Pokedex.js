const POKEDEX_STYLE = `
  .pokedex-overlay {
    position: absolute;
    inset: 0;
    z-index: 25;
    background: rgba(5, 10, 25, 0.92);
    backdrop-filter: blur(10px);
    display: flex;
    flex-direction: column;
    font-family: 'Segoe UI', system-ui, sans-serif;
    color: #fff;
    overflow-y: auto;
  }
  .pokedex-overlay.hidden { display: none !important; }

  .pokedex-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 24px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    position: sticky; top: 0;
    background: rgba(5, 10, 25, 0.95);
    backdrop-filter: blur(8px);
  }
  .pokedex-title {
    font-size: 1.3rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    background: linear-gradient(90deg, #ff4444, #ff9800);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .pokedex-title-icon {
    width: 28px; height: 28px;
    border-radius: 50%;
    background: linear-gradient(135deg, #e53935 50%, #fff 50%);
    border: 2px solid #222;
    flex-shrink: 0;
    -webkit-text-fill-color: initial;
    display: inline-block;
  }
  .pokedex-subtitle {
    font-size: 12px;
    color: #aaa;
    margin-left: 4px;
    -webkit-text-fill-color: #aaa;
  }
  .pokedex-close {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    color: #fff;
    border-radius: 8px;
    padding: 7px 14px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.06em;
    cursor: pointer;
    transition: background 0.2s;
  }
  .pokedex-close:hover { background: rgba(255,255,255,0.15); }

  .pokedex-body {
    padding: 24px;
  }
  .pokedex-empty {
    text-align: center;
    color: #555;
    margin-top: 60px;
    font-size: 15px;
    line-height: 2;
  }
  .pokedex-empty .icon {
    font-size: 48px;
    display: block;
    margin-bottom: 8px;
    filter: grayscale(1);
  }
  .pokedex-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 16px;
  }
  .pokedex-card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 14px;
    padding: 18px 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .pokedex-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 30px rgba(0,0,0,0.4);
  }
  .pokedex-sprite {
    width: 64px; height: 64px;
    border-radius: 50%;
    box-shadow: 0 4px 16px rgba(0,0,0,0.4);
  }
  .pokedex-num  { font-size: 10px; color: #666; letter-spacing: 0.08em; }
  .pokedex-name { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
  .pokedex-type {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    padding: 2px 8px;
    border-radius: 99px;
    text-transform: uppercase;
  }
  .pokedex-hp { font-size: 11px; color: #888; }
`

const TYPE_COLORS = {
  Grass:    { bg: 'rgba(120,200,80,0.15)',  text: '#78C850', border: 'rgba(120,200,80,0.3)'  },
  Fire:     { bg: 'rgba(255,107,53,0.15)',  text: '#FF6B35', border: 'rgba(255,107,53,0.3)'  },
  Water:    { bg: 'rgba(104,144,240,0.15)', text: '#6890F0', border: 'rgba(104,144,240,0.3)' },
  Electric: { bg: 'rgba(255,215,0,0.15)',   text: '#FFD700', border: 'rgba(255,215,0,0.3)'   },
  Ghost:    { bg: 'rgba(112,88,152,0.15)',  text: '#a080d0', border: 'rgba(112,88,152,0.3)'  },
  Normal:   { bg: 'rgba(168,168,120,0.15)', text: '#c8c8a0', border: 'rgba(168,168,120,0.3)' },
  Psychic:  { bg: 'rgba(216,192,232,0.15)', text: '#c8a8e0', border: 'rgba(216,192,232,0.3)' },
  Dragon:   { bg: 'rgba(100,100,200,0.15)', text: '#8888e0', border: 'rgba(100,100,200,0.3)' },
  Dark:     { bg: 'rgba(80,60,60,0.15)',    text: '#a08888', border: 'rgba(80,60,60,0.3)'    },
  Fighting: { bg: 'rgba(200,100,60,0.15)',  text: '#e08848', border: 'rgba(200,100,60,0.3)'  }
}

function cssColor(hex) {
  return '#' + (hex || 0x888888).toString(16).padStart(6, '0')
}

export class Pokedex {
  constructor(container) {
    this._container = container
    this._caught = []
    this._open = false

    if (!document.getElementById('pokedex-style')) {
      const s = document.createElement('style')
      s.id = 'pokedex-style'
      s.textContent = POKEDEX_STYLE
      document.head.appendChild(s)
    }

    this._overlay = document.createElement('div')
    this._overlay.className = 'pokedex-overlay hidden'
    this._overlay.innerHTML = `
      <div class="pokedex-header">
        <div class="pokedex-title">
          <div class="pokedex-title-icon"></div>
          Pokedex
          <span class="pokedex-subtitle pokedex-count">0 / 8 caught</span>
        </div>
        <button class="pokedex-close">CLOSE [P]</button>
      </div>
      <div class="pokedex-body">
        <div class="pokedex-empty">
          <span class="icon">&#128046;</span>
          No Pokemon caught yet!<br/>
          Walk into tall grass to find wild Pokemon.
        </div>
        <div class="pokedex-grid" style="display:none"></div>
      </div>
    `
    container.appendChild(this._overlay)

    this._overlay.querySelector('.pokedex-close').addEventListener('click', () => this.toggle())
  }

  get isOpen() { return this._open }

  add(pokemon) {
    // Avoid duplicates by id
    if (this._caught.some(p => p.id === pokemon.id)) return
    this._caught.push(pokemon)
    this._render()
  }

  toggle() {
    this._open = !this._open
    if (this._open) {
      this._overlay.classList.remove('hidden')
      this._render()
    } else {
      this._overlay.classList.add('hidden')
    }
  }

  _render() {
    const count = this._caught.length
    this._overlay.querySelector('.pokedex-count').textContent = `${count} / 8 caught`

    const empty = this._overlay.querySelector('.pokedex-empty')
    const grid  = this._overlay.querySelector('.pokedex-grid')

    if (count === 0) {
      empty.style.display = ''
      grid.style.display  = 'none'
      return
    }

    empty.style.display = 'none'
    grid.style.display  = ''
    grid.innerHTML = ''

    for (const p of this._caught) {
      const tc = TYPE_COLORS[p.type] || TYPE_COLORS.Normal
      const color = cssColor(p.color)
      const card = document.createElement('div')
      card.className = 'pokedex-card'
      card.style.borderColor = tc.border

      card.innerHTML = `
        <div class="pokedex-sprite" style="background:radial-gradient(circle at 35% 30%,${color}cc,${color}55);border:2px solid ${tc.border};"></div>
        <div class="pokedex-num">#${String(p.id).padStart(3, '0')}</div>
        <div class="pokedex-name">${p.name}</div>
        <div class="pokedex-type" style="background:${tc.bg};color:${tc.text};border:1px solid ${tc.border};">${p.type}</div>
        <div class="pokedex-hp">HP: ${p.maxHp}</div>
      `
      grid.appendChild(card)
    }
  }
}
