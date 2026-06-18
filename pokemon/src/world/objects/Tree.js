import * as THREE from 'three'
import { mat } from '../../graphics/materials.js'

export function makeTree(x, z, scale = 1) {
  const g = new THREE.Group()

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3 * scale, 0.4 * scale, 1.8 * scale, 8),
    mat(0x7a5c3a)
  )
  trunk.position.y = 0.9 * scale
  trunk.castShadow = true
  g.add(trunk)

  // 3 layered cones for foliage
  const colors = [0x2d7a1f, 0x348a24, 0x3d9e2b]
  for (let i = 0; i < 3; i++) {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry((2 - i * 0.3) * scale, 2 * scale, 8),
      mat(colors[i])
    )
    cone.position.y = (2 + i * 1.2) * scale
    cone.castShadow = true
    g.add(cone)
  }

  g.position.set(x, 0, z)
  return g
}
