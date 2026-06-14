import { mat } from '../../graphics/materials.js';

var THREE = window.THREE;

export function buildPlate(grp, def, theme) {
  var base = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.62, 0.1, 20), mat(0x2b3044));
  base.position.set(def.x, def.y + 0.05, 0);
  var cap = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.46, 0.16, 20),
    mat(theme.accent, { emissive: theme.accent, ei: 0.25 }));
  cap.position.set(def.x, def.y + 0.16, 0);
  cap.castShadow = true;
  grp.add(base); grp.add(cap);
  return { def, cap, pressed: false, press: 0 };
}

export function updatePlate(pl, players, dt) {
  var d = pl.def;
  var pressed = players.some(function (p) {
    return Math.abs(p.x - d.x) < 0.62 && p.y > d.y - 0.3 && p.y < d.y + 0.35;
  });
  pl.pressed = pressed;
  pl.press += ((pressed ? 1 : 0) - pl.press) * Math.min(1, dt * 14);
  pl.cap.position.y = d.y + 0.16 - pl.press * 0.09;
  pl.cap.material.emissiveIntensity = 0.25 + pl.press * 0.8;
  return pressed;
}
