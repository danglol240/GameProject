const BATTLE_STYLE = `
  .battle-overlay {
    position: absolute;
    inset: 0;
    z-index: 20;
    display: flex;
    flex-direction: column;
    font-family: 'Segoe UI', system-ui, sans-serif;
    background: linear-gradient(180deg, #1a2a4a 0%, #0d1b36 100%);
    color: #fff;
  }
  .battle-overlay.hidden { display: none; }

  /* ── SCENE ── */
  .battle-scene {
    flex: 1;
    position: relative;
    overflow: hidden;
    background: linear-gradient(180deg, #4a7fbf 0%, #87c0e8 45%, #6ab04c 45%, #4a8a38 100%);
    min-height: 0;
  }

  /* Ground platforms */
  .battle-scene::before {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 38%;
    background: linear-gradient(180deg, #6ab04c 0%, #4a8a38 100%);
  }

  /* Enemy info: top-left */
  .pokemon-enemy-info {
    position: absolute;
    top: 16px; left: 20px;
    background: rgba(0,0,0,0.6);
    border: 2px solid rgba(255,255,255,0.2);
    border-radius: 12px;
    padding: 10px 16px;
    min-width: 180px;
    backdrop-filter: blur(6px);
  }

  /* Player info: bottom-right */
  .pokemon-player-info {
    position: absolute;
    bottom: 20px; right: 20px;
    background: rgba(0,0,0,0.6);
    border: 2px solid rgba(255,255,255,0.2);
    border-radius: 12px;
    padding: 10px 16px;
    min-width: 180px;
    backdrop-filter: blur(6px);
    text-align: right;
  }

  .pokemon-name { font-size: 14px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
  .poke-level   { font-size: 11px; color: #aaa; margin-left: 6px; font-weight: 400; }

  .hp-bar-container {
    height: 8px;
    background: rgba(255,255,255,0.15);
    border-radius: 4px;
    overflow: hidden;
    margin: 6px 0 4px;
  }
  .hp-bar {
    height: 100%;
    border-radius: 4px;
    transition: width 0.4s ease, background-color 0.4s;
  }
  .hp-text { font-size: 11px; color: #bbb; }

  /* Sprites: big colored circles */
  .pokemon-enemy-sprite {
    position: absolute;
    top: 6%;
    right: 10%;
    width: 110px; height: 110px;
    border-radius: 50%;
    box-shadow: 0 8px 30px rgba(0,0,0,0.5), inset -6px -6px 20px rgba(0,0,0,0.3);
    animation: enemyFloat 2.2s ease-in-out infinite;
  }
  @keyframes enemyFloat {
    0%,100% { transform: translateY(0) rotate(-3deg); }
    50%      { transform: translateY(-12px) rotate(3deg); }
  }

  .pokemon-player-sprite {
    position: absolute;
    bottom: 12%;
    left: 10%;
    width: 90px; height: 90px;
    border-radius: 50%;
    box-shadow: 0 8px 30px rgba(0,0,0,0.5), inset 6px -6px 20px rgba(0,0,0,0.3);
    animation: playerBob 1.8s ease-in-out infinite;
  }
  @keyframes playerBob {
    0%,100% { transform: translateY(0); }
    50%      { transform: translateY(-8px); }
  }

  /* ── LOG BOX ── */
  .battle-log-box {
    padding: 14px 20px;
    background: rgba(5,10,25,0.85);
    border-top: 2px solid rgba(255,255,255,0.1);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    min-height: 56px;
    display: flex;
    align-items: center;
  }
  .battle-log-text {
    font-size: 15px;
    color: #e8eaf6;
    line-height: 1.4;
    letter-spacing: 0.02em;
  }

  /* ── MENUS ── */
  .battle-menu-main,
  .battle-menu-moves {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    padding: 14px 20px;
    background: rgba(5,10,25,0.9);
    justify-content: center;
  }
  .battle-menu-moves { gap: 8px; }
  .hidden { display: none !important; }

  .battle-btn {
    padding: 10px 22px;
    border: 2px solid transparent;
    border-radius: 10px;
    font-size: 13px; font-weight: 700;
    letter-spacing: 0.08em; text-transform: uppercase;
    cursor: pointer; transition: all 0.2s; min-width: 110px;
    background: rgba(255,255,255,0.08);
    color: #fff;
    border-color: rgba(255,255,255,0.15);
  }
  .battle-btn:hover { transform: scale(1.05); }

  .btn-fight  { border-color: #f44336; color: #f44336; }
  .btn-fight:hover  { background: rgba(244,67,54,0.2); }
  .btn-ball   { border-color: #2196f3; color: #2196f3; }
  .btn-ball:hover   { background: rgba(33,150,243,0.2); }
  .btn-run    { border-color: #ff9800; color: #ff9800; }
  .btn-run:hover    { background: rgba(255,152,0,0.2); }
  .btn-back   { border-color: #9e9e9e; color: #9e9e9e; }
  .btn-back:hover   { background: rgba(158,158,158,0.15); }
  .btn-move   { border-color: #4caf50; color: #4caf50; }
  .btn-move:hover   { background: rgba(76,175,80,0.2); }
`

function hpColor(pct) {
  if (pct > 0.5) return '#4caf50'
  if (pct > 0.25) return '#ff9800'
  return '#f44336'
}

function cssColor(hex) {
  return '#' + hex.toString(16).padStart(6, '0')
}

