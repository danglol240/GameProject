import * as THREE from 'three'
import { CAM_DISTANCE, CAM_HEIGHT } from '../constants.js'

export class ThirdPersonCamera {
  constructor(camera) {
    this.camera = camera
    this.yaw   = 0    // horizontal orbit angle
    this.pitch = 0.3  // vertical angle (radians)
  }

  rotate(dx, dy) {
    this.yaw   -= dx * 0.003
    this.pitch  = Math.max(0.1, Math.min(0.8, this.pitch + dy * 0.003))
  }

  update(targetPos, dt) {
    const x = targetPos.x + Math.sin(this.yaw) * CAM_DISTANCE * Math.cos(this.pitch)
    const y = targetPos.y + CAM_HEIGHT + Math.sin(this.pitch) * CAM_DISTANCE * 0.5
    const z = targetPos.z + Math.cos(this.yaw) * CAM_DISTANCE * Math.cos(this.pitch)

    this.camera.position.lerp(
      new THREE.Vector3(x, y, z),
      Math.min(1, dt * 8)
    )
    this.camera.lookAt(targetPos.x, targetPos.y + 1, targetPos.z)
  }

  getForwardDir() {
    return new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize()
  }

  getRightDir() {
    const f = this.getForwardDir()
    return new THREE.Vector3(f.z, 0, -f.x)
  }
}
