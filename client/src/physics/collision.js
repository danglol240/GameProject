import { HW, PH } from '../constants.js';

export function stepX(p, solids, dt) {
  p.x += p.vx * dt;
  solids.forEach(function (s) {
    var a = { x1: p.x - HW, x2: p.x + HW, y1: p.y + 0.02, y2: p.y + PH - 0.02 };
    if (a.x1 < s.x2 && a.x2 > s.x1 && a.y1 < s.y2 && a.y2 > s.y1) {
      var penR = a.x2 - s.x1, penL = s.x2 - a.x1;
      if (penR < penL) p.x = s.x1 - HW; else p.x = s.x2 + HW;
      p.vx = 0;
    }
  });
}

export function stepY(p, solids, dt) {
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
  return vyPrev;
}
