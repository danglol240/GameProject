/* Interactive isometric room: every object is a door to a page. Needs three.js r149 (vendor/three.min.js). */
(function () {
  'use strict';

  var THREE = window.THREE;
  var body = document.body;
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Hotspots: what each object opens ─────────────────────────
  var HOTS = {
    cloud:      { short: 'Cloud', label: 'Test Cloud', desc: 'Quản lý máy ảo, ổ đĩa, mạng', url: '/cloud/', color: '#0fb5a4', off: [-92, 10] },
    platformer: { short: 'Platformer', label: 'Đôi Bạn Cùng Tiến', desc: 'Game co-op 1–2 người', url: '/platformer/', color: '#2f6bff', off: [78, 30] },
    pokemon:    { short: 'Pokémon', label: 'Pokémon World', desc: 'Game 3D khám phá và bắt Pokémon', url: '/pokemon/', color: '#ff7a2f' },
    admin:      { short: 'Quản trị', label: 'Quản trị Horizon', desc: 'Trang quản trị OpenStack', url: '/home/', color: '#8a5cff' },
    github:     { short: 'GitHub', label: 'GitHub', desc: 'Mã nguồn dự án', url: 'https://github.com/danglol240', external: true, color: '#14203f' },
    lamp:       { short: 'Đèn', label: 'Bật đèn', desc: 'Chuyển ngày và đêm', action: 'night', color: '#f5b301' },
    cat:        { short: 'Mèo', label: 'Mèo', desc: 'Thử vuốt ve xem', action: 'cat', color: '#ff4f93' }
  };

  function webglOk() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  }

  var api = null;

  function setMode(mode) {
    body.classList.toggle('room-mode', mode === 'room');
    body.classList.toggle('list-mode', mode === 'list');
    try { localStorage.setItem('portal_view', mode); } catch (e) { /* storage unavailable */ }
    if (api) { if (mode === 'room') api.resume(); else api.pause(); }
  }

  document.getElementById('btn-list').addEventListener('click', function () { setMode('list'); });
  document.getElementById('btn-room').addEventListener('click', function () {
    if (!api && THREE && webglOk()) { api = init(); }
    if (api) setMode('room');
  });

  var saved = null;
  try { saved = localStorage.getItem('portal_view'); } catch (e) { /* ignore */ }
  var canRoom = !!(THREE && webglOk());
  document.getElementById('btn-room').hidden = !canRoom;

  if (!canRoom || saved === 'list' || location.hash === '#list') {
    setMode('list');
  } else {
    api = init();
    setMode('room');
  }

  // ═════════════════════════════════════════════════════════════
  function init() {
    var stage = document.getElementById('stage');
    var tagsBox = document.getElementById('tags');
    var hint = document.getElementById('hint');
    var fade = document.getElementById('fade');
    var nightBtn = document.getElementById('btn-night');

    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    stage.appendChild(renderer.domElement);

    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 80);
    var room = new THREE.Group();
    scene.add(room);

    // ── helpers ────────────────────────────────────────────────
    function mat(color, o) {
      return new THREE.MeshStandardMaterial(Object.assign({ color: color, roughness: 0.85, metalness: 0 }, o || {}));
    }
    function shadow(m) { m.castShadow = true; m.receiveShadow = true; return m; }
    function box(w, h, d, color, x, y, z, parent, o) {
      var m = shadow(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, o)));
      m.position.set(x, y, z);
      (parent || room).add(m);
      return m;
    }
    function cyl(rt, rb, h, color, x, y, z, parent, o, seg) {
      var m = shadow(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 24), mat(color, o)));
      m.position.set(x, y, z);
      (parent || room).add(m);
      return m;
    }
    function sph(r, color, x, y, z, parent, sx, sy, sz, o) {
      var m = shadow(new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), mat(color, o)));
      m.position.set(x, y, z);
      m.scale.set(sx || 1, sy || 1, sz || 1);
      (parent || room).add(m);
      return m;
    }
    function group(x, y, z, parent) {
      var g = new THREE.Group();
      g.position.set(x, y, z);
      (parent || room).add(g);
      return g;
    }
    function canvasTex(w, h, draw) {
      var c = document.createElement('canvas');
      c.width = w; c.height = h;
      draw(c.getContext('2d'), w, h);
      var t = new THREE.CanvasTexture(c);
      t.encoding = THREE.sRGBEncoding;
      t.anisotropy = 4;
      return t;
    }
    function rnd(seed) { var s = seed; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; }

    // ── lights ─────────────────────────────────────────────────
    var hemi = new THREE.HemisphereLight(0xfff1e0, 0xb89578, 0.6);
    scene.add(hemi);
    var sun = new THREE.DirectionalLight(0xfff0dc, 0.82);
    sun.position.set(5, 11, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    var sc = sun.shadow.camera;
    sc.left = -9; sc.right = 9; sc.top = 9; sc.bottom = -9; sc.near = 1; sc.far = 40;
    sun.shadow.bias = -0.0006;
    sun.shadow.radius = 4;
    scene.add(sun);
    var lampLight = new THREE.PointLight(0xffc477, 0, 11, 1.6);
    lampLight.position.set(-3.4, 3.4, 2.7);
    scene.add(lampLight);

    // ── shell: floor, walls ────────────────────────────────────
    var floorTex = canvasTex(512, 512, function (g, w, h) {
      var r = rnd(7);
      for (var i = 0; i < 8; i++) {
        var l = 70 + Math.floor(r() * 7);
        g.fillStyle = 'hsl(32,34%,' + l + '%)';
        g.fillRect(i * 64, 0, 64, h);
        g.fillStyle = 'rgba(120,90,60,0.28)';
        g.fillRect(i * 64, 0, 2, h);
        var y = Math.floor(r() * h);
        g.fillRect(i * 64, y, 64, 2);
      }
    });
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(1.3, 1.3);

    var base = box(8.5, 0.4, 8.5, 0xf7f3ee, 0, -0.2, 0);
    base.castShadow = false;
    var floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.9 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.003;
    floor.receiveShadow = true;
    room.add(floor);

    // floating soft shadow under the diorama
    var gshadow = new THREE.Mesh(new THREE.PlaneGeometry(15, 15), new THREE.MeshBasicMaterial({
      map: canvasTex(256, 256, function (g, w, h) {
        var gr = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2);
        gr.addColorStop(0, 'rgba(70,40,25,0.42)'); gr.addColorStop(1, 'rgba(70,40,25,0)');
        g.fillStyle = gr; g.fillRect(0, 0, w, h);
      }), transparent: true, depthWrite: false
    }));
    gshadow.rotation.x = -Math.PI / 2;
    gshadow.position.y = -0.46;
    room.add(gshadow);

    var WALL = 0xf1e6da;
    box(8.5, 4.4, 0.25, WALL, 0, 2.2, -4.125);          // back wall (inner face z = -4)
    box(0.25, 4.4, 8.25, WALL, -4.125, 2.2, -0.125);    // left wall (inner face x = -4)
    box(8.5, 0.12, 0.3, 0xffffff, 0, 4.46, -4.125);     // wall caps
    box(0.3, 0.12, 8.3, 0xffffff, -4.125, 4.46, -0.125);
    box(8, 0.22, 0.05, 0xece2d8, 0, 0.11, -3.975);      // baseboards
    box(0.05, 0.22, 7.95, 0xece2d8, -3.975, 0.11, 0);

    // rug
    var rugShape = new THREE.Shape();
    (function () {
      var w = 2.1, d = 1.6, r = 0.35;
      rugShape.moveTo(-w + r, -d);
      rugShape.lineTo(w - r, -d); rugShape.absarc(w - r, -d + r, r, -Math.PI / 2, 0, false);
      rugShape.lineTo(w, d - r); rugShape.absarc(w - r, d - r, r, 0, Math.PI / 2, false);
      rugShape.lineTo(-w + r, d); rugShape.absarc(-w + r, d - r, r, Math.PI / 2, Math.PI, false);
      rugShape.lineTo(-w, -d + r); rugShape.absarc(-w + r, -d + r, r, Math.PI, Math.PI * 1.5, false);
    })();
    var rug = shadow(new THREE.Mesh(new THREE.ExtrudeGeometry(rugShape, { depth: 0.03, bevelEnabled: false }), mat(0xc77f5e)));
    rug.rotation.x = Math.PI / 2;
    rug.position.set(0.5, 0.035, 1.0);
    rug.castShadow = false;
    room.add(rug);

    // ── hotspot registry ───────────────────────────────────────
    var hots = [];
    var hitMeshes = [];

    function hotspot(id, g, anchor, hitBox) {
      var def = HOTS[id];
      var hot = {
        id: id, def: def, group: g, anchor: anchor, hover: false, scale: 1, mats: [],
        tag: null, base: g.scale.clone()
      };
      g.traverse(function (o) {
        if (o.isMesh) {
          o.userData.hot = hot;
          hitMeshes.push(o);
          if (o.material && o.material.emissive && !o.material.userData.noHover) {
            hot.mats.push({ m: o.material, e: o.material.emissive.clone(), i: o.material.emissiveIntensity });
          }
        }
      });
      if (hitBox) {
        var hit = new THREE.Mesh(new THREE.BoxGeometry(hitBox[0], hitBox[1], hitBox[2]), new THREE.MeshBasicMaterial());
        hit.position.set(hitBox[3] || 0, hitBox[4] || 0, hitBox[5] || 0);
        hit.visible = false;
        hit.userData.hot = hot;
        g.add(hit);
        hitMeshes.push(hit);
      }
      hots.push(hot);
      return hot;
    }

    // ── DESK, monitor (→ Test Cloud) ───────────────────────────
    var WOOD = 0xc98a55;
    box(1.2, 0.1, 3.0, WOOD, -3.35, 1.5, -1.3);
    [[-2.85, -2.7], [-2.85, 0.1], [-3.85, -2.7], [-3.85, 0.1]].forEach(function (p) {
      box(0.1, 1.45, 0.1, 0xb27846, p[0], 0.725, p[1]);
    });
    box(1.0, 0.06, 0.06, 0xb27846, -3.35, 0.55, -2.7);
    box(1.0, 0.06, 0.06, 0xb27846, -3.35, 0.55, 0.1);

    var screenTex = canvasTex(512, 320, function () {});
    var screenCtx = screenTex.image.getContext('2d');
    function drawScreen(t) {
      var g = screenCtx, w = 512, h = 320;
      var bg = g.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, '#13214f'); bg.addColorStop(1, '#2b1c5e');
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(0, 0, w, 46);
      g.fillStyle = '#fff'; g.font = 'bold 26px sans-serif'; g.fillText('Test Cloud', 18, 32);
      ['#ff5f57', '#febc2e', '#28c840'].forEach(function (c, i) { g.fillStyle = c; g.beginPath(); g.arc(w - 24 - i * 22, 23, 7, 0, 6.3); g.fill(); });
      var cols = ['#2f6bff', '#8a5cff', '#0fb5a4', '#ff7a2f'];
      for (var i = 0; i < 4; i++) {
        var x = 18 + i * 122;
        g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(x, 66, 110, 84);
        g.fillStyle = cols[i]; g.fillRect(x, 66, 110, 5);
        var pct = 0.45 + 0.4 * Math.sin(t * 0.8 + i * 1.7) * 0.5 + 0.2;
        g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(x + 12, 120, 86, 10);
        g.fillStyle = cols[i]; g.fillRect(x + 12, 120, 86 * pct, 10);
        g.fillStyle = '#fff'; g.font = 'bold 30px sans-serif'; g.fillText(Math.round(pct * 100) + '%', x + 12, 106);
      }
      for (var j = 0; j < 4; j++) {
        g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(18, 170 + j * 34, 476, 26);
        g.fillStyle = '#43d98a'; g.beginPath(); g.arc(34, 183 + j * 34, 6, 0, 6.3); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(52, 178 + j * 34, 120 + (j * 37) % 90, 8);
      }
      screenTex.needsUpdate = true;
    }
    drawScreen(0);

    var monitor = group(-3.6, 1.55, -1.3);
    box(0.4, 0.04, 0.55, 0x3a3f4a, 0.05, 0.02, 0, monitor);
    box(0.08, 0.4, 0.14, 0x3a3f4a, 0, 0.22, 0, monitor);
    box(0.09, 0.9, 1.4, 0x2a2d36, 0, 0.88, 0, monitor);
    var screen = new THREE.Mesh(new THREE.PlaneGeometry(1.28, 0.78), new THREE.MeshBasicMaterial({ map: screenTex }));
    screen.rotation.y = Math.PI / 2;
    screen.position.set(0.05, 0.88, 0);
    monitor.add(screen);
    box(0.35, 0.03, 0.9, 0xdcdde2, 0.55, 0.03, 0, monitor);       // keyboard
    box(0.1, 0.03, 0.14, 0xdcdde2, 0.55, 0.03, 0.75, monitor);    // mouse
    var hMonitor = hotspot('cloud', monitor, new THREE.Vector3(-3.5, 3.35, -1.3), [0.5, 1.15, 1.6, 0.05, 0.88, 0]);

    // gamepad (→ platformer)
    var pad = group(-3.2, 1.55, -2.35);
    var padBody = box(0.3, 0.08, 0.55, 0x2f6bff, 0, 0.05, 0, pad, { emissive: 0x000000 });
    box(0.3, 0.07, 0.16, 0x2f6bff, 0, 0.04, -0.3, pad);
    cyl(0.08, 0.08, 0.05, 0x14203f, -0.0, 0.1, -0.17, pad);
    box(0.1, 0.02, 0.03, 0xffffff, 0, 0.1, 0.0, pad);
    [[-0.09, 0.14], [0.09, 0.14], [0.0, 0.2], [0.0, 0.08]].forEach(function (p, i) {
      cyl(0.026, 0.026, 0.03, ['#ff5f57', '#febc2e', '#28c840', '#ffffff'][i], 0.0 + p[0], 0.1, p[1] + 0.05, pad);
    });
    pad.rotation.y = 0.2;
    var hPad = hotspot('platformer', pad, new THREE.Vector3(-3.2, 2.45, -2.35), [0.55, 0.35, 0.75, 0, 0.12, -0.05]);

    // chair
    var chair = group(-2.15, 0, -1.3);
    box(0.85, 0.1, 0.85, 0xe0653c, 0, 0.95, 0, chair);
    box(0.1, 0.8, 0.85, 0xe0653c, 0.4, 1.4, 0, chair);
    cyl(0.05, 0.05, 0.9, 0x3a3f4a, 0, 0.48, 0, chair);
    cyl(0.4, 0.4, 0.05, 0x3a3f4a, 0, 0.03, 0, chair);

    // corkboard (→ GitHub)
    var cork = group(-3.93, 3.5, -1.3);
    box(0.06, 1.15, 1.6, 0xb7864f, 0, 0, 0, cork);
    var corkTex = canvasTex(512, 360, function (g, w, h) {
      g.fillStyle = '#d9a86a'; g.fillRect(0, 0, w, h);
      var r = rnd(11);
      for (var i = 0; i < 700; i++) { g.fillStyle = 'rgba(' + (120 + Math.floor(r() * 60)) + ',80,40,0.25)'; g.fillRect(r() * w, r() * h, 3, 3); }
      var notes = [['#fff3a8', 40, 40, 150, 120], ['#ffc2d9', 220, 60, 130, 110], ['#bfe3ff', 360, 36, 130, 130], ['#c8f2d0', 90, 200, 160, 110], ['#ffffff', 300, 200, 170, 120]];
      notes.forEach(function (n, k) {
        g.save(); g.translate(n[1] + n[3] / 2, n[2] + n[4] / 2); g.rotate((k - 2) * 0.05);
        g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(-n[3] / 2 + 4, -n[4] / 2 + 5, n[3], n[4]);
        g.fillStyle = n[0]; g.fillRect(-n[3] / 2, -n[4] / 2, n[3], n[4]);
        g.fillStyle = '#e53935'; g.beginPath(); g.arc(0, -n[4] / 2 + 10, 7, 0, 6.3); g.fill();
        g.restore();
      });
      g.fillStyle = '#14203f'; g.font = 'bold 34px sans-serif'; g.fillText('GitHub', 308, 268);
      g.font = '22px sans-serif'; g.fillText('</>', 328, 300);
    });
    var corkFace = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.05), new THREE.MeshBasicMaterial({ map: corkTex }));
    corkFace.rotation.y = Math.PI / 2; corkFace.position.x = 0.04;
    cork.add(corkFace);
    var hCork = hotspot('github', cork, new THREE.Vector3(-3.9, 4.35, -1.3), [0.3, 1.2, 1.65, 0.1, 0, 0]);

    // orange pegboard (decor)
    var peg = group(-3.94, 3.0, 1.2);
    box(0.05, 1.0, 1.0, 0xe8643d, 0, 0, 0, peg);
    for (var pi = 0; pi < 5; pi++) for (var pj = 0; pj < 5; pj++) {
      var dot = new THREE.Mesh(new THREE.CircleGeometry(0.025, 8), new THREE.MeshBasicMaterial({ color: 0xb2441f }));
      dot.rotation.y = Math.PI / 2; dot.position.set(0.03, -0.36 + pi * 0.18, -0.36 + pj * 0.18); peg.add(dot);
    }

    // server box (→ Horizon admin)
    var server = group(-3.35, 0, 1.15);
    box(0.8, 1.25, 0.8, 0x8f98a3, 0, 0.625, 0, server);
    box(0.04, 1.15, 0.7, 0x6d7580, 0.4, 0.62, 0, server);
    var leds = [];
    for (var li = 0; li < 4; li++) {
      var led = box(0.04, 0.07, 0.2, 0x111111, 0.43, 0.35 + li * 0.2, 0.22, server, { emissive: 0x28c840, emissiveIntensity: 1.3 });
      led.material.userData.noHover = true;
      leds.push(led);
      box(0.03, 0.04, 0.22, 0x3a3f4a, 0.42, 0.35 + li * 0.2, -0.12, server);
    }
    var hServer = hotspot('admin', server, new THREE.Vector3(-3.35, 1.7, 1.15), [0.9, 1.35, 0.9, 0, 0.65, 0]);

    // floor lamp (→ night mode)
    var lamp = group(-3.45, 0, 2.85);
    cyl(0.38, 0.42, 0.06, 0x3a3f4a, 0, 0.03, 0, lamp);
    cyl(0.04, 0.04, 3.1, 0x3a3f4a, 0, 1.58, 0, lamp);
    var shade = cyl(0.42, 0.7, 0.75, 0xfff4dc, 0, 3.35, 0, lamp, { emissive: 0xffc477, emissiveIntensity: 0.12, side: THREE.DoubleSide }, 28);
    shade.castShadow = false;
    shade.material.userData.noHover = true;
    var hLamp = hotspot('lamp', lamp, new THREE.Vector3(-3.45, 4.15, 2.85), [1.5, 3.4, 1.5, 0, 1.7, 0]);

    // ── BACK WALL: clock, window, shelf, cabinet, frames ───────
    // clock
    var clock = group(-2.6, 3.35, -3.97);
    var clockFace = new THREE.Mesh(new THREE.CircleGeometry(0.5, 40), new THREE.MeshBasicMaterial({
      map: canvasTex(256, 256, function (g, w, h) {
        g.fillStyle = '#fff'; g.beginPath(); g.arc(w / 2, h / 2, w / 2, 0, 6.3); g.fill();
        g.fillStyle = '#14203f';
        for (var i = 0; i < 12; i++) { var a = i * Math.PI / 6; g.fillRect(w / 2 + Math.sin(a) * 100 - 3, h / 2 - Math.cos(a) * 100 - 8, 6, i % 3 === 0 ? 18 : 10); }
      })
    }));
    clock.add(clockFace);
    var ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.05, 10, 40), mat(0x8a5a3a));
    clock.add(ring);
    var hHand = group(0, 0, 0.03, clock), mHand = group(0, 0, 0.05, clock);
    var hBar = box(0.045, 0.26, 0.02, 0x14203f, 0, 0.13, 0, hHand); hBar.castShadow = false;
    var mBar = box(0.03, 0.38, 0.02, 0x14203f, 0, 0.19, 0, mHand); mBar.castShadow = false;

    // window
    var windowG = group(-0.4, 2.6, -3.96);
    var glassMat = new THREE.MeshBasicMaterial({
      map: canvasTex(256, 320, function (g, w, h) {
        var gr = g.createLinearGradient(0, 0, 0, h);
        gr.addColorStop(0, '#9fd8ff'); gr.addColorStop(1, '#e8f7ff');
        g.fillStyle = gr; g.fillRect(0, 0, w, h);
        g.fillStyle = 'rgba(255,255,255,0.9)';
        [[60, 120, 50], [170, 90, 40], [140, 200, 55]].forEach(function (c) {
          g.beginPath(); g.arc(c[0], c[1], c[2], 0, 6.3); g.arc(c[0] + c[2] * 0.8, c[1] + 6, c[2] * 0.7, 0, 6.3); g.fill();
        });
      })
    });
    var glass = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.0), glassMat);
    glass.position.z = 0.01;
    windowG.add(glass);
    box(1.8, 0.1, 0.1, 0xffffff, 0, 1.05, 0.04, windowG);
    box(1.8, 0.1, 0.1, 0xffffff, 0, -1.05, 0.04, windowG);
    box(0.1, 2.2, 0.1, 0xffffff, -0.9, 0, 0.04, windowG);
    box(0.1, 2.2, 0.1, 0xffffff, 0.9, 0, 0.04, windowG);
    box(0.06, 2.0, 0.08, 0xffffff, 0, 0, 0.04, windowG);
    box(1.6, 0.06, 0.08, 0xffffff, 0, 0.05, 0.04, windowG);
    var blinds = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.8), new THREE.MeshBasicMaterial({
      map: canvasTex(128, 64, function (g, w, h) {
        g.fillStyle = '#e8c7b4'; g.fillRect(0, 0, w, h);
        for (var y = 0; y < h; y += 8) { g.fillStyle = 'rgba(150,100,80,0.35)'; g.fillRect(0, y, w, 2); }
      })
    }));
    blinds.position.set(0, 0.6, 0.07);
    windowG.add(blinds);
    box(2.0, 0.08, 0.3, 0xffffff, 0, -1.15, 0.12, windowG);

    // shelf + items (Pokéball → Pokémon)
    var shelf = group(1.85, 0, -3.7);
    box(0.08, 3.6, 0.08, 0xc98a55, -0.75, 1.8, 0, shelf);
    box(0.08, 3.6, 0.08, 0xc98a55, 0.75, 1.8, 0, shelf);
    [1.0, 1.8, 2.6, 3.4].forEach(function (y) { box(1.6, 0.07, 0.5, 0xd99a62, 0, y, 0.0, shelf); });
    // bottom: baskets
    box(0.55, 0.35, 0.4, 0xb98e63, -0.3, 1.2, 0, shelf);
    box(0.4, 0.28, 0.38, 0xe0653c, 0.3, 1.17, 0, shelf);
    // books
    var bookCols = [0xe0653c, 0x3b6ea5, 0xf2b84b, 0x5c8a6b, 0xa14b6e, 0x6b5b95, 0x2f6bff];
    for (var bi = 0; bi < 6; bi++) {
      box(0.1, 0.4 + (bi % 3) * 0.07, 0.34, bookCols[bi], -0.62 + bi * 0.13, 2.04 + (bi % 3) * 0.035, 0, shelf);
    }
    // small plant on 2nd shelf
    cyl(0.14, 0.11, 0.2, 0xd98c63, 0.45, 1.93, 0, shelf);
    sph(0.15, 0x5aaa63, 0.45, 2.15, 0, shelf, 1, 1.1, 1);
    sph(0.1, 0x7cc47f, 0.55, 2.27, 0.03, shelf);
    // pokeball
    var ball = group(0, 2.88, 0.02, shelf);
    var rTop = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.27, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xe53935, { roughness: 0.4, emissive: 0x000000 })));
    var rBot = shadow(new THREE.Mesh(new THREE.SphereGeometry(0.27, 28, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat(0xffffff, { roughness: 0.4, emissive: 0x000000 })));
    ball.add(rTop); ball.add(rBot);
    var band = shadow(new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.026, 8, 32), mat(0x1c1c22)));
    band.rotation.x = Math.PI / 2; ball.add(band);
    var btn = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 20), mat(0xffffff, { emissive: 0x000000 })));
    btn.rotation.x = Math.PI / 2; btn.position.z = 0.265; ball.add(btn);
    var btnRim = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 20), mat(0x1c1c22)));
    btnRim.rotation.x = Math.PI / 2; btnRim.position.z = 0.255; ball.add(btnRim);
    ball.position.y = 2.88;
    ball.rotation.y = 0.5;
    var hBall = hotspot('pokemon', ball, new THREE.Vector3(1.85, 3.5, -3.7), [0.75, 0.75, 0.75, 0, 0, 0]);
    // top shelf: vase
    cyl(0.1, 0.14, 0.34, 0x7aa6c2, -0.4, 3.6, 0, shelf);
    sph(0.12, 0x6cb36f, -0.4, 3.85, 0, shelf, 0.9, 1.3, 0.9);

    // cabinet
    box(1.45, 0.95, 0.65, 0xc98a55, 3.4, 0.475, -3.67);
    [0, 1].forEach(function (i) { box(1.3, 0.3, 0.04, 0xb27846, 3.4, 0.3 + i * 0.34, -3.32); });
    cyl(0.04, 0.04, 0.04, 0x3a3f4a, 3.15, 0.3, -3.29, null).rotation.x = Math.PI / 2;
    cyl(0.04, 0.04, 0.04, 0x3a3f4a, 3.15, 0.64, -3.29, null).rotation.x = Math.PI / 2;
    // frames on back wall
    function frame(x, y, w, h, color, art) {
      var g = group(x, y, -3.96);
      box(w + 0.12, h + 0.12, 0.06, color, 0, 0, 0, g);
      var p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: canvasTex(128, 128, art) }));
      p.position.z = 0.035; g.add(p);
      return g;
    }
    frame(3.4, 2.6, 0.8, 1.0, 0x3a2a22, function (g, w, h) {
      g.fillStyle = '#f7e9d7'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#e8643d'; g.beginPath(); g.arc(w * 0.5, h * 0.4, 30, 0, 6.3); g.fill();
      g.fillStyle = '#2f6bff'; g.fillRect(24, 84, 80, 18);
    });
    frame(-1.5, 1.7, 0.55, 0.55, 0xffffff, function (g, w, h) {
      g.fillStyle = '#bfe3ff'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#8a5cff'; g.beginPath(); g.moveTo(10, 118); g.lineTo(64, 20); g.lineTo(118, 118); g.fill();
    });

    // big plant
    var plant = group(3.35, 0, -2.45);
    cyl(0.4, 0.3, 0.58, 0xd98c63, 0, 0.29, 0, plant);
    cyl(0.36, 0.36, 0.04, 0x4a3426, 0, 0.58, 0, plant);
    var leaves = group(0, 0.6, 0, plant);
    var leafCols = [0x4f9d5d, 0x6cb36f, 0x3e8a52];
    for (var k = 0; k < 11; k++) {
      var ang = k / 11 * Math.PI * 2, lh = 0.3 + (k % 4) * 0.28;
      var pivot = group(0, 0, 0, leaves);
      pivot.rotation.y = ang;
      var leaf = sph(0.2, leafCols[k % 3], 0.28 + (k % 3) * 0.06, lh + 0.25, 0, pivot, 1.15, 1.7, 0.42);
      leaf.rotation.z = -0.55;
    }
    sph(0.22, 0x4f9d5d, 0, 1.6, 0, leaves, 0.55, 1.5, 0.55);

    // crate by the rug
    box(0.6, 0.5, 0.6, 0xd9b48a, 3.0, 0.25, 0.9);
    box(0.62, 0.06, 0.62, 0xc59a6c, 3.0, 0.52, 0.9);

    // ── CAT (→ meow) ───────────────────────────────────────────
    var cat = group(0.95, 0, 2.35);
    cat.rotation.y = 0.75;
    var catBody = group(0, 0, 0, cat);
    sph(0.5, 0x232327, 0, 0.4, 0, catBody, 0.8, 0.78, 1.0);
    sph(0.3, 0xf3f3f0, 0, 0.42, 0.38, catBody, 0.9, 1.0, 0.7);
    var head = group(0, 0.9, 0.42, catBody);
    sph(0.3, 0x232327, 0, 0, 0, head, 1.05, 0.95, 0.95);
    sph(0.15, 0xf3f3f0, 0, -0.08, 0.2, head, 1.1, 0.7, 0.7);
    [-1, 1].forEach(function (s) {
      var ear = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.22, 4), mat(0x232327));
      ear.position.set(s * 0.17, 0.3, 0); ear.rotation.z = -s * 0.25; shadow(ear); head.add(ear);
      sph(0.05, 0xf7c9d6, s * 0.17, 0.27, 0.05, head, 0.6, 1, 0.3);
      sph(0.05, 0xffd84a, s * 0.12, 0.04, 0.27, head, 1, 1.1, 0.5, { emissive: 0x806000, emissiveIntensity: 0.4 });
      sph(0.022, 0x111111, s * 0.12, 0.04, 0.31, head);
      sph(0.06, 0xf3f3f0, s * 0.18, -0.02, 0.0, head, 1, 0.4, 0.4);
    });
    sph(0.03, 0xf7a1bd, 0, -0.01, 0.31, head);
    var tail = group(-0.05, 0.25, -0.45, catBody);
    var tseg = cyl(0.06, 0.05, 0.7, 0x232327, 0, 0.3, -0.15, tail);
    tseg.rotation.x = -0.9;
    sph(0.06, 0x232327, 0, 0.62, -0.46, tail);
    [-1, 1].forEach(function (s) { sph(0.1, 0xf3f3f0, s * 0.18, 0.09, 0.55, catBody, 0.9, 0.7, 1.3); });
    var hCat = hotspot('cat', cat, new THREE.Vector3(0.95, 1.75, 2.35), [1.2, 1.4, 1.5, 0, 0.7, 0.1]);

    // ── tags (HTML links floating over the objects) ────────────
    var order = [hMonitor, hPad, hBall, hServer, hCork, hLamp, hCat];
    order.forEach(function (hot) {
      var d = hot.def;
      var el = document.createElement(d.url ? 'a' : 'button');
      el.className = 'tag';
      el.style.setProperty('--c', d.color);
      if (d.url) { el.href = d.url; if (d.external) { el.target = '_blank'; el.rel = 'noopener'; } }
      else el.type = 'button';
      var pin = document.createElement('span'); pin.className = 'pin';
      var b = document.createElement('b'); b.textContent = d.label;
      var i = document.createElement('i'); i.textContent = d.desc;
      el.append(pin, b, i);
      el.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
        e.preventDefault();
        activate(hot);
      });
      el.addEventListener('pointerenter', function () { hot.hover = true; });
      el.addEventListener('pointerleave', function () { hot.hover = false; });
      el.addEventListener('focus', function () { hot.hover = true; });
      el.addEventListener('blur', function () { hot.hover = false; });
      tagsBox.appendChild(el);
      hot.tag = el; hot.labelEl = b;
    });

    // ── interaction ────────────────────────────────────────────
    var raycaster = new THREE.Raycaster();
    var ptr = new THREE.Vector2(9, 9);
    var mouse = { x: 0, y: 0 };
    var overHot = null;
    var leaving = null;
    var meowAt = -10;

    renderer.domElement.addEventListener('pointermove', function (e) {
      var r = renderer.domElement.getBoundingClientRect();
      ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      ptr.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      mouse.x = ptr.x; mouse.y = ptr.y;
      pick();
    });
    renderer.domElement.addEventListener('pointerleave', function () { ptr.set(9, 9); pick(); });
    renderer.domElement.addEventListener('click', function (e) {
      var r = renderer.domElement.getBoundingClientRect();
      ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      ptr.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      pick();
      if (overHot) activate(overHot);
    });

    function pick() {
      raycaster.setFromCamera(ptr, camera);
      var hit = raycaster.intersectObjects(hitMeshes, false)[0];
      overHot = hit ? hit.object.userData.hot : null;
      hots.forEach(function (h) { if (!h.tag.matches(':hover, :focus')) h.hover = (h === overHot); });
      renderer.domElement.style.cursor = overHot ? 'pointer' : 'default';
    }

    var night = false;
    try { night = localStorage.getItem('portal_night') === '1'; } catch (e) { /* ignore */ }
    var nightT = night ? 1 : 0;
    function setNight(v) {
      night = v;
      try { localStorage.setItem('portal_night', v ? '1' : '0'); } catch (e) { /* ignore */ }
      body.classList.toggle('night', v);
      nightBtn.textContent = v ? 'Ban ngày' : 'Ban đêm';
      updateLabels();
    }
    function updateLabels() {
      hots.forEach(function (h) {
        if (!h.labelEl) return;
        var text = compact ? h.def.short : (h.id === 'lamp' ? (night ? 'Tắt đèn' : 'Bật đèn') : h.def.label);
        if (h.id === 'lamp' && compact) text = night ? 'Tắt' : 'Đèn';
        h.labelEl.textContent = text;
      });
    }
    setNight(night);
    nightBtn.addEventListener('click', function () { setNight(!night); hideHint(); });

    function hideHint() { hint.classList.add('gone'); }
    setTimeout(hideHint, 9000);

    function activate(hot) {
      hideHint();
      var d = hot.def;
      if (d.action === 'night') { setNight(!night); return; }
      if (d.action === 'cat') { meowAt = clockT; showBubble(hot, 'Meo~'); return; }
      if (d.external) { window.open(d.url, '_blank', 'noopener'); return; }
      if (leaving) return;
      if (reduced) { location.href = d.url; return; }
      leaving = { hot: hot, t0: performance.now() };
      fade.classList.add('on');
      setTimeout(function () { location.href = d.url; }, 650);
    }

    var bubbleTimer = null;
    function showBubble(hot, text) {
      var old = hot.tag.querySelector('.bubble');
      if (old) old.remove();
      var bub = document.createElement('span');
      bub.className = 'bubble'; bub.textContent = text;
      hot.tag.appendChild(bub);
      clearTimeout(bubbleTimer);
      bubbleTimer = setTimeout(function () { bub.remove(); }, 1400);
    }

    // ── sizing and camera ──────────────────────────────────────
    var compact = false;
    var R = 14.2, camH = 9.4, look = new THREE.Vector3(0, 1.9, 0);
    function resize() {
      var w = stage.clientWidth || window.innerWidth, h = stage.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      var aspect = w / h;
      compact = w < 640;
      updateLabels();
      var vh = Math.max(12.4, 14.4 / aspect);
      camera.left = -vh * aspect / 2; camera.right = vh * aspect / 2; camera.top = vh / 2; camera.bottom = -vh / 2;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    resize();

    // ── animation ──────────────────────────────────────────────
    var clockT = 0, last = performance.now(), raf = 0, running = false, lastScreen = -1;
    var tmp = new THREE.Vector3();
    var baseCol = glassMat.color.clone();
    var nightGlass = new THREE.Color(0x27355e);

    function frameFn(now) {
      raf = requestAnimationFrame(frameFn);
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now; clockT += dt;

      nightT += ((night ? 1 : 0) - nightT) * Math.min(1, dt * 4);
      hemi.intensity = 0.6 - 0.44 * nightT;
      sun.intensity = 0.82 - 0.72 * nightT;
      lampLight.intensity = 1.7 * nightT;
      shade.material.emissiveIntensity = 0.12 + 1.1 * nightT;
      glassMat.color.copy(baseCol).lerp(nightGlass, nightT);

      // camera: base angle + gentle parallax; zoom while leaving
      var zoom = 1, tx = look.x, ty = look.y, tz = look.z;
      if (leaving) {
        var p = Math.min((now - leaving.t0) / 650, 1), e = p * p * (3 - 2 * p);
        zoom = 1 + 1.6 * e;
        tmp.copy(leaving.hot.anchor);
        tx += (tmp.x - look.x) * e * 0.8; ty += (tmp.y - 0.4 - look.y) * e * 0.8; tz += (tmp.z - look.z) * e * 0.8;
      }
      var par = reduced ? 0 : 1;
      var ang = Math.PI / 4 + mouse.x * 0.09 * par;
      camera.position.set(Math.sin(ang) * R + (tx - look.x), camH + mouse.y * 0.7 * par + (ty - look.y), Math.cos(ang) * R + (tz - look.z));
      camera.zoom = zoom;
      camera.lookAt(tx, ty, tz);
      camera.updateProjectionMatrix();

      // ambient motion
      if (!reduced) {
        leaves.rotation.z = Math.sin(clockT * 1.2) * 0.025;
        leaves.rotation.x = Math.cos(clockT * 0.9) * 0.02;
        tail.rotation.y = Math.sin(clockT * 2.2) * 0.45;
        catBody.scale.y = 1 + Math.sin(clockT * 2) * 0.012;
        head.rotation.y = Math.sin(clockT * 0.7) * 0.18;
        var since = clockT - meowAt;
        if (since < 0.6) { cat.position.y = Math.abs(Math.sin(since * 10)) * 0.25 * (1 - since / 0.6); head.rotation.x = -0.25 * (1 - since / 0.6); }
        else { cat.position.y = 0; head.rotation.x = 0; }
        leds.forEach(function (l, i) { l.material.emissiveIntensity = 0.5 + 0.9 * (Math.sin(clockT * (2 + i) + i * 2) > 0 ? 1 : 0.15); });
        ball.rotation.y = 0.5 + Math.sin(clockT * 0.8) * 0.15;
      }
      var d = new Date();
      mHand.rotation.z = -((d.getMinutes() + d.getSeconds() / 60) / 60) * Math.PI * 2;
      hHand.rotation.z = -(((d.getHours() % 12) + d.getMinutes() / 60) / 12) * Math.PI * 2;
      if (clockT - lastScreen > 0.9) { lastScreen = clockT; drawScreen(clockT); }

      // hover pop
      hots.forEach(function (h) {
        var target = h.hover ? 1.07 : 1;
        h.scale += (target - h.scale) * Math.min(1, dt * 12);
        h.group.scale.set(h.base.x * h.scale, h.base.y * h.scale, h.base.z * h.scale);
        var k = h.scale > 1.001 ? (h.scale - 1) / 0.07 : 0;
        h.mats.forEach(function (m) {
          m.m.emissive.copy(m.e).lerp(new THREE.Color(h.def.color), 0.35 * k);
          m.m.emissiveIntensity = m.i + 0.4 * k;
        });
        h.tag.classList.toggle('on', h.hover);
      });

      renderer.render(scene, camera);

      // place tags
      var w = stage.clientWidth, hgt = stage.clientHeight;
      hots.forEach(function (h) {
        tmp.copy(h.anchor).project(camera);
        var x = (tmp.x * 0.5 + 0.5) * w, y = (-tmp.y * 0.5 + 0.5) * hgt;
        var o = h.def.off || [0, 0], k = compact ? 0.5 : 1;
        h.tag.style.transform = 'translate(' + (x + o[0] * k).toFixed(1) + 'px,' + (y + o[1] * k).toFixed(1) + 'px) translate(-50%,-100%)';
        h.tag.style.visibility = (tmp.z > 1 || x < -50 || x > w + 50) ? 'hidden' : 'visible';
      });
    }

    return {
      resume: function () { if (running) return; running = true; last = performance.now(); resize(); raf = requestAnimationFrame(frameFn); },
      pause: function () { running = false; cancelAnimationFrame(raf); }
    };
  }
})();
