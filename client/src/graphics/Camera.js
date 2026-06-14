import { clamp } from '../constants.js';

var THREE = window.THREE;

export function createCamera() {
  return {
    camera: new THREE.PerspectiveCamera(50, 16 / 9, 0.1, 200),
    pos: new THREE.Vector3(0, 5, 14),
    tgt: new THREE.Vector3(0, 1, 0)
  };
}

export function snapCamera(cam, x) {
  cam.pos.set(x, 5, 14);
  cam.tgt.set(x, 1, 0);
}

export function updateCamera(cam, players, dt) {
  var p0 = players[0], p1 = players[1];
  var midX = (p0.x + p1.x) / 2, midY = (p0.y + p1.y) / 2;
  var sep = Math.abs(p0.x - p1.x) + Math.abs(p0.y - p1.y) * 0.7;
  var dist = clamp(8 + sep * 0.55, 10.5, 18);
  var k = 1 - Math.pow(0.0015, dt);
  cam.pos.x += (midX - cam.pos.x) * k;
  cam.pos.y += (midY + 4.0 - cam.pos.y) * k;
  cam.pos.z += (dist - cam.pos.z) * k;
  cam.tgt.x += (midX - cam.tgt.x) * k;
  cam.tgt.y += (midY + 1.1 - cam.tgt.y) * k;
  cam.camera.position.copy(cam.pos);
  cam.camera.lookAt(cam.tgt);
  return midX;
}
