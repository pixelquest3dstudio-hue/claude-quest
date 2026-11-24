import * as THREE from 'three';
import { mesh, basic, sphere, toon } from './toon.js';

// ---------- shared cute bits ----------

export function makeEye(r, iris = 0x2b1d3a) {
  const g = new THREE.Group();
  const white = new THREE.Mesh(sphere(r), basic(0xffffff));
  white.scale.z = 0.55;
  const pupil = new THREE.Mesh(sphere(r * 0.78), basic(iris));
  pupil.position.z = r * 0.26;
  pupil.scale.set(1, 1.05, 0.5);
  const shine = new THREE.Mesh(sphere(r * 0.27, 12, 8), basic(0xffffff));
  shine.position.set(r * 0.25, r * 0.3, r * 0.62);
  const shine2 = new THREE.Mesh(sphere(r * 0.13, 10, 6), basic(0xffffff));
  shine2.position.set(-r * 0.24, -r * 0.28, r * 0.6);
  g.add(white, pupil, shine, shine2);
  return g;
}

const blushMat = new THREE.MeshBasicMaterial({ color: 0xff8fae, transparent: true, opacity: 0.55, depthWrite: false });

export function makeFace({ eyeR = 0.1, spacing = 0.14, iris = 0x2b1d3a, blush = true, mouth = true, mouthColor = 0x3a2230 } = {}) {
  const g = new THREE.Group();
  const l = makeEye(eyeR, iris);
  const r = makeEye(eyeR, iris);
  l.position.x = -spacing;
  r.position.x = spacing;
  g.add(l, r);
  if (blush) {
    for (const s of [-1, 1]) {
      const b = new THREE.Mesh(new THREE.CircleGeometry(eyeR * 0.55, 16), blushMat);
      b.scale.y = 0.6;
      b.position.set(s * (spacing + eyeR * 0.95), -eyeR * 1.15, eyeR * 0.1);
      g.add(b);
    }
  }
  if (mouth) {
    const m = new THREE.Mesh(new THREE.TorusGeometry(eyeR * 0.35, eyeR * 0.09, 6, 12, Math.PI), basic(mouthColor));
    m.rotation.z = Math.PI;
    m.position.set(0, -eyeR * 1.05, eyeR * 0.15);
    g.add(m);
    g.userData.mouth = m;
  }
  g.userData.eyes = [l, r];
  g.userData.seed = Math.random() * 10;
  return g;
}

export function blink(face, t) {
  if (!face) return;
  const ph = (t + face.userData.seed) % 3.7;
  const s = ph < 0.13 ? 0.12 : 1;
  for (const e of face.userData.eyes) e.scale.y = s;
}

// Rounded 5-point star geometry (used by Sparky and collectible stars)
const starGeoCache = new Map();
export function starGeometry(outer = 0.42, inner = 0.24, depth = 0.16, bevel = 0.08) {
  const k = [outer, inner, depth, bevel].join();
  if (starGeoCache.has(k)) return starGeoCache.get(k);
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    const rr = i % 2 ? inner : outer;
    const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
    i ? s.lineTo(x, y) : s.moveTo(x, y);
  }
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 4 });
  geo.center();
  starGeoCache.set(k, geo);
  return geo;
}

// ---------- The hero (girl or boy avatar) ----------

