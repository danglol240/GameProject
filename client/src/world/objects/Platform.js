import { mat } from '../../graphics/materials.js';

var THREE = window.THREE;

export function buildPlatform(grp, p, theme, rnd) {
  var th = p.th || 8, w = p.x2 - p.x1, d = 4.6;
  var topMat = mat(theme.plat), sideMat = mat(theme.side);
  var box = new THREE.Mesh(new THREE.BoxGeometry(w, th, d),
    [sideMat, sideMat, topMat, sideMat, sideMat, sideMat]);
  box.position.set((p.x1 + p.x2) / 2, p.top - th / 2, 0);
  box.receiveShadow = true; box.castShadow = true;
  grp.add(box);

  var trees = Math.floor(w / 5);
  for (var t = 0; t < trees; t++) {
    var tx = p.x1 + 1 + rnd() * (w - 2), scale = 0.7 + rnd() * 0.7;
    var trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09 * scale, 0.12 * scale, 0.6 * scale, 8), mat(0x8a5a3b));
    trunk.position.set(tx, p.top + 0.3 * scale, -1.6);
    var leafC = [theme.accent, theme.accent2, theme.plat][Math.floor(rnd() * 3)];
    var leaf = new THREE.Mesh(new THREE.ConeGeometry(0.45 * scale, 0.9 * scale, 8), mat(leafC));
    leaf.position.set(tx, p.top + (0.6 + 0.45) * scale, -1.6);
    trunk.castShadow = leaf.castShadow = true;
    grp.add(trunk); grp.add(leaf);
  }

  return { x1: p.x1, x2: p.x2, y1: p.top - th, y2: p.top };
}

export function buildBackground(grp, theme, rnd) {
  for (var h = 0; h < 9; h++) {
    var hx = -8 + h * 6 + rnd() * 3, hh = 2.5 + rnd() * 4, hw = 4 + rnd() * 4;
    var hill = new THREE.Mesh(new THREE.BoxGeometry(hw, hh, 3), mat(theme.side, { rough: 1 }));
    hill.position.set(hx, hh / 2 - 2.5, -10 - rnd() * 5);
    grp.add(hill);
  }
  for (var c = 0; c < 6; c++) {
    var cl = new THREE.Group();
    for (var s = 0; s < 3; s++) {
      var puff = new THREE.Mesh(new THREE.SphereGeometry(0.7 + rnd() * 0.5, 10, 10), mat(0xffffff, { rough: 1 }));
      puff.position.set(s * 0.9 - 0.9, rnd() * 0.3, 0);
      puff.scale.y = 0.6;
      cl.add(puff);
    }
    cl.position.set(-6 + c * 8 + rnd() * 4, 6.5 + rnd() * 4, -8 - rnd() * 5);
    grp.add(cl);
  }
}
