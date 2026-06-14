var THREE = window.THREE;

export function mat(c, opts) {
  var o = opts || {};
  return new THREE.MeshStandardMaterial({
    color: c, roughness: o.rough != null ? o.rough : 0.92, metalness: 0,
    emissive: o.emissive || 0x000000, emissiveIntensity: o.ei != null ? o.ei : 1
  });
}