export function makeJesi(style = 'female') {
  const boy = style === 'male';
  const C = boy
    ? { skin: 0xf3c6a5, hair: 0x3a2620, top: 0x7fb4ff, skirt: 0x6b7bd6, shoe: 0x5fd3c6, pack: 0xffd166, tape: 0xff8fb1 }
    : { skin: 0xf3c6a5, hair: 0x4b2a22, top: 0xb79cf0, skirt: 0x7fd6c2, shoe: 0xff7fa8, pack: 0xffb3c7, tape: 0xffd166 };
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);

  const legs = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.12, 0.34, 0);
    const leg = mesh(new THREE.CapsuleGeometry(0.075, 0.16, 4, 8), C.skin);
    leg.position.y = -0.13;
    const shoe = mesh(sphere(0.1), C.shoe, { outline: 1.12 });
    shoe.scale.set(1, 0.7, 1.35);
    shoe.position.set(0, -0.28, 0.03);
    pivot.add(leg, shoe);
    if (boy) {
      const shortLeg = mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.16, 12), C.skirt);
      shortLeg.position.y = -0.04;
      pivot.add(shortLeg);
    }
    body.add(pivot);
    legs.push(pivot);
  }

  const skirt = boy
    ? mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.2, 20), C.skirt, { outline: 1.05 })
    : mesh(new THREE.CylinderGeometry(0.2, 0.37, 0.3, 20), C.skirt, { outline: 1.05 });
  skirt.position.y = boy ? 0.4 : 0.42;
  const torso = mesh(sphere(0.27), C.top, { outline: 1.06 });
  torso.scale.set(1, 1.05, 0.85);
  torso.position.y = 0.62;
  body.add(skirt, torso);

  const arms = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.28, 0.76, 0);
    const arm = mesh(new THREE.CapsuleGeometry(0.065, 0.18, 4, 8), C.top);
    arm.position.y = -0.13;
    const hand = mesh(sphere(0.075), C.skin);
    hand.position.y = -0.28;
    pivot.add(arm, hand);
    pivot.rotation.z = s * 0.25;
    body.add(pivot);
    arms.push(pivot);
  }

  // measuring-tape scarf (she's a tech designer!)
  const tape = mesh(new THREE.TorusGeometry(0.19, 0.035, 8, 24), C.tape);
  tape.rotation.x = Math.PI / 2;
  tape.position.y = 0.84;
  const tapeEnd = mesh(new THREE.BoxGeometry(0.07, 0.24, 0.02), C.tape);
  tapeEnd.position.set(0.1, 0.7, 0.2);
  tapeEnd.rotation.z = 0.2;
  body.add(tape, tapeEnd);

  // sketchbook backpack
  const pack = mesh(new THREE.BoxGeometry(0.34, 0.38, 0.13), C.pack, { outline: 1.06 });
  pack.position.set(0, 0.64, -0.27);
  const spiral = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.36, 8), 0xffffff);
  spiral.rotation.z = Math.PI / 2;
  spiral.position.set(0, 0.82, -0.27);
  body.add(pack, spiral);

  // head
  const head = new THREE.Group();
  head.position.y = 1.16;
  const skull = mesh(sphere(0.44, 32, 24), C.skin, { outline: 1.04 });
  skull.scale.set(1, 0.95, 0.95);
  const cap = mesh(new THREE.SphereGeometry(0.47, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.52), C.hair, { outline: 1.04 });
  cap.rotation.x = -0.42;
  cap.position.set(0, 0.03, -0.02);
  const back = mesh(sphere(boy ? 0.4 : 0.42), C.hair);
  back.position.set(0, boy ? 0.02 : -0.05, -0.14);
  if (boy) back.scale.set(1, 0.85, 1);
  head.add(skull, cap, back);
  if (boy) {
    // short spiky hair with a little cowlick
    for (const [x, y, z, rz, rx] of [[-0.22, 0.24, 0.3, 0.5, 0.9], [-0.07, 0.3, 0.34, 0.15, 1.0], [0.08, 0.3, 0.34, -0.15, 1.0], [0.23, 0.24, 0.3, -0.5, 0.9]]) {
      const spike = mesh(new THREE.ConeGeometry(0.09, 0.22, 8), C.hair);
      spike.position.set(x, y, z);
      spike.rotation.set(rx, 0, rz);
      head.add(spike);
    }
    const lick = mesh(new THREE.ConeGeometry(0.07, 0.26, 8), C.hair, { outline: 1.1 });
    lick.position.set(0.05, 0.52, 0.02);
    lick.rotation.z = -0.5;
    head.add(lick);
  } else {
    const bun = mesh(sphere(0.18), C.hair, { outline: 1.08 });
    bun.position.set(0, 0.46, -0.14);
    const scrunchie = mesh(new THREE.TorusGeometry(0.12, 0.045, 8, 16), C.shoe);
    scrunchie.position.set(0, 0.36, -0.12);
    scrunchie.rotation.x = Math.PI / 2 - 0.3;
    head.add(bun, scrunchie);
    for (const [x, y, z, s] of [[-0.2, 0.22, 0.31, 1], [0, 0.27, 0.35, 1.1], [0.2, 0.22, 0.31, 1]]) {
      const b = mesh(sphere(0.15), C.hair);
      b.scale.set(s, 0.55, 0.6);
      b.position.set(x, y, z);
      head.add(b);
    }
    const clip = mesh(starGeometry(0.09, 0.05, 0.03, 0.02), 0xffd166);
    clip.position.set(0.27, 0.27, 0.3);
    clip.rotation.y = 0.5;
    head.add(clip);
  }
  const face = makeFace({ eyeR: 0.1, spacing: 0.155, iris: 0x4a2a1a });
  face.position.set(0, -0.04, 0.38);
  head.add(face);
  body.add(head);

  return { root, body, legs, arms, head, face };
}

