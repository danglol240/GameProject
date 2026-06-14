import { seededRand } from '../constants.js';
import { buildPlatform, buildBackground } from './objects/Platform.js';
import { buildPlate } from './objects/Plate.js';
import { buildButton } from './objects/Button.js';
import { buildDoor } from './objects/Door.js';
import { buildMover } from './objects/Mover.js';
import { buildGoalFlag } from './objects/GoalFlag.js';

var THREE = window.THREE;

export function buildLevel(scene, levelGroup, levelData, idx) {
  var L = levelData, T = L.theme;
  var rnd = seededRand(1234 + idx * 777);

  scene.background = new THREE.Color(T.sky);
  scene.fog = new THREE.Fog(T.fog, 26, 62);

  var solids = [];
  L.platforms.forEach(function (p) {
    solids.push(buildPlatform(levelGroup, p, T, rnd));
  });
  buildBackground(levelGroup, T, rnd);

  var plates  = L.plates.map(function (def) { return buildPlate(levelGroup, def, T); });
  var buttons = L.buttons.map(function (def) { return buildButton(levelGroup, def); });
  var doors   = L.doors.map(function (def) {
    var dr = buildDoor(levelGroup, def, T);
    solids.push(dr.solid);
    return dr;
  });
  var movers  = L.movers.map(function (def) {
    var mv = buildMover(levelGroup, def, T);
    solids.push(mv.solid);
    return mv;
  });

  var goalMeshes = buildGoalFlag(levelGroup, L.goal);
  var spawnPts   = L.spawns.map(function (s) { return { x: s.x, y: s.y }; });

  return { plates, buttons, doors, movers, solids, goalMeshes, spawnPts };
}
