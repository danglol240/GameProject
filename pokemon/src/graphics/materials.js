import * as THREE from 'three'

export function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness:         opts.rough   ?? 0.8,
    metalness:         opts.metal   ?? 0,
    emissive:          opts.emissive ?? 0x000000,
    emissiveIntensity: opts.ei      ?? 0,
    transparent:       opts.transparent ?? false,
    opacity:           opts.opacity ?? 1
  })
}
