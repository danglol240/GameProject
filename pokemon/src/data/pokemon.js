export const POKEMON_DATA = [
  {
    id: 1,
    name: 'Bulbasaur',
    type: 'Grass',
    color: 0x78C850,
    maxHp: 45,
    atk: 49,
    def: 49,
    spd: 45,
    catchRate: 45,
    xpYield: 64,
    moves: ['Vine Whip', 'Tackle', 'Growl', 'Leech Seed']
  },
  {
    id: 4,
    name: 'Charmander',
    type: 'Fire',
    color: 0xFF6B35,
    maxHp: 39,
    atk: 52,
    def: 43,
    spd: 65,
    catchRate: 45,
    xpYield: 62,
    moves: ['Scratch', 'Ember', 'Growl', 'Tackle']
  },
  {
    id: 7,
    name: 'Squirtle',
    type: 'Water',
    color: 0x6890F0,
    maxHp: 44,
    atk: 48,
    def: 65,
    spd: 43,
    catchRate: 45,
    xpYield: 63,
    moves: ['Tackle', 'Water Gun', 'Bite', 'Bubble']
  },
  {
    id: 25,
    name: 'Pikachu',
    type: 'Electric',
    color: 0xFFD700,
    maxHp: 35,
    atk: 55,
    def: 30,
    spd: 90,
    catchRate: 190,
    xpYield: 112,
    moves: ['Quick Attack', 'Thunderbolt', 'Tackle', 'Growl']
  },
  {
    id: 94,
    name: 'Gengar',
    type: 'Ghost',
    color: 0x705898,
    maxHp: 60,
    atk: 65,
    def: 60,
    spd: 110,
    catchRate: 45,
    xpYield: 190,
    moves: ['Shadow Ball', 'Lick', 'Tackle', 'Growl']
  },
  {
    id: 143,
    name: 'Snorlax',
    type: 'Normal',
    color: 0xA0A080,
    maxHp: 160,
    atk: 110,
    def: 65,
    spd: 30,
    catchRate: 25,
    xpYield: 189,
    moves: ['Body Slam', 'Tackle', 'Hyper Voice', 'Growl']
  },
  {
    id: 6,
    name: 'Charizard',
    type: 'Fire',
    color: 0xFF4500,
    maxHp: 78,
    atk: 84,
    def: 78,
    spd: 100,
    catchRate: 45,
    xpYield: 240,
    moves: ['Flamethrower', 'Dragon Claw', 'Scratch', 'Ember']
  },
  {
    id: 150,
    name: 'Mewtwo',
    type: 'Psychic',
    color: 0xD8C0E8,
    maxHp: 106,
    atk: 110,
    def: 90,
    spd: 130,
    catchRate: 3,
    xpYield: 306,
    moves: ['Psystrike', 'Aura Sphere', 'Shadow Ball', 'Thunderbolt']
  }
]

export const STARTER = {
  ...POKEMON_DATA[0],
  level: 5,
  currentHp: POKEMON_DATA[0].maxHp
}

export const WILD_POOL = [
  { pokemonId: 4,   minLevel: 2,  maxLevel: 8,  zone: 'grassland' },
  { pokemonId: 7,   minLevel: 2,  maxLevel: 8,  zone: 'lake'      },
  { pokemonId: 25,  minLevel: 3,  maxLevel: 10, zone: 'grassland' },
  { pokemonId: 94,  minLevel: 8,  maxLevel: 15, zone: 'forest'    },
  { pokemonId: 143, minLevel: 10, maxLevel: 18, zone: 'grassland' },
  { pokemonId: 6,   minLevel: 12, maxLevel: 20, zone: 'mountain'  },
  { pokemonId: 150, minLevel: 20, maxLevel: 30, zone: 'rare'      }
]
