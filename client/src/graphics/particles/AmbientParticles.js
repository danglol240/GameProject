var THREE = window.THREE;

export class AmbientParticles {
  constructor(scene) {
    var n = 90, pos = new Float32Array(n * 3), seeds = [];
    for (var i = 0; i < n; i++) {
      pos[i * 3]     = Math.random() * 50 - 10;
      pos[i * 3 + 1] = Math.random() * 12 - 2;
      pos[i * 3 + 2] = Math.random() * 14 - 9;
      seeds.push(Math.random() * Math.PI * 2);
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var pm = new THREE.PointsMaterial({ color: 0xffffff, size: 0.09, transparent: true, opacity: 0.55, depthWrite: false });
    this.points = new THREE.Points(geo, pm);
    this._seeds = seeds;
    this._n = n;
    scene.add(this.points);
  }

  setOpacity(v) {
    this.points.material.opacity = v;
  }

  update(t, camX) {
    var pos = this.points.geometry.attributes.position;
    for (var k = 0; k < this._n; k++) {
      pos.array[k * 3 + 1] += Math.sin(t * 0.6 + this._seeds[k]) * 0.0035;
      pos.array[k * 3]     += 0.004;
      if (pos.array[k * 3] > camX + 28) pos.array[k * 3] = camX - 28;
    }
    pos.needsUpdate = true;
  }
}
