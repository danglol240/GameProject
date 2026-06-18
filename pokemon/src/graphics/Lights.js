import * as THREE from 'three'

export function createLights(scene) {
  const ambient = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambient)

  const sun = new THREE.DirectionalLight(0xfff4e0, 1.2)
  sun.position.set(30, 50, 20)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  sun.shadow.camera.left   = -80
  sun.shadow.camera.right  =  80
  sun.shadow.camera.top    =  80
  sun.shadow.camera.bottom = -80
  sun.shadow.camera.far    = 200
  scene.add(sun)

  return { ambient, sun }
}