export function animateJesi(j, s, t, dt) {
  const { speed, grounded, vy, dashing } = s;
  const walk = grounded ? Math.min(speed / 6.5, 1) : 0;
  const ph = t * 13;
  j.legs[0].rotation.x = Math.sin(ph) * 0.8 * walk;
  j.legs[1].rotation.x = -Math.sin(ph) * 0.8 * walk;
  j.arms[0].rotation.x = -Math.sin(ph) * 0.7 * walk;
  j.arms[1].rotation.x = Math.sin(ph) * 0.7 * walk;
  if (!grounded) {
    const up = vy > 0 ? 1 : 0.4;
    j.legs[0].rotation.x = -0.5 * up; j.legs[1].rotation.x = 0.3 * up;
    j.arms[0].rotation.z = -1.6; j.arms[1].rotation.z = 1.6;
  } else {
    j.arms[0].rotation.z = -0.25; j.arms[1].rotation.z = 0.25;
  }
  if (dashing) { j.body.rotation.x = 0.35; } else { j.body.rotation.x *= 0.8; }
  const bob = grounded ? Math.abs(Math.sin(ph)) * 0.06 * walk + Math.sin(t * 2.2) * 0.01 : 0;
  j.body.position.y = bob;
  j.head.rotation.z = Math.sin(t * 1.7) * 0.04;
  blink(j.face, t);
}

// ---------- Sparky (your Claude spark buddy) ----------

export function makeSparky() {
  const root = new THREE.Group();
  const inner = new THREE.Group();
  root.add(inner);
  const star = mesh(starGeometry(0.42, 0.25, 0.16, 0.09), 0xf08a5d, { outline: 1.06 });
  inner.add(star);
  const face = makeFace({ eyeR: 0.085, spacing: 0.1, blush: true });
  face.position.set(0, -0.02, 0.17);
  inner.add(face);
  const glow = new THREE.PointLight(0xffa36b, 0.8, 3.5);
  inner.add(glow);
  const sparkles = [];
  for (let i = 0; i < 3; i++) {
    const sp = mesh(starGeometry(0.06, 0.03, 0.02, 0.01), 0xffe08a, { shadow: false });
    inner.add(sp);
    sparkles.push(sp);
  }
  root.userData = { inner, face, sparkles, glow };
  return root;
}

export function animateSparky(s, t) {
  const u = s.userData;
  u.inner.position.y = Math.sin(t * 2.6) * 0.12;
  u.inner.rotation.z = Math.sin(t * 1.9) * 0.15;
  u.sparkles.forEach((sp, i) => {
    const a = t * 2 + (i * Math.PI * 2) / 3;
    sp.position.set(Math.cos(a) * 0.6, Math.sin(a * 1.3) * 0.25, Math.sin(a) * 0.6);
    sp.rotation.z = t * 3;
  });
  blink(u.face, t);
}

// ---------- generic critters ----------

function withUpdate(g, fn) { g.userData.update = fn; return g; }

export function makeMushroomFolk(capColor = 0xff6f91) {
  const g = new THREE.Group();
  const stem = mesh(new THREE.CylinderGeometry(0.32, 0.4, 0.7, 16), 0xfff1dc, { outline: 1.05 });
  stem.position.y = 0.35;
  const cap = mesh(new THREE.SphereGeometry(0.62, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), capColor, { outline: 1.04 });
  cap.position.y = 0.62;
  cap.scale.y = 0.8;
  g.add(stem, cap);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const d = mesh(sphere(0.08, 8, 6), 0xffffff, { shadow: false });
    d.position.set(Math.cos(a) * 0.38, 0.95, Math.sin(a) * 0.38);
    d.scale.y = 0.5;
    g.add(d);
  }
  const face = makeFace({ eyeR: 0.075, spacing: 0.11 });
  face.position.set(0, 0.38, 0.33);
  g.add(face);
  return withUpdate(g, (t) => { g.scale.y = 1 + Math.sin(t * 3 + face.userData.seed) * 0.04; blink(face, t); });
}

