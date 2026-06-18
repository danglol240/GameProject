import * as THREE from 'three'
import { mat } from '../../graphics/materials.js'

export function makeBuilding(x, z, w = 6, d = 5, h = 4, wallColor = 0xf0e8d0, roofColor = 0xd44444) {
  const g = new THREE.Group()

  // Walls
  const walls = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    mat(wallColor, { rough: 0.8 })
  )
  walls.position.y = h / 2
  walls.castShadow = true
  walls.receiveShadow = true
  g.add(walls)

  // Roof (pyramid)
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(Math.max(w, d) * 0.75, h * 0.6, 4),
    mat(roofColor, { rough: 0.7 })
  )
  roof.position.y = h + h * 0.3
  roof.rotation.y = Math.PI / 4
  roof.castShadow = true
  g.add(roof)

  // Door
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 2, 0.1),
    mat(0x7a4a2a, { rough: 0.9 })
  )
  door.position.set(0, 1, d / 2 + 0.05)
  g.add(door)

  // Windows
  for (const wx of [-1.5, 1.5]) {
    const win = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 0.1),
      mat(0x88c4f0, { rough: 0.1, metal: 0.2, emissive: 0x224466, ei: 0.15 })
    )
    win.position.set(wx, h * 0.6, d / 2 + 0.05)
    g.add(win)
  }

  g.position.set(x, 0, z)
  return g
}
