import { MOVES } from '../data/moves.js'

export class BattleSystem {
  constructor(playerPokemon, wildData, wildLevel) {
    this.player = { ...playerPokemon }
    this.wild = {
      ...wildData,
      level: wildLevel,
      currentHp: wildData.maxHp,
      maxHp: wildData.maxHp
    }
    this.log = []
    this.phase = 'choose'  // 'choose' | 'fight-menu' | 'animating' | 'end'
    this.result = null     // 'caught' | 'fled' | 'victory' | 'defeat'
  }

  _calcDamage(attacker, defender, moveName) {
    const move = MOVES[moveName]
    if (!move || move.power === 0) return 0
    const dmg = Math.floor(
      ((2 * attacker.level / 5 + 2) * move.power * attacker.atk / defender.def / 50 + 2)
      * (0.85 + Math.random() * 0.15)
    )
    return Math.max(1, dmg)
  }

  addLog(msg) { this.log = [msg] }

  playerAttack(moveName) {
    if (this.phase !== 'fight-menu') return null
    this.phase = 'animating'
    const dmg = this._calcDamage(this.player, this.wild, moveName)
    this.wild.currentHp = Math.max(0, this.wild.currentHp - dmg)
    this.addLog(`${this.player.name} used ${moveName}! (${dmg} dmg)`)

    if (this.wild.currentHp <= 0) {
      this.result = 'victory'
      this.phase = 'end'
      this.addLog(`Wild ${this.wild.name} fainted!`)
      return { action: 'victory' }
    }

    // Wild counter-attacks after delay
    return { action: 'player-hit', dmg, next: () => this._wildTurn() }
  }

  _wildTurn() {
    const moveName = this.wild.moves[Math.floor(Math.random() * this.wild.moves.length)]
    const dmg = this._calcDamage(this.wild, this.player, moveName)
    this.player.currentHp = Math.max(0, this.player.currentHp - dmg)
    this.addLog(`Wild ${this.wild.name} used ${moveName}! (${dmg} dmg)`)

    if (this.player.currentHp <= 0) {
      this.result = 'defeat'
      this.phase = 'end'
      this.addLog(`${this.player.name} fainted! Game over...`)
      return { action: 'defeat' }
    }
    this.phase = 'choose'
    return { action: 'wild-hit', dmg }
  }

  throwBall() {
    if (this.phase !== 'choose') return null
    this.phase = 'animating'

    // Classic catch formula (simplified)
    const rate = (3 * this.wild.maxHp - 2 * this.wild.currentHp) * this.wild.catchRate / (3 * this.wild.maxHp)
    const caught = Math.random() * 255 < rate

    if (caught) {
      this.result = 'caught'
      this.phase = 'end'
      this.addLog(`Got ${this.wild.name}! Added to Pokedex!`)
      return { action: 'caught' }
    } else {
      this.addLog(`${this.wild.name} broke free!`)
      const next = () => {
        const r = this._wildTurn()
        return r
      }
      return { action: 'ball-fail', next }
    }
  }

  run() {
    this.result = 'fled'
    this.phase = 'end'
    this.addLog('Got away safely!')
    return { action: 'fled' }
  }

  openFightMenu()  { if (this.phase === 'choose')     this.phase = 'fight-menu' }
  backToChoose()   { if (this.phase === 'fight-menu') this.phase = 'choose' }
}