export function makeGumdrop(color = 0xff9ecf) {
  const g = new THREE.Group();
  const body = mesh(sphere(1.1, 32, 20), toon(color, { transparent: true, opacity: 0.92 }), { outline: 1.03 });
  body.scale.set(1, 0.9, 1);
  body.position.y = 0.95;
  const shine = new THREE.Mesh(sphere(0.25, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }));
  shine.position.set(-0.45, 1.5, 0.6);
  shine.scale.set(1, 0.6, 0.5);
  const face = makeFace({ eyeR: 0.2, spacing: 0.3 });
  face.position.set(0, 1.05, 0.95);
  const hat = mesh(new THREE.ConeGeometry(0.3, 0.5, 16), 0x7b6cf6, { outline: 1.06 });
  hat.position.set(0.3, 1.95, 0);
  hat.rotation.z = -0.3;
  const pom = mesh(sphere(0.1), 0xffd166);
  pom.position.set(0.45, 2.2, 0);
  g.add(body, shine, face, hat, pom);
  return withUpdate(g, (t) => {
    const s = Math.sin(t * 2.5);
    body.scale.set(1 + s * 0.04, 0.9 - s * 0.04, 1 + s * 0.04);
    blink(face, t);
  });
}

// Model critters
export function makeHummingbird() {
  const g = new THREE.Group();
  const inner = new THREE.Group();
  g.add(inner);
  const body = mesh(sphere(0.32), 0x5fd3c6, { outline: 1.06 });
  body.scale.set(0.9, 1, 1.1);
  const belly = mesh(sphere(0.25), 0xeafff7);
  belly.position.set(0, -0.08, 0.1);
  const beak = mesh(new THREE.ConeGeometry(0.05, 0.4, 8), 0xffc857);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 0.02, 0.48);
  const face = makeFace({ eyeR: 0.1, spacing: 0.13 , mouth: false });
  face.position.set(0, 0.1, 0.27);
  const wings = [];
  for (const s of [-1, 1]) {
    const w = mesh(sphere(0.22), 0x9be7ff);
    w.scale.set(1.3, 0.25, 0.7);
    w.position.set(s * 0.35, 0.1, -0.05);
    inner.add(w);
    wings.push(w);
  }
  const tail = mesh(new THREE.ConeGeometry(0.12, 0.3, 8), 0x3fb6a8);
  tail.rotation.x = -Math.PI / 2 - 0.3;
  tail.position.set(0, -0.05, -0.38);
  inner.add(body, belly, beak, face, tail);
  return withUpdate(g, (t) => {
    inner.position.y = 0.7 + Math.sin(t * 5) * 0.12;
    wings[0].rotation.z = Math.sin(t * 60) * 0.8;
    wings[1].rotation.z = -Math.sin(t * 60) * 0.8;
    inner.rotation.y = Math.sin(t * 1.3) * 0.4;
    blink(face, t);
  });
}

export function makeBunny() {
  const g = new THREE.Group();
  const inner = new THREE.Group();
  g.add(inner);
  const body = mesh(sphere(0.42), 0xfff3f8, { outline: 1.05 });
  body.scale.set(1, 0.9, 1);
  body.position.y = 0.4;
  const head = mesh(sphere(0.36), 0xfff3f8, { outline: 1.05 });
  head.position.set(0, 0.95, 0.08);
  for (const s of [-1, 1]) {
    const ear = mesh(new THREE.CapsuleGeometry(0.09, 0.45, 4, 8), 0xfff3f8, { outline: 1.08 });
    ear.position.set(s * 0.15, 1.45, 0);
    ear.rotation.z = -s * 0.2;
    const inside = mesh(new THREE.CapsuleGeometry(0.05, 0.35, 4, 8), 0xffb6cf);
    inside.position.set(0, 0, 0.05);
    ear.add(inside);
    inner.add(ear);
  }
  const tail = mesh(sphere(0.13), 0xffffff);
  tail.position.set(0, 0.3, -0.42);
  const face = makeFace({ eyeR: 0.1, spacing: 0.13 });
  face.position.set(0, 0.92, 0.4);
  const nose = mesh(sphere(0.04), 0xff7fa8);
  nose.position.set(0, 0.86, 0.44);
  inner.add(body, head, tail, face, nose);
  return withUpdate(g, (t) => {
    const h = Math.max(0, Math.sin(t * 4));
    inner.position.y = h * 0.25;
    inner.scale.set(1 + (1 - h) * 0.05, 1 - (1 - h) * 0.05, 1);
    blink(face, t);
  });
}

