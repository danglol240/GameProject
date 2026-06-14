import { mat } from '../../graphics/materials.js';

var THREE = window.THREE;

export function buildButton(grp, def) {
  var ped = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.5), mat(0x2b3044));
  ped.position.set(def.x, def.y + 0.275, 0); ped.castShadow = true;
  var orb = new THREE.Mesh(new THREE.SphereGeometry(0.21, 14, 14),
    mat(0xff5470, { emissive: 0xff5470, ei: 0.6, rough: 0.4 }));
  orb.position.set(def.x, def.y + 0.72, 0); orb.castShadow = true;
  grp.add(ped); grp.add(orb);
  return { def, orb };
}
