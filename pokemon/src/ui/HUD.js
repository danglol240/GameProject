export const HUD_HTML = `
<style>
  .poke-hud {
    position: absolute;
    inset: 0;
    pointer-events: none;
    font-family: 'Segoe UI', system-ui, sans-serif;
    z-index: 5;
  }

  /* Top-left: Pokedex counter */
  .hud-dex {
    position: absolute;
    top: 14px;
    left: 14px;
    background: rgba(0,0,0,0.55);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 10px;
    padding: 8px 14px;
    color: #fff;
    font-size: 13px;
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .hud-dex-icon {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: linear-gradient(135deg, #e53935 50%, #fff 50%);
    border: 2px solid #222;
    flex-shrink: 0;
  }
  .hud-dex-label { color: #aaa; font-size: 11px; }
  .hud-dex-count { font-weight: 700; font-size: 16px; color: #ffd166; }

  /* Top-right: Player Pokemon HP */
  .hud-pokemon-status {
    position: absolute;
    top: 14px;
    right: 14px;
    background: rgba(0,0,0,0.55);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 10px;
    padding: 8px 14px;
    min-width: 160px;
    backdrop-filter: blur(8px);
  }
  .hud-pokemon-name {
    font-size: 12px;
    font-weight: 700;
    color: #fff;
    letter-spacing: 0.05em;
    margin-bottom: 5px;
    text-transform: uppercase;
  }
  .hud-hp-track {
    height: 6px;
    background: rgba(255,255,255,0.15);
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 4px;
  }
  #hud-pokemon-hp-bar {
    height: 100%;
    width: 100%;
    background: #4caf50;
    border-radius: 3px;
    transition: width 0.3s, background 0.3s;
  }
  #hud-pokemon-hp {
    font-size: 11px;
    color: #aaa;
    text-align: right;
  }

  /* Bottom: Key hints */
  .hud-hints {
    position: absolute;
    bottom: 14px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
    justify-content: center;
    background: rgba(0,0,0,0.45);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 8px 18px;
    backdrop-filter: blur(6px);
  }
  .hud-hint {
    font-size: 11px;
    color: #aaa;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .hud-key {
    background: rgba(255,255,255,0.12);
    border: 1px solid rgba(255,255,255,0.22);
    border-radius: 4px;
    padding: 1px 6px;
    font-size: 10px;
    font-weight: 700;
    color: #fff;
    font-family: monospace;
  }
</style>

<div class="poke-hud">
  <!-- Pokedex counter top-left -->
  <div class="hud-dex">
    <div class="hud-dex-icon"></div>
    <div>
      <div class="hud-dex-label">Pokedex</div>
      <div style="display:flex;align-items:baseline;gap:4px;">
        <span id="hud-dex-count" class="hud-dex-count">0</span>
        <span style="color:#aaa;font-size:12px;">/ 8</span>
      </div>
    </div>
  </div>

  <!-- Pokemon HP status top-right -->
  <div class="hud-pokemon-status">
    <div class="hud-pokemon-name">Bulbasaur <span style="color:#78C850;font-size:10px;">Grass</span></div>
    <div class="hud-hp-track">
      <div id="hud-pokemon-hp-bar"></div>
    </div>
    <div id="hud-pokemon-hp">45 / 45</div>
  </div>

  <!-- Key hints bottom center -->
  <div class="hud-hints">
    <div class="hud-hint"><span class="hud-key">WASD</span> Move</div>
    <div class="hud-hint"><span class="hud-key">Shift</span> Run</div>
    <div class="hud-hint"><span class="hud-key">P</span> Pokedex</div>
    <div class="hud-hint"><span class="hud-key">Click</span> Lock camera</div>
    <div class="hud-hint" style="color:#4caf50;">Walk in tall grass to encounter Pokemon!</div>
  </div>
</div>
`
