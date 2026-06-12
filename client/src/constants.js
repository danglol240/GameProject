// ---------- hằng số vật lý ----------
export var GRAV = 26, JUMP = 10.4, SPEED = 5.6, ACC = 46, AIRC = 0.72;
export var PW = 0.76, PH = 1.1, HW = PW / 2;
export var KILL_Y = -7;

export var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
export var approach = function (v, t, a) { return v < t ? Math.min(v + a, t) : Math.max(v - a, t); };

export function seededRand(seed) {
  var s = seed;
  return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}
