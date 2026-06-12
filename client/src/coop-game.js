import { GRAV, JUMP, SPEED, ACC, AIRC, PH, HW, KILL_Y, clamp, approach, seededRand } from './constants.js';
import { LEVELS, P_COLORS, P_NAMES } from './levels.js';
import { HUD_HTML } from './hud.js';
import { mat } from './three-helpers.js';

var THREE = window.THREE;

    class CoopGame extends HTMLElement {
      connectedCallback() {
        if (this._init) return; this._init = true;
        this.style.cssText = "display:block;width:100%;height:100%;position:relative;overflow:hidden;background:#0b0e1a;";
        this.boot();
      }

      boot() {
        var el = this;
        // renderer
        var renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        if (THREE.sRGBEncoding !== undefined) renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.domElement.style.cssText = "position:absolute;inset:0;display:block;";
        el.appendChild(renderer.domElement);
        this.renderer = renderer;

        // HUD
        var hudWrap = document.createElement("div");
        hudWrap.innerHTML = HUD_HTML;
        el.appendChild(hudWrap);
        this.ui = {
          lvl: hudWrap.querySelector("#cgLvl"), lvlName: hudWrap.querySelector("#cgLvlName"),
          time: hudWrap.querySelector("#cgTime"), deaths: hudWrap.querySelector("#cgDeaths"),
          toast: hudWrap.querySelector("#cgToast"), timer: hudWrap.querySelector("#cgTimer"),
          intro: hudWrap.querySelector("#cgIntro"), next: hudWrap.querySelector("#cgNext"),
          nextTitle: hudWrap.querySelector("#cgNextTitle"), nextSub: hudWrap.querySelector("#cgNextSub"),
          final: hudWrap.querySelector("#cgFinal"), finalStats: hudWrap.querySelector("#cgFinalStats")
        };

        // scene & camera
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(50, 16 / 9, 0.1, 200);
        this.camPos = new THREE.Vector3(0, 5, 14);
        this.camTgt = new THREE.Vector3(0, 1, 0);

        this.hemi = new THREE.HemisphereLight(0xffffff, 0x445566, 0.95);
        this.scene.add(this.hemi);
        this.sun = new THREE.DirectionalLight(0xffffff, 0.95);
        this.sun.castShadow = true;
        this.sun.shadow.mapSize.set(2048, 2048);
        this.sun.shadow.camera.left = -22; this.sun.shadow.camera.right = 22;
        this.sun.shadow.camera.top = 18; this.sun.shadow.camera.bottom = -12;
        this.sun.shadow.camera.far = 60;
        this.scene.add(this.sun); this.scene.add(this.sun.target);

        // người chơi
        this.players = [this.makePlayer(0), this.makePlayer(1)];
        var self = this;
        this.players.forEach(function (p) { self.scene.add(p.mesh); });

        // hạt bụi / pháo giấy
        this.dust = []; this.confetti = [];
        this.ambient = this.makeAmbient();
        this.scene.add(this.ambient.points);

        // input
        this.keys = {};
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        window.addEventListener("keydown", this.onKeyDown);
        window.addEventListener("keyup", this.onKeyUp);

        // resize
        var ro = new ResizeObserver(function () { self.resize(); });
        ro.observe(el);
        this.resize();

        // trạng thái
        this.state = "intro";
        this.levelIdx = 0; this.time = 0; this.deaths = 0;
        this.toastTimer = 0;
        this.loadLevel(0);

        var clock = new THREE.Clock();
        var loop = function () {
          requestAnimationFrame(loop);
          var dt = Math.min(clock.getDelta(), 1 / 30);
          self.update(dt);
          self.renderer.render(self.scene, self.camera);
        };
        loop();
      }

      resize() {
        var w = this.clientWidth || 800, h = this.clientHeight || 450;
        this.renderer.setSize(w, h);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
      }

      // ---------- nhân vật ----------
      makePlayer(i) {
        var color = P_COLORS[i];
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
          idx: i, color: color, mesh: g, body: body, pupils: [pupL, pupR],
          x: 0, y: 0, vx: 0, vy: 0, face: 1, onGround: false, groundRef: null,
          coyote: 0, jumpBuf: 0, squash: 1, frameDx: 0, wasGround: false,
          aabb: { x1: 0, x2: 0, y1: 0, y2: 0, isPlayer: true, owner: null }
        };
      }

      // ---------- particle ----------
      makeAmbient() {
        var n = 90, pos = new Float32Array(n * 3), seeds = [];
        for (var i = 0; i < n; i++) {
          pos[i * 3] = Math.random() * 50 - 10;
          pos[i * 3 + 1] = Math.random() * 12 - 2;
          pos[i * 3 + 2] = Math.random() * 14 - 9;
          seeds.push(Math.random() * Math.PI * 2);
        }
        var geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        var pm = new THREE.PointsMaterial({ color: 0xffffff, size: 0.09, transparent: true, opacity: 0.55, depthWrite: false });
        return { points: new THREE.Points(geo, pm), seeds: seeds, n: n };
      }

      spawnDust(x, y, n, color) {
        for (var i = 0; i < n; i++) {
          var m = new THREE.Mesh(new THREE.SphereGeometry(0.08 + Math.random() * 0.07, 6, 6),
            mat(color || 0xffffff, { rough: 1 }));
          m.material.transparent = true;
          m.position.set(x + (Math.random() - 0.5) * 0.5, y + 0.06, (Math.random() - 0.5) * 0.4);
          this.scene.add(m);
          this.dust.push({ m: m, vx: (Math.random() - 0.5) * 2.4, vy: Math.random() * 1.8 + 0.4, life: 0.55 + Math.random() * 0.25, t: 0 });
        }
      }

      spawnConfetti(x, y) {
        var colors = [0xff7a4d, 0x4da8ff, 0xffd166, 0x2ec4b6, 0xff6b9d, 0x845ef7];
        for (var i = 0; i < 90; i++) {
          var m = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.02),
            mat(colors[i % colors.length], { rough: 0.5, emissive: colors[i % colors.length], ei: 0.25 }));
          m.position.set(x + (Math.random() - 0.5) * 2, y + 2 + Math.random() * 2, (Math.random() - 0.5) * 2);
          m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
          this.scene.add(m);
          this.confetti.push({
            m: m, vx: (Math.random() - 0.5) * 5, vy: Math.random() * 7 + 3, vz: (Math.random() - 0.5) * 3,
            rx: (Math.random() - 0.5) * 8, rz: (Math.random() - 0.5) * 8, t: 0, life: 3.2
          });
        }
      }

      // ---------- dựng màn chơi ----------
      loadLevel(idx) {
        var self = this;
        this.levelIdx = idx;
        var L = LEVELS[idx], T = L.theme;
        if (this.levelGroup) { this.scene.remove(this.levelGroup); }
        var grp = new THREE.Group();
        this.levelGroup = grp;
        this.scene.add(grp);

        this.scene.background = new THREE.Color(T.sky);
        this.scene.fog = new THREE.Fog(T.fog, 26, 62);
        this.hemi.color.set(T.hemi);
        this.ambient.points.material.opacity = idx === 2 ? 0.85 : 0.5;

        this.solids = [];
        var rnd = seededRand(1234 + idx * 777);

        // nền đất
        L.platforms.forEach(function (p) {
          var th = p.th || 8, w = p.x2 - p.x1, d = 4.6;
          var topMat = mat(T.plat), sideMat = mat(T.side);
          var box = new THREE.Mesh(new THREE.BoxGeometry(w, th, d),
            [sideMat, sideMat, topMat, sideMat, sideMat, sideMat]);
          box.position.set((p.x1 + p.x2) / 2, p.top - th / 2, 0);
          box.receiveShadow = true; box.castShadow = true;
          grp.add(box);
          self.solids.push({ x1: p.x1, x2: p.x2, y1: p.top - th, y2: p.top });
          // cây trang trí phía sau
          var trees = Math.floor(w / 5);
          for (var t = 0; t < trees; t++) {
            var tx = p.x1 + 1 + rnd() * (w - 2), scale = 0.7 + rnd() * 0.7;
            var trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09 * scale, 0.12 * scale, 0.6 * scale, 8), mat(0x8a5a3b));
            trunk.position.set(tx, p.top + 0.3 * scale, -1.6);
            var leafC = [T.accent, T.accent2, T.plat][Math.floor(rnd() * 3)];
            var leaf = new THREE.Mesh(new THREE.ConeGeometry(0.45 * scale, 0.9 * scale, 8), mat(leafC));
            leaf.position.set(tx, p.top + (0.6 + 0.45) * scale, -1.6);
            trunk.castShadow = leaf.castShadow = true;
            grp.add(trunk); grp.add(leaf);
          }
        });

        // đồi nền phía xa
        for (var hIdx = 0; hIdx < 9; hIdx++) {
          var hx = -8 + hIdx * 6 + rnd() * 3;
          var hh = 2.5 + rnd() * 4, hw = 4 + rnd() * 4;
          var hill = new THREE.Mesh(new THREE.BoxGeometry(hw, hh, 3), mat(T.side, { rough: 1 }));
          hill.position.set(hx, hh / 2 - 2.5, -10 - rnd() * 5);
          grp.add(hill);
        }
        // mây
        for (var cIdx = 0; cIdx < 6; cIdx++) {
          var cl = new THREE.Group();
          for (var s = 0; s < 3; s++) {
            var puff = new THREE.Mesh(new THREE.SphereGeometry(0.7 + rnd() * 0.5, 10, 10), mat(0xffffff, { rough: 1 }));
            puff.position.set(s * 0.9 - 0.9, rnd() * 0.3, 0);
            puff.scale.y = 0.6;
            cl.add(puff);
          }
          cl.position.set(-6 + cIdx * 8 + rnd() * 4, 6.5 + rnd() * 4, -8 - rnd() * 5);
          grp.add(cl);
        }

        // nút tròn (giữ)
        this.plates = L.plates.map(function (def) {
          var base = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.62, 0.1, 20), mat(0x2b3044));
          base.position.set(def.x, def.y + 0.05, 0);
          var cap = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.46, 0.16, 20),
            mat(T.accent, { emissive: T.accent, ei: 0.25 }));
          cap.position.set(def.x, def.y + 0.16, 0);
          cap.castShadow = true;
          grp.add(base); grp.add(cap);
          return { def: def, cap: cap, pressed: false, press: 0 };
        });

        // nút bấm (giữ vĩnh viễn)
        this.buttons = L.buttons.map(function (def) {
          var ped = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.5), mat(0x2b3044));
          ped.position.set(def.x, def.y + 0.275, 0); ped.castShadow = true;
          var orb = new THREE.Mesh(new THREE.SphereGeometry(0.21, 14, 14),
            mat(0xff5470, { emissive: 0xff5470, ei: 0.6, rough: 0.4 }));
          orb.position.set(def.x, def.y + 0.72, 0); orb.castShadow = true;
          grp.add(ped); grp.add(orb);
          return { def: def, orb: orb };
        });
        this.latched = {};

        // cửa
        this.doors = L.doors.map(function (def) {
          var m = new THREE.Mesh(new THREE.BoxGeometry(def.w, def.h, 2.8),
            mat(T.accent2, { emissive: T.accent2, ei: 0.12, rough: 0.55 }));
          m.castShadow = true;
          grp.add(m);
          var solid = { x1: def.x - def.w / 2, x2: def.x + def.w / 2, y1: def.base, y2: def.base + def.h };
          self.solids.push(solid);
          return { def: def, mesh: m, open: 0, solid: solid };
        });
        this.timers = {};

        // bệ di chuyển
        this.movers = L.movers.map(function (def) {
          var m = new THREE.Mesh(new THREE.BoxGeometry(def.w, 0.5, 3.6),
            mat(T.accent, { emissive: T.accent, ei: 0.1, rough: 0.6 }));
          m.castShadow = true; m.receiveShadow = true;
          grp.add(m);
          var solid = { x1: 0, x2: 0, y1: 0, y2: 0, isMover: true, dx: 0, dy: 0 };
          self.solids.push(solid);
          return { def: def, mesh: m, solid: solid, lastX: null, lastY: null };
        });

        // cờ đích
        var goal = L.goal;
        var pad = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.55, 0.18, 28),
          mat(0xffd166, { emissive: 0xffd166, ei: 0.3, rough: 0.5 }));
        pad.position.set(goal.x, goal.y + 0.09, 0); pad.receiveShadow = true;
        var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.1, 10), mat(0xf2f2f2, { rough: 0.4 }));
        pole.position.set(goal.x, goal.y + 1.55, 0); pole.castShadow = true;
        var flag = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.62, 0.04),
          mat(0xff5470, { emissive: 0xff5470, ei: 0.3 }));
        flag.position.set(goal.x + 0.58, goal.y + 2.7, 0); flag.castShadow = true;
        grp.add(pad); grp.add(pole); grp.add(flag);
        this.goalMeshes = { pad: pad, flag: flag };

        // người chơi về điểm xuất phát
        this.spawnPts = L.spawns.map(function (s) { return { x: s.x, y: s.y }; });
        this.checkpointsHit = [];
        this.resetPlayers(true);

        // camera nhảy thẳng tới vị trí
        var mid = (this.players[0].x + this.players[1].x) / 2;
        this.camPos.set(mid, 5, 14);
        this.camTgt.set(mid, 1, 0);

        // HUD
        this.ui.lvl.textContent = "MÀN " + (idx + 1) + "/" + LEVELS.length;
        this.ui.lvlName.textContent = L.name;
        this.showToast(L.hint, 5);
        this.celebrated = false;
      }

      resetPlayers(hard) {
        var self = this;
        this.players.forEach(function (p, i) {
          p.x = self.spawnPts[i].x; p.y = self.spawnPts[i].y;
          p.vx = 0; p.vy = 0; p.onGround = true; p.groundRef = null; p.squash = 1;
        });
      }

      showToast(msg, secs) {
        this.ui.toast.textContent = msg;
        this.ui.toast.style.opacity = 1;
        this.toastTimer = secs || 3;
      }

      // ---------- input ----------
      onKeyDown(e) {
        var c = e.code;
        if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].indexOf(c) >= 0) e.preventDefault();
        this.keys[c] = true;
        if (c === "KeyW" || c === "Space") this.players[0].jumpBuf = 0.13;
        if (c === "ArrowUp") this.players[1].jumpBuf = 0.13;
        if (c === "Enter") this.advance();
        if (c === "KeyR" && this.state === "play") { this.loadLevel(this.levelIdx); }
      }
      onKeyUp(e) { this.keys[e.code] = false; }

      advance() {
        if (this.state === "intro") {
          this.ui.intro.classList.remove("on");
          this.state = "play"; this.time = 0; this.deaths = 0;
          this.ui.deaths.textContent = "0";
        } else if (this.state === "next") {
          this.ui.next.classList.remove("on");
          this.loadLevel(this.levelIdx + 1);
          this.state = "play";
        } else if (this.state === "final") {
          this.ui.final.classList.remove("on");
          this.time = 0; this.deaths = 0;
          this.ui.deaths.textContent = "0";
          this.loadLevel(0);
          this.state = "play";
        }
      }

      // ---------- vòng lặp ----------
      update(dt) {
        var t = performance.now() / 1000;

        // bệ di chuyển luôn chạy (kể cả overlay) để nhìn sống động
        var self = this;
        this.movers.forEach(function (mv) {
          var d = mv.def;
          var px = d.x + d.ax * Math.sin((t + d.phase) * Math.PI * 2 / d.period);
          var py = d.y + d.ay * Math.sin((t + d.phase) * Math.PI * 2 / d.period);
          mv.solid.dx = mv.lastX == null ? 0 : px - mv.lastX;
          mv.solid.dy = mv.lastY == null ? 0 : py - mv.lastY;
          mv.lastX = px; mv.lastY = py;
          mv.solid.x1 = px - d.w / 2; mv.solid.x2 = px + d.w / 2;
          mv.solid.y2 = py; mv.solid.y1 = py - 0.5;
          mv.mesh.position.set(px, py - 0.25, 0);
        });

        if (this.state === "play") {
          this.time += dt;
          this.stepGame(dt, t);
        }

        // hiệu ứng hạt
        this.updateParticles(dt, t);

        // camera đi theo
        var p0 = this.players[0], p1 = this.players[1];
        var midX = (p0.x + p1.x) / 2, midY = (p0.y + p1.y) / 2;
        var sep = Math.abs(p0.x - p1.x) + Math.abs(p0.y - p1.y) * 0.7;
        var dist = clamp(8 + sep * 0.55, 10.5, 18);
        var k = 1 - Math.pow(0.0015, dt);
        this.camPos.x += (midX - this.camPos.x) * k;
        this.camPos.y += (midY + 4.0 - this.camPos.y) * k;
        this.camPos.z += (dist - this.camPos.z) * k;
        this.camTgt.x += (midX - this.camTgt.x) * k;
        this.camTgt.y += (midY + 1.1 - this.camTgt.y) * k;
        this.camera.position.copy(this.camPos);
        this.camera.lookAt(this.camTgt);
        this.sun.position.set(midX + 9, 15, 11);
        this.sun.target.position.set(midX, 0, 0);

        // cờ bay
        if (this.goalMeshes) {
          this.goalMeshes.flag.rotation.y = Math.sin(t * 3) * 0.25;
          var pulse = 0.3 + 0.2 * Math.sin(t * 4);
          this.goalMeshes.pad.material.emissiveIntensity = pulse;
        }

        // HUD thời gian
        if (this.state === "play") {
          var m = Math.floor(this.time / 60), s = Math.floor(this.time % 60);
          this.ui.time.textContent = m + ":" + (s < 10 ? "0" : "") + s;
        }
        if (this.toastTimer > 0) {
          this.toastTimer -= dt;
          if (this.toastTimer <= 0) this.ui.toast.style.opacity = 0;
        }
      }

      stepGame(dt, t) {
        var self = this;
        var L = LEVELS[this.levelIdx];
        var p0 = this.players[0], p1 = this.players[1];

        // input của từng người
        var inputs = [
          { left: this.keys.KeyA ? 1 : 0, right: this.keys.KeyD ? 1 : 0 },
          { left: this.keys.ArrowLeft ? 1 : 0, right: this.keys.ArrowRight ? 1 : 0 }
        ];

        // cập nhật AABB người chơi để làm vật cản lẫn nhau
        this.players.forEach(function (p) {
          p.aabb.x1 = p.x - HW; p.aabb.x2 = p.x + HW;
          p.aabb.y1 = p.y; p.aabb.y2 = p.y + PH;
          p.aabb.owner = p;
        });

        this.players.forEach(function (p, i) {
          var inp = inputs[i];
          var other = self.players[1 - i];
          var prevX = p.x;

          var target = (inp.right - inp.left) * SPEED;
          var acc = (p.onGround ? ACC : ACC * AIRC) * dt;
          p.vx = approach(p.vx, target, acc);
          if (target > 0.1) p.face = 1; else if (target < -0.1) p.face = -1;

          // được bệ / đồng đội cõng đi
          if (p.groundRef && p.groundRef.isMover) { p.x += p.groundRef.dx; p.y += p.groundRef.dy; }
          if (p.groundRef && p.groundRef.isPlayer) { p.x += p.groundRef.owner.frameDx; }

          // nhảy
          p.coyote = p.onGround ? 0.1 : p.coyote - dt;
          if (p.jumpBuf > 0 && p.coyote > 0) {
            p.vy = JUMP; p.onGround = false; p.coyote = 0; p.jumpBuf = 0;
            p.squash = 1.28;
            self.spawnDust(p.x, p.y, 5);
          }
          p.jumpBuf -= dt;

          p.vy -= GRAV * dt;
          p.vy = Math.max(p.vy, -23);

          var solids = self.solids.filter(function (s) {
            if (s.isDoorOpen) return false;
            return true;
          });
          solids = solids.concat([other.aabb]);

          // trục X
          p.x += p.vx * dt;
          solids.forEach(function (s) {
            var a = { x1: p.x - HW, x2: p.x + HW, y1: p.y + 0.02, y2: p.y + PH - 0.02 };
            if (a.x1 < s.x2 && a.x2 > s.x1 && a.y1 < s.y2 && a.y2 > s.y1) {
              var penR = a.x2 - s.x1, penL = s.x2 - a.x1;
              if (penR < penL) p.x = s.x1 - HW; else p.x = s.x2 + HW;
              p.vx = 0;
            }
          });

          // trục Y
          var vyPrev = p.vy;
          p.y += p.vy * dt;
          p.wasGround = p.onGround;
          p.onGround = false; p.groundRef = null;
          solids.forEach(function (s) {
            var a = { x1: p.x - HW + 0.04, x2: p.x + HW - 0.04, y1: p.y, y2: p.y + PH };
            if (a.x1 < s.x2 && a.x2 > s.x1 && a.y1 < s.y2 && a.y2 > s.y1) {
              var penU = a.y2 - s.y1, penD = s.y2 - a.y1;
              if (penD < penU) {
                p.y = s.y2; if (p.vy < 0) p.vy = 0;
                p.onGround = true; p.groundRef = s;
              } else {
                p.y = s.y1 - PH; if (p.vy > 0) p.vy = 0;
              }
            }
          });

          // tiếp đất
          if (!p.wasGround && p.onGround && vyPrev < -7) {
            p.squash = 0.62;
            self.spawnDust(p.x, p.y, 7);
          }

          // rơi xuống vực
          if (p.y < KILL_Y) {
            self.deaths++;
            self.ui.deaths.textContent = self.deaths;
            self.spawnDust(p.x, KILL_Y + 2, 10, p.color);
            p.x = self.spawnPts[i].x; p.y = self.spawnPts[i].y + 0.1;
            p.vx = 0; p.vy = 0; p.squash = 1.3;
            self.showToast(P_NAMES[i] === "CAM" ? "CAM ngã rồi! Cố lên!" : "LAM ngã rồi! Cố lên!", 1.6);
          }

          p.frameDx = p.x - prevX;

          // cập nhật mesh
          p.squash += (1 - p.squash) * Math.min(1, dt * 9);
          p.mesh.position.set(p.x, p.y, 0);
          var sq = p.squash;
          p.body.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
          p.body.rotation.z = clamp(-p.vx * 0.035, -0.25, 0.25);
          p.pupils.forEach(function (pp, pi) {
            var bx = pi === 0 ? -0.14 : 0.14;
            pp.position.x += (bx + p.face * 0.05 - pp.position.x) * 0.2;
          });
        });

        // nút tròn
        var plateState = {};
        this.plates.forEach(function (pl) {
          var d = pl.def;
          var pressed = self.players.some(function (p) {
            return Math.abs(p.x - d.x) < 0.62 && p.y > d.y - 0.3 && p.y < d.y + 0.35;
          });
          pl.pressed = pressed;
          plateState[d.id] = pressed;
          pl.press += ((pressed ? 1 : 0) - pl.press) * Math.min(1, dt * 14);
          pl.cap.position.y = d.y + 0.16 - pl.press * 0.09;
          pl.cap.material.emissiveIntensity = 0.25 + pl.press * 0.8;
        });

        // nút bấm chốt
        this.buttons.forEach(function (b) {
          var d = b.def;
          if (self.latched[d.id]) return;
          var hit = self.players.some(function (p) {
            return Math.abs(p.x - d.x) < 0.72 && p.y < d.y + 1.0 && p.y + PH > d.y + 0.2;
          });
          if (hit) {
            self.latched[d.id] = true;
            b.orb.material.color.set(0x3ddc84);
            b.orb.material.emissive.set(0x3ddc84);
            self.spawnDust(d.x, d.y + 0.7, 8, 0x3ddc84);
            self.showToast("Đã kích hoạt! Cửa mở vĩnh viễn.", 2);
          }
        });

        // cửa
        var st = { plates: plateState, latched: this.latched, timers: this.timers };
        var timedActive = null;
        this.doors.forEach(function (dr) {
          var d = dr.def, targetOpen = 0;
          if (d.when) {
            targetOpen = d.when(st) ? 1 : 0;
          } else {
            if (d.trigger(st)) self.timers[d.id] = d.duration;
            else if (self.timers[d.id] > 0) {
              self.timers[d.id] -= dt;
              if (self.timers[d.id] > 0) timedActive = self.timers[d.id];
            }
            targetOpen = (self.timers[d.id] || 0) > 0 ? 1 : 0;
          }
          dr.open = approach(dr.open, targetOpen, dt * 1.6);
          var y1 = d.base - dr.open * d.h;
          dr.solid.x1 = d.x - d.w / 2; dr.solid.x2 = d.x + d.w / 2;
          dr.solid.y1 = y1; dr.solid.y2 = y1 + d.h;
          dr.solid.isDoorOpen = dr.open > 0.92;
          dr.mesh.position.set(d.x, y1 + d.h / 2, 0);
          // cửa hẹn giờ nhấp nháy khi sắp đóng
          if (!d.when && (self.timers[d.id] || 0) > 0 && self.timers[d.id] < 1.5) {
            dr.mesh.material.emissiveIntensity = 0.2 + 0.5 * Math.abs(Math.sin(t * 10));
          } else dr.mesh.material.emissiveIntensity = 0.12;
        });
        if (timedActive != null) {
          this.ui.timer.style.opacity = 1;
          this.ui.timer.textContent = "CỬA ĐÓNG SAU " + timedActive.toFixed(1) + "s — CHẠY!";
        } else this.ui.timer.style.opacity = 0;

        // checkpoint
        L.checkpoints.forEach(function (cp, ci) {
          if (self.checkpointsHit[ci]) return;
          var both = self.players.every(function (p) {
            return p.x > cp.x1 && p.x < cp.x2 && Math.abs(p.y - cp.top) < 0.6 && p.onGround;
          });
          if (both) {
            self.checkpointsHit[ci] = true;
            self.spawnPts = cp.spawns.map(function (s) { return { x: s.x, y: s.y }; });
            self.showToast("Đã lưu điểm hồi sinh!", 2);
          }
        });

        // đích
        var g = L.goal;
        var bothAtGoal = this.players.every(function (p) {
          return Math.abs(p.x - g.x) < 1.5 && Math.abs(p.y - g.y) < 0.6 && p.onGround;
        });
        if (bothAtGoal && !this.celebrated) {
          this.celebrated = true;
          this.state = "celebrate";
          this.spawnConfetti(g.x, g.y);
          var isLast = this.levelIdx === LEVELS.length - 1;
          setTimeout(function () {
            if (isLast) {
              var m = Math.floor(self.time / 60), s2 = Math.floor(self.time % 60);
              self.ui.finalStats.textContent = "Thời gian: " + m + ":" + (s2 < 10 ? "0" : "") + s2 + " · Số lần ngã: " + self.deaths;
              self.ui.final.classList.add("on");
              self.state = "final";
            } else {
              self.ui.nextTitle.textContent = "MÀN " + (self.levelIdx + 1) + " HOÀN THÀNH!";
              self.ui.nextSub.textContent = "Tiếp theo: " + LEVELS[self.levelIdx + 1].name;
              self.ui.next.classList.add("on");
              self.state = "next";
            }
          }, 1500);
        }
      }

      updateParticles(dt, t) {
        var self = this;
        // bụi
        for (var i = this.dust.length - 1; i >= 0; i--) {
          var d = this.dust[i];
          d.t += dt;
          if (d.t > d.life) { this.scene.remove(d.m); d.m.geometry.dispose(); d.m.material.dispose(); this.dust.splice(i, 1); continue; }
          d.m.position.x += d.vx * dt;
          d.m.position.y += d.vy * dt;
          d.vy -= 3 * dt;
          var f = 1 - d.t / d.life;
          d.m.material.opacity = f;
          d.m.scale.setScalar(0.5 + f * 0.6);
        }
        // pháo giấy
        for (var j = this.confetti.length - 1; j >= 0; j--) {
          var c = this.confetti[j];
          c.t += dt;
          if (c.t > c.life) { this.scene.remove(c.m); c.m.geometry.dispose(); c.m.material.dispose(); this.confetti.splice(j, 1); continue; }
          c.vy -= 9 * dt;
          c.m.position.x += c.vx * dt;
          c.m.position.y += c.vy * dt;
          c.m.position.z += c.vz * dt;
          c.m.rotation.x += c.rx * dt;
          c.m.rotation.z += c.rz * dt;
        }
        // hạt lơ lửng
        var pos = this.ambient.points.geometry.attributes.position;
        for (var k = 0; k < this.ambient.n; k++) {
          pos.array[k * 3 + 1] += Math.sin(t * 0.6 + this.ambient.seeds[k]) * 0.0035;
          pos.array[k * 3] += 0.004;
          if (pos.array[k * 3] > this.camPos.x + 28) pos.array[k * 3] = this.camPos.x - 28;
        }
        pos.needsUpdate = true;
      }
    }

export function defineCoopGame() {
  if (customElements.get("coop-game")) return;
  if (window.THREE) {
    customElements.define("coop-game", CoopGame);
  } else {
    setTimeout(defineCoopGame, 60);
  }
}
