export function calcCatchSuccess(pokemon) {
  const rate = (3 * pokemon.maxHp - 2 * pokemon.currentHp) * pokemon.catchRate / (3 * pokemon.maxHp)
  return Math.random() * 255 < rate
}
