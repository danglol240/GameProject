import * as THREE from 'three'
import { mat } from '../../graphics/materials.js'

export class GrassZone {
  constructor(cx, cz, w, d) {
    this.cx = cx; this.cz = cz; this.w = w; this.d = d
    // AABB
    this.x1 = cx - w / 2; this.x2 = cx + w / 2
    this.z1 = cz - d / 2; this.z2 = cz + d / 2
  }

  buildMesh() {
    const g = new THREE.Group()

    // Base darker green
    const base = new THREE.Mesh(
      new THREE.PlaneGeometry(this.w, this.d),
      mat(0x3d7a30, { rough: 1 })
    )
    base.rotation.x = -Math.PI / 2
    base.position.set(this.cx, 0.01, this.cz)
    base.receiveShadow = true
    g.add(base)

    // Tall grass blades (simple box clusters)
    const count = Math.floor(this.w * this.d / 4)
    for (let i = 0; i < count; i++) {
      const bx = this.cx + (Math.random() - 0.5) * this.w
      const bz = this.cz + (Math.random() - 0.5) * this.d
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.6 + Math.random() * 0.4, 0.15),
        mat(0x4caf50, { rough: 1 })
      )
      blade.position.set(bx, 0.35, bz)
      blade.rotation.y = Math.random() * Math.PI
      g.add(blade)
    }

    return g
  }

  contains(x, z) {
    return x > this.x1 && x < this.x2 && z > this.z1 && z < this.z2
  }
}
