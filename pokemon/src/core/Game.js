import * as THREE from 'three'
import { createRenderer, resizeRenderer } from '../graphics/Renderer.js'
import { createLights } from '../graphics/Lights.js'
import { ThirdPersonCamera } from '../graphics/Camera.js'
import { Input } from './Input.js'
import { buildWorld } from '../world/WorldBuilder.js'
import { Trainer } from '../entities/Trainer.js'
import { BattleSystem } from '../battle/BattleSystem.js'
import { BattleUI } from '../ui/BattleUI.js'
import { Pokedex } from '../ui/Pokedex.js'
import { HUD_HTML } from '../ui/HUD.js'
import { POKEMON_DATA, STARTER } from '../data/pokemon.js'
import { ENCOUNTER_COOLDOWN, ENCOUNTER_RATE } from '../constants.js'

export class PokemonGame extends HTMLElement {
  connectedCallback() {
    if (this._init) return
    this._init = true
    this.style.cssText = 'display:block;width:100vw;height:100vh;position:relative;overflow:hidden;'
    this._boot()
  }

  _boot() {
    // Setup renderer
    this.renderer = createRenderer(this)
    this.scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 500)
    this.camCtrl = new ThirdPersonCamera(camera)
    this.camera = camera
    createLights(this.scene)

    // World
    this.grassZones = buildWorld(this.scene)

    // Player
    this.trainer = new Trainer(this.scene)
    this.playerPokemon = { ...STARTER }

    // Input
    this.input = new Input()
    this.renderer.domElement.addEventListener('click', () => {
      if (!this.input.mouse.isPointerLocked) {
        this.input.requestPointerLock(this.renderer.domElement)
      }
    })

    // HUD
    const hudDiv = document.createElement('div')
    hudDiv.innerHTML = HUD_HTML
    this.appendChild(hudDiv)
    this._hud = {
      pokedexCount:   this.querySelector('#hud-dex-count'),
      pokemonHp:      this.querySelector('#hud-pokemon-hp'),
      pokemonHpBar:   this.querySelector('#hud-pokemon-hp-bar')
    }

    // Battle UI
    this.battleUI = new BattleUI(this)
    this.battleUI.onAction(this._handleBattleAction.bind(this))

    // Pokedex
    this.pokedex = new Pokedex(this)
    this.caughtPokemon = []

    // Game state
    this.state = 'overworld'  // 'overworld' | 'battle'
    this.encounterCooldown = 2

    // Resize observer
    const ro = new ResizeObserver(() => {
      const w = this.clientWidth  || 800
      const h = this.clientHeight || 450
      resizeRenderer(this.renderer, this.camera, w, h)
    })
    ro.observe(this)

    // Initial size
    const w = this.clientWidth  || window.innerWidth
    const h = this.clientHeight || window.innerHeight
    resizeRenderer(this.renderer, this.camera, w, h)

    // Game loop
    const clock = new THREE.Clock()
    const loop = () => {
      requestAnimationFrame(loop)
      const dt = Math.min(clock.getDelta(), 1 / 30)
      this._update(dt)
      this.renderer.render(this.scene, this.camera)
    }
    loop()
  }

  _update(dt) {
    if (this.state !== 'overworld') return

    const inp = this.input.consume()

    // Pokedex toggle (P key)
    if (inp.interact && !this._interactCooldown) {
      this._interactCooldown = true
      setTimeout(() => { this._interactCooldown = false }, 300)
      this.pokedex.toggle()
    }

    if (this.pokedex.isOpen) return

    this.trainer.update(inp, this.camCtrl.yaw, dt)
    this.camCtrl.rotate(inp.mouseDx || 0, inp.mouseDy || 0)
    this.camCtrl.update(this.trainer.position, dt)

    // Wild encounter check
    if (this.encounterCooldown > 0) {
      this.encounterCooldown -= dt
    } else {
      const pos = this.trainer.position
      const inGrass = this.grassZones.some(z => z.contains(pos.x, pos.z))
      const moving  = inp.forward || inp.backward || inp.left || inp.right
      if (inGrass && moving && Math.random() < ENCOUNTER_RATE * dt) {
        this._startEncounter()
      }
    }

    // Update HUD HP bar
    const pct = this.playerPokemon.currentHp / this.playerPokemon.maxHp
    if (this._hud.pokemonHpBar) {
      this._hud.pokemonHpBar.style.width = (pct * 100) + '%'
      this._hud.pokemonHpBar.style.background =
        pct > 0.5 ? '#4caf50' : pct > 0.25 ? '#ff9800' : '#f44336'
    }
    if (this._hud.pokemonHp) {
      this._hud.pokemonHp.textContent = `${this.playerPokemon.currentHp} / ${this.playerPokemon.maxHp}`
    }
  }

  _startEncounter() {
    this.encounterCooldown = ENCOUNTER_COOLDOWN
    // Pick a random wild pokemon (not starter)
    const pool = POKEMON_DATA.filter(p => p.id !== 1)
    const wildData = pool[Math.floor(Math.random() * pool.length)]
    const level = 3 + Math.floor(Math.random() * 12)
    this.currentBattle = new BattleSystem(this.playerPokemon, wildData, level)
    this.state = 'battle'
    this.battleUI.show(this.currentBattle, this.playerPokemon)
  }

  _handleBattleAction(action, data) {
    if (!this.currentBattle) return
    const battle = this.currentBattle

    if (action === 'fight') {
      battle.openFightMenu()
      this.battleUI.update(battle)

    } else if (action === 'back') {
      battle.backToChoose()
      this.battleUI.update(battle)

    } else if (action === 'move') {
      const result = battle.playerAttack(data.moveName)
      this.battleUI.update(battle)
      if (result && result.next) {
        setTimeout(() => {
          result.next()
          this.battleUI.update(battle)
          if (battle.phase === 'end') this._endBattle(battle.result)
        }, 1200)
      } else if (battle.phase === 'end') {
        setTimeout(() => this._endBattle(battle.result), 1500)
      }

    } else if (action === 'ball') {
      const result = battle.throwBall()
      this.battleUI.update(battle)
      if (result && result.next) {
        setTimeout(() => {
          result.next()
          this.battleUI.update(battle)
          if (battle.phase === 'end') this._endBattle(battle.result)
        }, 1500)
      } else if (battle.phase === 'end') {
        setTimeout(() => this._endBattle(battle.result), 1500)
      }

    } else if (action === 'run') {
      battle.run()
      this.battleUI.update(battle)
      setTimeout(() => this._endBattle('fled'), 1000)
    }
  }

  _endBattle(result) {
    if (result === 'caught') {
      this.caughtPokemon.push({ ...this.currentBattle.wild })
      this.pokedex.add(this.currentBattle.wild)
      if (this._hud.pokedexCount) {
        this._hud.pokedexCount.textContent = this.caughtPokemon.length
      }
    }

    if (result === 'defeat') {
      // Restore some HP and continue
      this.playerPokemon.currentHp = Math.floor(this.playerPokemon.maxHp * 0.5)
    }

    // Sync player pokemon hp from battle state
    if (this.currentBattle) {
      this.playerPokemon.currentHp = this.currentBattle.player.currentHp
    }

    this.currentBattle = null
    this.battleUI.hide()
    this.state = 'overworld'
    this.encounterCooldown = ENCOUNTER_COOLDOWN
  }
}
