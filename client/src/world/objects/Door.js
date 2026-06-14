import { mat } from '../../graphics/materials.js';
import { approach } from '../../constants.js';

var THREE = window.THREE;

export function buildDoor(grp, def, theme) {
  var m = new THREE.Mesh(new THREE.BoxGeometry(def.w, def.h, 2.8),
    mat(theme.accent2, { emissive: theme.accent2, ei: 0.12, rough: 0.55 }));
  m.castShadow = true;
  grp.add(m);
  var solid = { x1: def.x - def.w / 2, x2: def.x + def.w / 2, y1: def.base, y2: def.base + def.h };
  return { def, mesh: m, open: 0, solid };
}

export function updateDoor(dr, state, timers, dt, t) {
  var d = dr.def, targetOpen = 0, timedRemaining = 0;
  if (d.when) {
    targetOpen = d.when(state) ? 1 : 0;
  } else {
    if (d.trigger(state)) {
      timers[d.id] = d.duration;
    } else if (timers[d.id] > 0) {
      timers[d.id] -= dt;
      if (timers[d.id] > 0) timedRemaining = timers[d.id];
    }
    targetOpen = (timers[d.id] || 0) > 0 ? 1 : 0;
  }
  dr.open = approach(dr.open, targetOpen, dt * 1.6);
  var y1 = d.base - dr.open * d.h;
  dr.solid.x1 = d.x - d.w / 2; dr.solid.x2 = d.x + d.w / 2;
  dr.solid.y1 = y1; dr.solid.y2 = y1 + d.h;
  dr.solid.isDoorOpen = dr.open > 0.92;
  dr.mesh.position.set(d.x, y1 + d.h / 2, 0);
  if (!d.when && (timers[d.id] || 0) > 0 && timers[d.id] < 1.5) {
    dr.mesh.material.emissiveIntensity = 0.2 + 0.5 * Math.abs(Math.sin(t * 10));
  } else {
    dr.mesh.material.emissiveIntensity = 0.12;
  }
  return timedRemaining;
}
