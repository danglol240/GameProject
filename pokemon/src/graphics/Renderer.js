import * as THREE from 'three'

export function createRenderer(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.2
  renderer.domElement.style.cssText = 'position:absolute;inset:0;display:block;'
  container.appendChild(renderer.domElement)
  return renderer
}

export function resizeRenderer(renderer, camera, w, h) {
  renderer.setSize(w, h)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  camera.aspect = w / h
  camera.updateProjectionMatrix()
}
