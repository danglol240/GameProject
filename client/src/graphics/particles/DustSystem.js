import { mat } from '../materials.js';

var THREE = window.THREE;

export class DustSystem {
  constructor(scene) {
    this._scene = scene;
    this._dust = [];
    this._confetti = [];
  }

  spawnDust(x, y, n, color) {
    for (var i = 0; i < n; i++) {
      var m = new THREE.Mesh(
        new THREE.SphereGeometry(0.08 + Math.random() * 0.07, 6, 6),
        mat(color || 0xffffff, { rough: 1 })
      );
      m.material.transparent = true;
      m.position.set(x + (Math.random() - 0.5) * 0.5, y + 0.06, (Math.random() - 0.5) * 0.4);
      this._scene.add(m);
      this._dust.push({ m, vx: (Math.random() - 0.5) * 2.4, vy: Math.random() * 1.8 + 0.4, life: 0.55 + Math.random() * 0.25, t: 0 });
    }
  }

  spawnConfetti(x, y) {
    var colors = [0xff7a4d, 0x4da8ff, 0xffd166, 0x2ec4b6, 0xff6b9d, 0x845ef7];
    for (var i = 0; i < 90; i++) {
      var m = new THREE.Mesh(
        new THREE.BoxGeometry(0.16, 0.16, 0.02),
        mat(colors[i % colors.length], { rough: 0.5, emissive: colors[i % colors.length], ei: 0.25 })
      );
      m.position.set(x + (Math.random() - 0.5) * 2, y + 2 + Math.random() * 2, (Math.random() - 0.5) * 2);
      m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      this._scene.add(m);
      this._confetti.push({
        m, vx: (Math.random() - 0.5) * 5, vy: Math.random() * 7 + 3, vz: (Math.random() - 0.5) * 3,
        rx: (Math.random() - 0.5) * 8, rz: (Math.random() - 0.5) * 8, t: 0, life: 3.2
      });
    }
  }

  update(dt) {
    for (var i = this._dust.length - 1; i >= 0; i--) {
      var d = this._dust[i];
      d.t += dt;
      if (d.t > d.life) {
        this._scene.remove(d.m); d.m.geometry.dispose(); d.m.material.dispose();
        this._dust.splice(i, 1); continue;
      }
      d.m.position.x += d.vx * dt;
      d.m.position.y += d.vy * dt;
      d.vy -= 3 * dt;
      var f = 1 - d.t / d.life;
      d.m.material.opacity = f;
      d.m.scale.setScalar(0.5 + f * 0.6);
    }
    for (var j = this._confetti.length - 1; j >= 0; j--) {
      var c = this._confetti[j];
      c.t += dt;
      if (c.t > c.life) {
        this._scene.remove(c.m); c.m.geometry.dispose(); c.m.material.dispose();
        this._confetti.splice(j, 1); continue;
      }
      c.vy -= 9 * dt;
      c.m.position.x += c.vx * dt;
      c.m.position.y += c.vy * dt;
      c.m.position.z += c.vz * dt;
      c.m.rotation.x += c.rx * dt;
      c.m.rotation.z += c.rz * dt;
    }
  }
}
