import * as THREE from 'three'
import { buildGround } from './objects/Ground.js'
import { makeTree } from './objects/Tree.js'
import { makeBuilding } from './objects/Building.js'
import { GrassZone } from './objects/GrassZone.js'
import { WORLD_SIZE } from '../constants.js'

export function buildWorld(scene) {
  scene.background = new THREE.Color(0x87ceeb)
  scene.fog = new THREE.FogExp2(0x87ceeb, 0.012)

  buildGround(scene)

  // Trees around border
  const half = WORLD_SIZE / 2 - 5
  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * Math.PI * 2
    const jitter = (Math.random() - 0.5) * 8
    const r = half + jitter
    const scale = 0.7 + Math.random() * 0.8
    scene.add(makeTree(Math.cos(angle) * r, Math.sin(angle) * r, scale))
  }

  // Interior trees
  const interiorPositions = [
    [-20, -20], [20, -20], [-20, 20], [15, 10], [-10, 15],
    [5, -30], [-30, 5], [25, -10], [-15, -35], [35, 15]
  ]
  for (const [x, z] of interiorPositions) {
    scene.add(makeTree(
      x + (Math.random() - 0.5) * 4,
      z + (Math.random() - 0.5) * 4,
      0.8 + Math.random() * 0.4
    ))
  }

  // Village buildings (top-right quadrant)
  scene.add(makeBuilding(28, 22, 7, 6, 4.5, 0xf5f0e0, 0xcc3333))
  scene.add(makeBuilding(38, 18, 6, 5, 4,   0xeae0d0, 0x3366cc))
  scene.add(makeBuilding(30, 34, 5, 5, 3.5, 0xf0ead8, 0x996633))
  // Pokemon Center
  scene.add(makeBuilding(22, 30, 8, 6, 5, 0xffffff, 0xff4444))

  // Grass zones with encounter data
  const zones = [
    new GrassZone(-25, -15, 18, 14),
    new GrassZone( 10, -20, 15, 12),
    new GrassZone(-15,  20, 14, 14),
    new GrassZone( 20, -35, 16, 14),
    new GrassZone(-35,  10, 12, 12),
    new GrassZone(  5,  15, 10, 10)
  ]
  for (const zone of zones) scene.add(zone.buildMesh())

  // Lake (bottom-left)
  const lake = new THREE.Mesh(
    new THREE.CircleGeometry(14, 32),
    new THREE.MeshStandardMaterial({ color: 0x2979cc, roughness: 0.1, metalness: 0.3 })
  )
  lake.rotation.x = -Math.PI / 2
  lake.position.set(-30, 0.02, -30)
  lake.receiveShadow = true
  scene.add(lake)

  return zones
}