export class BattleUI {
  constructor(container) {
    this._container = container
    this._callback = null

    // Inject styles once
    if (!document.getElementById('battle-ui-style')) {
      const s = document.createElement('style')
      s.id = 'battle-ui-style'
      s.textContent = BATTLE_STYLE
      document.head.appendChild(s)
    }

    // Build overlay
    this._overlay = document.createElement('div')
    this._overlay.className = 'battle-overlay hidden'
    this._overlay.innerHTML = `
      <div class="battle-scene">
        <div class="pokemon-enemy-info">
          <div class="pokemon-name"><span class="b-enemy-name">WILD</span> <span class="poke-level b-enemy-lvl">Lv.1</span></div>
          <div class="hp-bar-container"><div class="hp-bar b-enemy-hp-bar" style="width:100%"></div></div>
          <div class="hp-text b-enemy-hp-text">0/0</div>
        </div>
        <div class="pokemon-enemy-sprite b-enemy-sprite"></div>

        <div class="pokemon-player-sprite b-player-sprite"></div>
        <div class="pokemon-player-info">
          <div class="pokemon-name"><span class="b-player-name">BULBASAUR</span> <span class="poke-level b-player-lvl">Lv.5</span></div>
          <div class="hp-bar-container"><div class="hp-bar b-player-hp-bar" style="width:100%"></div></div>
          <div class="hp-text b-player-hp-text">0/0</div>
        </div>
      </div>

      <div class="battle-log-box">
        <p class="battle-log-text b-log">A wild Pokemon appeared!</p>
      </div>

      <div class="battle-menu-main b-menu-main">
        <button class="battle-btn btn-fight b-btn-fight">&#9876; FIGHT</button>
        <button class="battle-btn btn-ball  b-btn-ball">&#9711; BALL</button>
        <button class="battle-btn btn-run   b-btn-run">&#128168; RUN</button>
      </div>

      <div class="battle-menu-moves b-menu-moves hidden"></div>
    `
    container.appendChild(this._overlay)
    this._bindButtons()
  }

  _bindButtons() {
    const ov = this._overlay
    ov.querySelector('.b-btn-fight').addEventListener('click', () => this._emit('fight'))
    ov.querySelector('.b-btn-ball').addEventListener('click',  () => this._emit('ball'))
    ov.querySelector('.b-btn-run').addEventListener('click',   () => this._emit('run'))
  }

  _emit(action, data) {
    if (this._callback) this._callback(action, data)
  }

  onAction(cb) { this._callback = cb }

  show(battle, playerPokemon) {
    this._battle = battle
    this._overlay.classList.remove('hidden')

    // Set sprites color
    const enemyColor = cssColor(battle.wild.color || 0x888888)
    const playerColor = cssColor(playerPokemon.color || 0x78C850)
    this._overlay.querySelector('.b-enemy-sprite').style.background =
      `radial-gradient(circle at 35% 30%, ${enemyColor}dd, ${enemyColor}66)`
    this._overlay.querySelector('.b-player-sprite').style.background =
      `radial-gradient(circle at 65% 30%, ${playerColor}dd, ${playerColor}66)`

    // Names & levels
    this._overlay.querySelector('.b-enemy-name').textContent  = battle.wild.name.toUpperCase()
    this._overlay.querySelector('.b-enemy-lvl').textContent   = `Lv.${battle.wild.level}`
    this._overlay.querySelector('.b-player-name').textContent = playerPokemon.name.toUpperCase()
    this._overlay.querySelector('.b-player-lvl').textContent  = `Lv.${playerPokemon.level || 5}`

    this._showMainMenu()
    this.update(battle)
  }

  hide() {
    this._overlay.classList.add('hidden')
  }

  update(battle) {
    // Enemy HP
    const ep = battle.wild.currentHp / battle.wild.maxHp
    const ebar = this._overlay.querySelector('.b-enemy-hp-bar')
    ebar.style.width = (ep * 100) + '%'
    ebar.style.background = hpColor(ep)
    this._overlay.querySelector('.b-enemy-hp-text').textContent =
      `${battle.wild.currentHp} / ${battle.wild.maxHp}`

    // Player HP
    const pp = battle.player.currentHp / battle.player.maxHp
    const pbar = this._overlay.querySelector('.b-player-hp-bar')
    pbar.style.width = (pp * 100) + '%'
    pbar.style.background = hpColor(pp)
    this._overlay.querySelector('.b-player-hp-text').textContent =
      `${battle.player.currentHp} / ${battle.player.maxHp}`

    // Log
    const msg = battle.log[battle.log.length - 1] || ''
    this._overlay.querySelector('.b-log').textContent = msg

    // Show appropriate menu
    if (battle.phase === 'fight-menu') {
      this._showMoveMenu(battle.player.moves)
    } else {
      this._showMainMenu()
    }
  }

  _showMainMenu() {
    this._overlay.querySelector('.b-menu-main').classList.remove('hidden')
    this._overlay.querySelector('.b-menu-moves').classList.add('hidden')
  }

  _showMoveMenu(moves) {
    this._overlay.querySelector('.b-menu-main').classList.add('hidden')
    const moveDiv = this._overlay.querySelector('.b-menu-moves')
    moveDiv.classList.remove('hidden')
    moveDiv.innerHTML = ''

    for (const moveName of (moves || [])) {
      const btn = document.createElement('button')
      btn.className = 'battle-btn btn-move b-btn-move'
      btn.textContent = moveName
      btn.addEventListener('click', () => this._emit('move', { moveName }))
      moveDiv.appendChild(btn)
    }

    const back = document.createElement('button')
    back.className = 'battle-btn btn-back'
    back.textContent = 'BACK'
    back.addEventListener('click', () => this._emit('back'))
    moveDiv.appendChild(back)
  }
}
