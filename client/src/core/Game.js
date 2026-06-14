import { GRAV, JUMP, SPEED, ACC, AIRC, PH, HW, KILL_Y, approach } from '../constants.js';
import { LEVELS, P_COLORS, P_NAMES } from '../world/levels.js';
import { HUD_HTML } from '../ui/HUD.js';
import { createRenderer, resizeRenderer } from '../graphics/Renderer.js';
import { createLights } from '../graphics/Lights.js';
import { createCamera, snapCamera, updateCamera } from '../graphics/Camera.js';
import { DustSystem } from '../graphics/particles/DustSystem.js';
import { AmbientParticles } from '../graphics/particles/AmbientParticles.js';
import { Input } from './Input.js';
import { makePlayer, updatePlayerMesh } from '../entities/Player.js';
import { buildLevel } from '../world/LevelBuilder.js';
import { updatePlate } from '../world/objects/Plate.js';
import { updateDoor } from '../world/objects/Door.js';
import { updateMover } from '../world/objects/Mover.js';
import { updateGoalFlag } from '../world/objects/GoalFlag.js';
import { stepX, stepY } from '../physics/collision.js';

var THREE = window.THREE;

class CoopGame extends HTMLElement {
  connectedCallback() {
    if (this._init) return; this._init = true;
    this.style.cssText = 'display:block;width:100%;height:100%;position:relative;overflow:hidden;background:#0b0e1a;';
    this.boot();
  }

  boot() {
    this.renderer = createRenderer(this);

    var hudWrap = document.createElement('div');
    hudWrap.innerHTML = HUD_HTML;
    this.appendChild(hudWrap);
    this.ui = {
      lvl: hudWrap.querySelector('#cgLvl'), lvlName: hudWrap.querySelector('#cgLvlName'),
      time: hudWrap.querySelector('#cgTime'), deaths: hudWrap.querySelector('#cgDeaths'),
      toast: hudWrap.querySelector('#cgToast'), timer: hudWrap.querySelector('#cgTimer'),
      intro: hudWrap.querySelector('#cgIntro'), next: hudWrap.querySelector('#cgNext'),
      nextTitle: hudWrap.querySelector('#cgNextTitle'), nextSub: hudWrap.querySelector('#cgNextSub'),
      final: hudWrap.querySelector('#cgFinal'), finalStats: hudWrap.querySelector('#cgFinalStats')
    };

    this.scene = new THREE.Scene();
    this.cam = createCamera();
    this.camera = this.cam.camera;

    var lights = createLights(this.scene);
    this.hemi = lights.hemi;
    this.sun = lights.sun;

    this.players = [makePlayer(0, P_COLORS), makePlayer(1, P_COLORS)];
    var self = this;
    this.players.forEach(function (p) { self.scene.add(p.mesh); });

    this.particles = new DustSystem(this.scene);
    this.ambient = new AmbientParticles(this.scene);
    this.input = new Input();

    var ro = new ResizeObserver(function () { self.resize(); });
    ro.observe(this);
    this.resize();

    this.state = 'intro';
    this.levelIdx = 0; this.time = 0; this.deaths = 0; this.toastTimer = 0;
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
    resizeRenderer(this.renderer, this.camera, w, h);
  }

  loadLevel(idx) {
    this.levelIdx = idx;
    var L = LEVELS[idx];
    if (this.levelGroup) this.scene.remove(this.levelGroup);
    var grp = new THREE.Group();
    this.levelGroup = grp;
    this.scene.add(grp);

    this.hemi.color.set(L.theme.hemi);
    this.ambient.setOpacity(idx === 2 ? 0.85 : 0.5);

    var built = buildLevel(this.scene, grp, L, idx);
    this.solids     = built.solids;
    this.plates     = built.plates;
    this.buttons    = built.buttons;
    this.doors      = built.doors;
    this.movers     = built.movers;
    this.goalMeshes = built.goalMeshes;
    this.spawnPts   = built.spawnPts;
    this.latched = {}; this.timers = {}; this.checkpointsHit = [];

    this.resetPlayers();
    var mid = (this.players[0].x + this.players[1].x) / 2;
    snapCamera(this.cam, mid);

    this.ui.lvl.textContent = 'MÀN ' + (idx + 1) + '/' + LEVELS.length;
    this.ui.lvlName.textContent = L.name;
    this.showToast(L.hint, 5);
    this.celebrated = false;
  }

