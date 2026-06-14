import { mat } from '../graphics/materials.js';
import { clamp } from '../constants.js';

var THREE = window.THREE;

export function makePlayer(i, colors) {
  var color = colors[i];
  var g = new THREE.Group();
  var body = new THREE.Group();

  var capsule = new THREE.Mesh(new THREE.CapsuleGeometry(0.38, 0.42, 6, 16), mat(color, { rough: 0.6 }));
  capsule.position.y = 0.59; capsule.castShadow = true;
  body.add(capsule);

  var eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.105, 12, 12), mat(0xffffff, { rough: 0.3 }));
  var eyeR = eyeL.clone();
  eyeL.position.set(-0.14, 0.72, 0.30); eyeR.position.set(0.14, 0.72, 0.30);
  var pupL = new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 10), mat(0x222233, { rough: 0.3 }));
  var pupR = pupL.clone();
  pupL.position.set(-0.14, 0.72, 0.39); pupR.position.set(0.14, 0.72, 0.39);
  body.add(eyeL); body.add(eyeR); body.add(pupL); body.add(pupR);
  g.add(body);

  return {
    idx: i, color, mesh: g, body, pupils: [pupL, pupR],
    x: 0, y: 0, vx: 0, vy: 0, face: 1, onGround: false, groundRef: null,
    coyote: 0, jumpBuf: 0, squash: 1, frameDx: 0, wasGround: false,
    aabb: { x1: 0, x2: 0, y1: 0, y2: 0, isPlayer: true, owner: null }
  };
}

export function updatePlayerMesh(p, dt) {
  p.squash += (1 - p.squash) * Math.min(1, dt * 9);
  p.mesh.position.set(p.x, p.y, 0);
  var sq = p.squash;
  p.body.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
  p.body.rotation.z = clamp(-p.vx * 0.035, -0.25, 0.25);
  p.pupils.forEach(function (pp, pi) {
    var bx = pi === 0 ? -0.14 : 0.14;
    pp.position.x += (bx + p.face * 0.05 - pp.position.x) * 0.2;
  });
}