export function makeOwl() {
  const g = new THREE.Group();
  const inner = new THREE.Group();
  g.add(inner);
  const body = mesh(sphere(0.6), 0x9b7bd4, { outline: 1.04 });
  body.scale.set(1, 1.1, 0.95);
  body.position.y = 0.66;
  const belly = mesh(sphere(0.45), 0xe8dcff);
  belly.position.set(0, 0.55, 0.22);
  belly.scale.z = 0.7;
  for (const s of [-1, 1]) {
    const ring = mesh(new THREE.CircleGeometry(0.2, 20), 0xf6efff);
    ring.position.set(s * 0.2, 0.92, 0.55);
    inner.add(ring);
    const tuft = mesh(new THREE.ConeGeometry(0.1, 0.28, 8), 0x7a5cb8);
    tuft.position.set(s * 0.32, 1.33, 0);
    tuft.rotation.z = -s * 0.4;
    inner.add(tuft);
    const wing = mesh(sphere(0.3), 0x7a5cb8);
    wing.scale.set(0.4, 1, 0.8);
    wing.position.set(s * 0.58, 0.6, 0);
    inner.add(wing);
  }
  const face = makeFace({ eyeR: 0.14, spacing: 0.2, iris: 0x2b1d3a });
  face.position.set(0, 0.92, 0.57);
  const beak = mesh(new THREE.ConeGeometry(0.06, 0.15, 8), 0xffc857);
  beak.rotation.x = Math.PI;
  beak.position.set(0, 0.75, 0.62);
  // tiny scholar cap
  const capTop = mesh(new THREE.BoxGeometry(0.55, 0.05, 0.55), 0x3a2a55);
  capTop.position.y = 1.42;
  capTop.rotation.y = Math.PI / 4;
  const capBase = mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.14, 12), 0x3a2a55);
  capBase.position.y = 1.35;
  const tassel = mesh(sphere(0.05), 0xffd166);
  tassel.position.set(0.25, 1.3, 0.1);
  inner.add(body, belly, face, beak, capTop, capBase, tassel);
  return withUpdate(g, (t) => {
    inner.rotation.z = Math.sin(t * 1.5) * 0.08;
    blink(face, t);
  });
}

export function makeDragon() {
  const g = new THREE.Group();
  const inner = new THREE.Group();
  g.add(inner);
  const body = mesh(sphere(0.6), 0xff9f6e, { outline: 1.04 });
  body.position.y = 0.6;
  body.scale.set(1, 0.95, 1.05);
  const belly = mesh(sphere(0.45), 0xffe3b3);
  belly.position.set(0, 0.5, 0.25);
  belly.scale.z = 0.7;
  const head = mesh(sphere(0.42), 0xff9f6e, { outline: 1.05 });
  head.position.set(0, 1.25, 0.15);
  const snout = mesh(sphere(0.22), 0xffb48a);
  snout.position.set(0, 1.12, 0.48);
  snout.scale.set(1.2, 0.8, 0.8);
  const face = makeFace({ eyeR: 0.11, spacing: 0.16 , mouth: false });
  face.position.set(0, 1.32, 0.48);
  for (const s of [-1, 1]) {
    const horn = mesh(new THREE.ConeGeometry(0.07, 0.25, 8), 0xffe08a);
    horn.position.set(s * 0.2, 1.65, 0);
    horn.rotation.z = -s * 0.3;
    const wing = mesh(new THREE.ConeGeometry(0.3, 0.5, 3), 0xffc0d6);
    wing.position.set(s * 0.6, 0.95, -0.2);
    wing.rotation.z = -s * 1.2;
    inner.add(horn, wing);
    g.userData['wing' + s] = wing;
  }
  const tail = mesh(new THREE.ConeGeometry(0.18, 0.7, 10), 0xff9f6e);
  tail.rotation.x = -Math.PI / 2 - 0.6;
  tail.position.set(0, 0.3, -0.6);
  inner.add(body, belly, head, snout, face, tail);
  return withUpdate(g, (t) => {
    inner.position.y = Math.sin(t * 1.6) * 0.05;
    g.userData['wing-1'].rotation.y = Math.sin(t * 4) * 0.3;
    g.userData['wing1'].rotation.y = -Math.sin(t * 4) * 0.3;
    blink(face, t);
  });
}

