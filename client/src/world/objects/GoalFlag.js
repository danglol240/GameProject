import { mat } from '../../graphics/materials.js';

var THREE = window.THREE;

export function buildGoalFlag(grp, goal) {
  var pad = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.55, 0.18, 28),
    mat(0xffd166, { emissive: 0xffd166, ei: 0.3, rough: 0.5 }));
  pad.position.set(goal.x, goal.y + 0.09, 0); pad.receiveShadow = true;
  var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.1, 10), mat(0xf2f2f2, { rough: 0.4 }));
  pole.position.set(goal.x, goal.y + 1.55, 0); pole.castShadow = true;
  var flag = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.62, 0.04),
    mat(0xff5470, { emissive: 0xff5470, ei: 0.3 }));
  flag.position.set(goal.x + 0.58, goal.y + 2.7, 0); flag.castShadow = true;
  grp.add(pad); grp.add(pole); grp.add(flag);
  return { pad, flag };
}

export function updateGoalFlag(goalMeshes, t) {
  goalMeshes.flag.rotation.y = Math.sin(t * 3) * 0.25;
  goalMeshes.pad.material.emissiveIntensity = 0.3 + 0.2 * Math.sin(t * 4);
}
