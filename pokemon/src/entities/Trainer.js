import * as THREE from 'three'
import { mat } from '../graphics/materials.js'
import { PLAYER_SPEED, PLAYER_RUN_SPEED, WORLD_SIZE } from '../constants.js'

export class Trainer {
  constructor(scene) {
    this.scene = scene
    this.position = new THREE.Vector3(0, 0, 0)
    this.velocity = new THREE.Vector3()
    this.facing = 0  // yaw angle
    this._buildMesh()
    scene.add(this.mesh)
  }

  _buildMesh() {
    this.mesh = new THREE.Group()

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.35), mat(0x1565c0))
    body.position.y = 0.9
    body.castShadow = true

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), mat(0xffcc99))
    head.position.y = 1.58
    head.castShadow = true

    // Hat
    const hatBase = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.08, 12), mat(0xcc2222))
    hatBase.position.y = 1.9
    const hatTop = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.28, 0.3, 12), mat(0xcc2222))
    hatTop.position.y = 2.05

    // Legs
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.5, 0.22), mat(0x1a237e))
    legL.position.set(-0.15, 0.25, 0)
    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.5, 0.22), mat(0x1a237e))
    legR.position.set(0.15, 0.25, 0)

    // Arms
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.6, 0.18), mat(0x1565c0))
    armL.position.set(-0.42, 0.9, 0)
    const armR = armL.clone()
    armR.position.set(0.42, 0.9, 0)

    this.mesh.add(body, head, hatBase, hatTop, legL, legR, armL, armR)

    this.legL = legL
    this.legR = legR
    this.walkPhase = 0
  }

  update(input, camYaw, dt) {
    const speed = input.run ? PLAYER_RUN_SPEED : PLAYER_SPEED
    const dir = new THREE.Vector3()

    if (input.forward)  { dir.x -= Math.sin(camYaw); dir.z -= Math.cos(camYaw) }
    if (input.backward) { dir.x += Math.sin(camYaw); dir.z += Math.cos(camYaw) }
    if (input.left)     { dir.x -= Math.cos(camYaw); dir.z += Math.sin(camYaw) }
    if (input.right)    { dir.x += Math.cos(camYaw); dir.z -= Math.sin(camYaw) }

    const moving = dir.lengthSq() > 0
    if (moving) {
      dir.normalize()
      this.facing = Math.atan2(dir.x, dir.z)
      this.position.x += dir.x * speed * dt
      this.position.z += dir.z * speed * dt

      // Clamp to world
      const half = WORLD_SIZE / 2 - 2
      this.position.x = Math.max(-half, Math.min(half, this.position.x))
      this.position.z = Math.max(-half, Math.min(half, this.position.z))
    }

    this.mesh.position.copy(this.position)
    this.mesh.rotation.y = this.facing

    // Walk animation
    if (moving) {
      this.walkPhase += dt * (input.run ? 8 : 5)
      this.legL.rotation.x =  Math.sin(this.walkPhase) * 0.4
      this.legR.rotation.x = -Math.sin(this.walkPhase) * 0.4
    } else {
      this.legL.rotation.x *= 0.8
      this.legR.rotation.x *= 0.8
    }
  }
}