  resetPlayers() {
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

  advance() {
    if (this.state === 'intro') {
      this.ui.intro.classList.remove('on');
      this.state = 'play'; this.time = 0; this.deaths = 0;
      this.ui.deaths.textContent = '0';
    } else if (this.state === 'next') {
      this.ui.next.classList.remove('on');
      this.loadLevel(this.levelIdx + 1);
      this.state = 'play';
    } else if (this.state === 'final') {
      this.ui.final.classList.remove('on');
      this.time = 0; this.deaths = 0;
      this.ui.deaths.textContent = '0';
      this.loadLevel(0);
      this.state = 'play';
    }
  }

  update(dt) {
    var t = performance.now() / 1000;
    var self = this;

    this.movers.forEach(function (mv) { updateMover(mv, t); });

    var sig = this.input.consume();
    if (sig.advance) this.advance();
    if (sig.restart && this.state === 'play') this.loadLevel(this.levelIdx);

    if (this.state === 'play') {
      this.time += dt;
      this._stepGame(dt, t);
    }

    this.particles.update(dt);
    this.ambient.update(t, this.cam.pos.x);

    var midX = updateCamera(this.cam, this.players, dt);
    this.sun.position.set(midX + 9, 15, 11);
    this.sun.target.position.set(midX, 0, 0);

    updateGoalFlag(this.goalMeshes, t);

    if (this.state === 'play') {
      var m = Math.floor(this.time / 60), s = Math.floor(this.time % 60);
      this.ui.time.textContent = m + ':' + (s < 10 ? '0' : '') + s;
    }
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) this.ui.toast.style.opacity = 0;
    }
  }

  _stepGame(dt, t) {
    var self = this;
    var L = LEVELS[this.levelIdx];
    var inputs = [
      { left: this.input.keys.KeyA ? 1 : 0, right: this.input.keys.KeyD ? 1 : 0 },
      { left: this.input.keys.ArrowLeft ? 1 : 0, right: this.input.keys.ArrowRight ? 1 : 0 }
    ];

    this.players.forEach(function (p) {
      p.aabb.x1 = p.x - HW; p.aabb.x2 = p.x + HW;
      p.aabb.y1 = p.y; p.aabb.y2 = p.y + PH;
      p.aabb.owner = p;
    });

    this.players.forEach(function (p, i) {
      var inp = inputs[i], other = self.players[1 - i], prevX = p.x;

      var target = (inp.right - inp.left) * SPEED;
      var acc = (p.onGround ? ACC : ACC * AIRC) * dt;
      p.vx = approach(p.vx, target, acc);
      if (target > 0.1) p.face = 1; else if (target < -0.1) p.face = -1;

      if (p.groundRef && p.groundRef.isMover) { p.x += p.groundRef.dx; p.y += p.groundRef.dy; }
      if (p.groundRef && p.groundRef.isPlayer) { p.x += p.groundRef.owner.frameDx; }

      p.coyote = p.onGround ? 0.1 : p.coyote - dt;
      if (self.input.jumpBuf[i] > 0 && p.coyote > 0) {
        p.vy = JUMP; p.onGround = false; p.coyote = 0; self.input.jumpBuf[i] = 0;
        p.squash = 1.28;
        self.particles.spawnDust(p.x, p.y, 5);
      }
      self.input.jumpBuf[i] -= dt;

      p.vy -= GRAV * dt;
      p.vy = Math.max(p.vy, -23);

      var solids = self.solids.filter(function (s) { return !s.isDoorOpen; });
      solids = solids.concat([other.aabb]);

      stepX(p, solids, dt);
      var vyPrev = stepY(p, solids, dt);

      if (!p.wasGround && p.onGround && vyPrev < -7) {
        p.squash = 0.62;
        self.particles.spawnDust(p.x, p.y, 7);
      }

      if (p.y < KILL_Y) {
        self.deaths++; self.ui.deaths.textContent = self.deaths;
        self.particles.spawnDust(p.x, KILL_Y + 2, 10, p.color);
        p.x = self.spawnPts[i].x; p.y = self.spawnPts[i].y + 0.1;
        p.vx = 0; p.vy = 0; p.squash = 1.3;
        self.showToast(P_NAMES[i] === 'CAM' ? 'CAM ngã rồi! Cố lên!' : 'LAM ngã rồi! Cố lên!', 1.6);
      }

      p.frameDx = p.x - prevX;
      updatePlayerMesh(p, dt);
    });

    var plateState = {};
    this.plates.forEach(function (pl) {
      plateState[pl.def.id] = updatePlate(pl, self.players, dt);
    });

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
        self.particles.spawnDust(d.x, d.y + 0.7, 8, 0x3ddc84);
        self.showToast('Đã kích hoạt! Cửa mở vĩnh viễn.', 2);
      }
    });

    var st = { plates: plateState, latched: this.latched };
    var timedActive = null;
    this.doors.forEach(function (dr) {
      var remaining = updateDoor(dr, st, self.timers, dt, t);
      if (remaining > 0) timedActive = remaining;
    });
    if (timedActive != null) {
      this.ui.timer.style.opacity = 1;
      this.ui.timer.textContent = 'CỬA ĐÓNG SAU ' + timedActive.toFixed(1) + 's — CHẠY!';
    } else {
      this.ui.timer.style.opacity = 0;
    }

    L.checkpoints.forEach(function (cp, ci) {
      if (self.checkpointsHit[ci]) return;
      var both = self.players.every(function (p) {
        return p.x > cp.x1 && p.x < cp.x2 && Math.abs(p.y - cp.top) < 0.6 && p.onGround;
      });
      if (both) {
        self.checkpointsHit[ci] = true;
        self.spawnPts = cp.spawns.map(function (s) { return { x: s.x, y: s.y }; });
        self.showToast('Đã lưu điểm hồi sinh!', 2);
      }
    });

    var g = L.goal;
    var bothAtGoal = this.players.every(function (p) {
      return Math.abs(p.x - g.x) < 1.5 && Math.abs(p.y - g.y) < 0.6 && p.onGround;
    });
    if (bothAtGoal && !this.celebrated) {
      this.celebrated = true;
      this.state = 'celebrate';
      this.particles.spawnConfetti(g.x, g.y);
      var isLast = this.levelIdx === LEVELS.length - 1;
      var self2 = this;
      setTimeout(function () {
        if (isLast) {
          var mm = Math.floor(self2.time / 60), ss = Math.floor(self2.time % 60);
          self2.ui.finalStats.textContent = 'Thời gian: ' + mm + ':' + (ss < 10 ? '0' : '') + ss + ' · Số lần ngã: ' + self2.deaths;
          self2.ui.final.classList.add('on');
          self2.state = 'final';
        } else {
          self2.ui.nextTitle.textContent = 'MÀN ' + (self2.levelIdx + 1) + ' HOÀN THÀNH!';
          self2.ui.nextSub.textContent = 'Tiếp theo: ' + LEVELS[self2.levelIdx + 1].name;
          self2.ui.next.classList.add('on');
          self2.state = 'next';
        }
      }, 1500);
    }
  }
}

export function defineCoopGame() {
  if (customElements.get('coop-game')) return;
  if (window.THREE) {
    customElements.define('coop-game', CoopGame);
  } else {
    setTimeout(defineCoopGame, 60);
  }
}
