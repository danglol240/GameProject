import { PokemonGame } from './core/Game.js'
if (!customElements.get('pokemon-game')) {
  customElements.define('pokemon-game', PokemonGame)
}
document.getElementById('app').innerHTML = '<pokemon-game></pokemon-game>'
