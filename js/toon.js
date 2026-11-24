import * as THREE from 'three';

// Soft 3-step toon shading for a cute, cartoony look.
const grad = (() => {
  const d = new Uint8Array([120, 195, 255]);
  const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();

const cache = new Map();
export function toon(color, extra) {
  if (!extra) {
    const k = String(color);
    if (!cache.has(k)) cache.set(k, new THREE.MeshToonMaterial({ color, gradientMap: grad }));
    return cache.get(k);
  }
  return new THREE.MeshToonMaterial({ color, gradientMap: grad, ...extra });
}

const basicCache = new Map();
export function basic(color) {
  const k = String(color);
  if (!basicCache.has(k)) basicCache.set(k, new THREE.MeshBasicMaterial({ color }));
  return basicCache.get(k);
}

export const OUTLINE = new THREE.MeshBasicMaterial({ color: 0x4a3046, side: THREE.BackSide });

export function mesh(geo, color, opts = {}) {
  const mat = color && color.isMaterial ? color : toon(color);
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = opts.shadow !== false;
  m.receiveShadow = !!opts.receive;
  if (opts.outline) addOutline(m, opts.outline);
  return m;
}

export function addOutline(m, factor = 1.06) {
  const o = new THREE.Mesh(m.geometry, OUTLINE);
  o.scale.setScalar(factor);
  o.castShadow = false;
  m.add(o);
  return o;
}

export const sphere = (r, w = 24, h = 16) => new THREE.SphereGeometry(r, w, h);
