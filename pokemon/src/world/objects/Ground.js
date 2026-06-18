import * as THREE from 'three'
import { mat } from '../../graphics/materials.js'
import { WORLD_SIZE } from '../../constants.js'

export function buildGround(scene) {
  // Main ground
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE),
    mat(0x5a9e4d, { rough: 0.9 })
  )
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  // Dirt path - horizontal
  const pathH = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD_SIZE, 5),
    mat(0xc4a265, { rough: 1 })
  )
  pathH.rotation.x = -Math.PI / 2
  pathH.position.y = 0.01
  scene.add(pathH)

  // Dirt path - vertical
  const pathV = new THREE.Mesh(
    new THREE.PlaneGeometry(5, WORLD_SIZE),
    mat(0xc4a265, { rough: 1 })
  )
  pathV.rotation.x = -Math.PI / 2
  pathV.position.y = 0.01
  scene.add(pathV)

  // Background mountains
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2
    const r = WORLD_SIZE * 0.6
    const h = 15 + Math.random() * 20
    const w = 20 + Math.random() * 15
    const mountain = new THREE.Mesh(
      new THREE.ConeGeometry(w, h, 6),
      mat(0x6b8f6b, { rough: 1 })
    )
    mountain.position.set(Math.cos(angle) * r, h / 2, Math.sin(angle) * r)
    scene.add(mountain)
  }
}
