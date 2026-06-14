var THREE = window.THREE;

export function createLights(scene) {
  var hemi = new THREE.HemisphereLight(0xffffff, 0x445566, 0.95);
  scene.add(hemi);

  var sun = new THREE.DirectionalLight(0xffffff, 0.95);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -22; sun.shadow.camera.right = 22;
  sun.shadow.camera.top = 18;  sun.shadow.camera.bottom = -12;
  sun.shadow.camera.far = 60;
  scene.add(sun);
  scene.add(sun.target);

  return { hemi, sun };
}