export function makePiggy() {
  const g = new THREE.Group();
  const body = mesh(sphere(0.55), 0xffb3c7, { outline: 1.04 });
  body.position.y = 0.55;
  body.scale.set(1.1, 0.95, 1);
  const snout = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 16), 0xff8fb1);
  snout.rotation.x = Math.PI / 2;
  snout.position.set(0, 0.5, 0.56);
  const slot = mesh(new THREE.BoxGeometry(0.3, 0.04, 0.06), 0x7a3b52);
  slot.position.set(0, 1.07, 0);
  const coin = mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 16), 0xffd166);
  coin.rotation.z = Math.PI / 2;
  coin.rotation.y = Math.PI / 2;
  coin.position.set(0, 1.2, 0);
  for (const s of [-1, 1]) {
    const ear = mesh(new THREE.ConeGeometry(0.12, 0.2, 8), 0xffb3c7);
    ear.position.set(s * 0.3, 1.0, 0.1);
    g.add(ear);
    for (const z of [-1, 1]) {
      const leg = mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.2, 8), 0xff9fb8);
      leg.position.set(s * 0.3, 0.1, z * 0.25);
      g.add(leg);
    }
  }
  const face = makeFace({ eyeR: 0.09, spacing: 0.17, mouth: false });
  face.position.set(0, 0.75, 0.5);
  g.add(body, snout, slot, coin, face);
  return withUpdate(g, (t) => {
    coin.position.y = 1.2 + Math.abs(Math.sin(t * 2)) * 0.2;
    coin.rotation.x = t * 3;
    blink(face, t);
  });
}

export function makeTokenTot() {
  const g = new THREE.Group();
  const inner = new THREE.Group();
  g.add(inner);
  const coin = mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.16, 24), 0xffc93c, { outline: 1.06 });
  coin.rotation.x = Math.PI / 2;
  coin.position.y = 0.45;
  const rim = mesh(new THREE.TorusGeometry(0.3, 0.03, 6, 24), 0xe8a400);
  rim.position.set(0, 0.45, 0.085);
  const face = makeFace({ eyeR: 0.08, spacing: 0.1 });
  face.position.set(0, 0.48, 0.1);
  const feet = [];
  for (const s of [-1, 1]) {
    const f = mesh(sphere(0.08), 0xe8a400);
    f.position.set(s * 0.15, 0.06, 0);
    f.scale.set(1, 0.7, 1.4);
    inner.add(f);
    feet.push(f);
  }
  inner.add(coin, rim, face);
  return withUpdate(g, (t) => {
    inner.rotation.z = Math.sin(t * 10) * 0.12;
    feet[0].position.y = 0.06 + Math.max(0, Math.sin(t * 10)) * 0.06;
    feet[1].position.y = 0.06 + Math.max(0, -Math.sin(t * 10)) * 0.06;
    blink(face, t);
  });
}

