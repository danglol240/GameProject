import { mat } from '../../graphics/materials.js';

var THREE = window.THREE;

export function buildMover(grp, def, theme) {
  var m = new THREE.Mesh(new THREE.BoxGeometry(def.w, 0.5, 3.6),
    mat(theme.accent, { emissive: theme.accent, ei: 0.1, rough: 0.6 }));
  m.castShadow = true; m.receiveShadow = true;
  grp.add(m);
  var solid = { x1: 0, x2: 0, y1: 0, y2: 0, isMover: true, dx: 0, dy: 0 };
  return { def, mesh: m, solid, lastX: null, lastY: null };
}

export function updateMover(mv, t) {
  var d = mv.def;
  var px = d.x + d.ax * Math.sin((t + d.phase) * Math.PI * 2 / d.period);
  var py = d.y + d.ay * Math.sin((t + d.phase) * Math.PI * 2 / d.period);
  mv.solid.dx = mv.lastX == null ? 0 : px - mv.lastX;
  mv.solid.dy = mv.lastY == null ? 0 : py - mv.lastY;
  mv.lastX = px; mv.lastY = py;
  mv.solid.x1 = px - d.w / 2; mv.solid.x2 = px + d.w / 2;
  mv.solid.y2 = py; mv.solid.y1 = py - 0.5;
  mv.mesh.position.set(px, py - 0.25, 0);
}