export function makeTokenMuncher() {
  const g = new THREE.Group();
  const inner = new THREE.Group();
  g.add(inner);
  const body = mesh(sphere(2.2, 40, 28), 0x9d7bea, { outline: 1.025 });
  body.scale.set(1, 0.88, 1);
  body.position.y = 1.95;
  const belly = mesh(sphere(1.6, 32, 20), 0xd9c9ff);
  belly.position.set(0, 1.6, 0.75);
  belly.scale.set(1, 0.85, 0.7);
  const face = makeFace({ eyeR: 0.48, spacing: 0.7, mouth: false });
  face.position.set(0, 2.55, 1.85);
  // mouth
  const mouth = new THREE.Group();
  const hole = mesh(new THREE.CircleGeometry(0.62, 32, 0, Math.PI), 0x4a1f3d, { shadow: false });
  hole.rotation.z = Math.PI;
  const tongue = mesh(new THREE.CircleGeometry(0.32, 20, 0, Math.PI), 0xff7fa8, { shadow: false });
  tongue.rotation.z = Math.PI;
  tongue.position.set(0, -0.28, 0.01);
  mouth.add(hole, tongue);
  for (const s of [-1, 1]) {
    const tooth = mesh(new THREE.ConeGeometry(0.1, 0.2, 8), 0xffffff, { shadow: false });
    tooth.rotation.x = Math.PI;
    tooth.position.set(s * 0.3, -0.1, 0.03);
    mouth.add(tooth);
  }
  mouth.position.set(0, 1.75, 2.05);
  mouth.rotation.x = -0.25;
  const feet = [];
  for (const s of [-1, 1]) {
    const f = mesh(sphere(0.45), 0x7b5bd0, { outline: 1.06 });
    f.scale.set(1, 0.55, 1.3);
    f.position.set(s * 1.0, 0.2, 0.5);
    inner.add(f);
    feet.push(f);
  }
  // little coin crown
  const crown = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const c = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.06, 16), 0xffc93c);
    const a = (i / 5) * Math.PI * 2;
    c.position.set(Math.cos(a) * 0.4, 0.15, Math.sin(a) * 0.4);
    c.rotation.x = Math.PI / 2;
    c.rotation.z = a;
    crown.add(c);
  }
  crown.position.y = 3.85;
  inner.add(body, belly, face, mouth, crown);
  // dizzy stars
  const dizzy = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const s = mesh(starGeometry(0.18, 0.09, 0.05, 0.03), 0xffe08a, { shadow: false });
    dizzy.add(s);
  }
  dizzy.position.y = 4.3;
  dizzy.visible = false;
  g.add(dizzy);
  g.userData = { inner, face, mouth, dizzy, body };
  g.userData.update = (t) => {
    blink(face, t);
    dizzy.children.forEach((s, i) => {
      const a = t * 3 + (i * Math.PI) / 2;
      s.position.set(Math.cos(a) * 1.4, Math.sin(a * 2) * 0.15, Math.sin(a) * 1.4);
      s.rotation.z = t * 4;
    });
  };
  return g;
}

// ---------- scenery ----------

export function makeTree(scale = 1, leaf = 0x8fd694) {
  const g = new THREE.Group();
  const trunk = mesh(new THREE.CylinderGeometry(0.18, 0.26, 1.2, 10), 0xc98b5e);
  trunk.position.y = 0.6;
  g.add(trunk);
  const blobs = [[0, 1.6, 0, 0.8], [0.45, 1.35, 0.1, 0.55], [-0.4, 1.4, -0.1, 0.55], [0.05, 2.1, 0, 0.55]];
  for (const [x, y, z, r] of blobs) {
    const b = mesh(sphere(r, 16, 12), leaf, { outline: 1.04 });
    b.position.set(x, y, z);
    g.add(b);
  }
  g.scale.setScalar(scale);
  return g;
}

export function makeFlower(color = 0xff8fb1) {
  const g = new THREE.Group();
  const stem = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.35, 5), 0x6cc070, { shadow: false });
  stem.position.y = 0.17;
  g.add(stem);
  for (let i = 0; i < 5; i++) {
    const p = mesh(sphere(0.08, 8, 6), color, { shadow: false });
    const a = (i / 5) * Math.PI * 2;
    p.position.set(Math.cos(a) * 0.09, 0.37, Math.sin(a) * 0.09);
    g.add(p);
  }
  const c = mesh(sphere(0.06, 8, 6), 0xffe08a, { shadow: false });
  c.position.y = 0.38;
  g.add(c);
  return g;
}

export function makeCloud(scale = 1) {
  const g = new THREE.Group();
  const mat = toon(0xffffff);
  for (const [x, y, z, r] of [[0, 0, 0, 1.2], [1.2, -0.2, 0.2, 0.9], [-1.2, -0.2, 0, 0.9], [0.5, 0.5, -0.2, 0.8]]) {
    const b = new THREE.Mesh(sphere(r, 14, 10), mat);
    b.position.set(x, y, z);
    g.add(b);
  }
  g.scale.setScalar(scale);
  return g;
}

export function makeCrystal(color = 0xc9b6ff, h = 1) {
  const m = mesh(new THREE.OctahedronGeometry(0.35, 0), toon(color, { transparent: true, opacity: 0.85 }), { outline: 1.06 });
  m.scale.set(1, h * 1.8, 1);
  return m;
}
