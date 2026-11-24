import * as THREE from 'three';
import { mesh, toon, sphere, basic } from './toon.js';
import { makeFace, blink, starGeometry } from './creatures.js';

// Creatures for Worlds 2-4.

function withUpdate(g, fn) { g.userData.update = fn; return g; }

// ---------- enemies ----------
export function makeFuzzle() {
  // a grumpy little puff of vague fog
  const g = new THREE.Group();
  const inner = new THREE.Group();
  g.add(inner);
  const mat = toon(0xd9d2e6);
  for (const [x, y, z, r] of [[0, 0.45, 0, 0.36], [0.25, 0.4, 0.05, 0.24], [-0.25, 0.4, 0.05, 0.24], [0, 0.65, -0.05, 0.25]]) {
    const b = mesh(sphere(r, 14, 10), mat, { outline: 1.06 });
    b.position.set(x, y, z);
    inner.add(b);
  }
  const face = makeFace({ eyeR: 0.08, spacing: 0.11, mouth: false });
  face.position.set(0, 0.48, 0.32);
  const brow = mesh(new THREE.BoxGeometry(0.34, 0.035, 0.02), basic(0x5b3b5e));
  brow.position.set(0, 0.6, 0.35);
  brow.rotation.z = 0.12;
  inner.add(face, brow);
  return withUpdate(g, (t) => {
    inner.position.y = Math.abs(Math.sin(t * 6)) * 0.12;
    inner.rotation.z = Math.sin(t * 3) * 0.1;
    blink(face, t);
  });
}

export function makeSpark() {
  // a fizzy ball of static
  const g = new THREE.Group();
  const inner = new THREE.Group();
  g.add(inner);
  const ball = mesh(sphere(0.34, 16, 12), toon(0xffe45c, { emissive: 0x806000, emissiveIntensity: 0.4 }), { outline: 1.07 });
  ball.position.y = 0.45;
  const face = makeFace({ eyeR: 0.08, spacing: 0.1 });
  face.position.set(0, 0.48, 0.3);
  inner.add(ball, face);
  const zaps = [];
  for (let i = 0; i < 4; i++) {
    const z = mesh(new THREE.ConeGeometry(0.05, 0.3, 4), 0xffffff, { shadow: false });
    inner.add(z);
    zaps.push(z);
  }
  return withUpdate(g, (t) => {
    inner.position.y = Math.abs(Math.sin(t * 8)) * 0.1;
    zaps.forEach((z, i) => {
      const a = t * 4 + (i * Math.PI) / 2;
      z.position.set(Math.cos(a) * 0.45, 0.45 + Math.sin(a * 2) * 0.15, Math.sin(a) * 0.45);
      z.rotation.z = a;
    });
    blink(face, t);
  });
}

// ---------- NPCs ----------
export function makeBat(color = 0x9b7bd4) {
  const g = new THREE.Group();
  const inner = new THREE.Group();
  g.add(inner);
  const body = mesh(sphere(0.42), color, { outline: 1.05 });
  const belly = mesh(sphere(0.3), 0xe8dcff);
  belly.position.set(0, -0.08, 0.2);
  belly.scale.z = 0.6;
  const face = makeFace({ eyeR: 0.11, spacing: 0.14 });
  face.position.set(0, 0.06, 0.38);
  inner.add(body, belly, face);
  const wings = [];
  for (const s of [-1, 1]) {
    const ear = mesh(new THREE.ConeGeometry(0.11, 0.3, 8), color);
    ear.position.set(s * 0.2, 0.45, 0);
    ear.rotation.z = -s * 0.25;
    const wing = mesh(new THREE.ConeGeometry(0.35, 0.7, 3), 0x7a5cb8);
    wing.rotation.z = -s * Math.PI / 2;
    wing.position.set(s * 0.65, 0.05, -0.05);
    wing.scale.z = 0.25;
    inner.add(ear, wing);
    wings.push(wing);
  }
  return withUpdate(g, (t) => {
    inner.position.y = 1.3 + Math.sin(t * 3) * 0.15;
    wings[0].rotation.x = Math.sin(t * 14) * 0.6;
    wings[1].rotation.x = Math.sin(t * 14) * 0.6;
    blink(face, t);
  });
}

export function makeRobotCat(color = 0xffb86b) {
  const g = new THREE.Group();
  const inner = new THREE.Group();
  g.add(inner);
  const body = mesh(new THREE.CapsuleGeometry(0.32, 0.3, 6, 12), color, { outline: 1.06 });
  body.position.y = 0.55;
  const head = mesh(new THREE.BoxGeometry(0.9, 0.7, 0.7), color, { outline: 1.05 });
  head.position.y = 1.3;
  const screen = mesh(new THREE.PlaneGeometry(0.72, 0.5), basic(0x2b1d3a));
  screen.position.set(0, 1.3, 0.36);
  const face = makeFace({ eyeR: 0.1, spacing: 0.15, mouthColor: 0xffffff });
  face.position.set(0, 1.32, 0.38);
  inner.add(body, head, screen, face);
  for (const s of [-1, 1]) {
    const ear = mesh(new THREE.ConeGeometry(0.15, 0.3, 4), color);
    ear.position.set(s * 0.3, 1.78, 0);
    ear.rotation.y = Math.PI / 4;
    inner.add(ear);
  }
  const ant = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 6), 0x5b3b5e);
  ant.position.set(0, 1.85, 0);
  const bulb = mesh(sphere(0.07), toon(0x7fd6c2, { emissive: 0x2a8070 }));
  bulb.position.set(0, 2.05, 0);
  const plug = mesh(new THREE.BoxGeometry(0.16, 0.1, 0.12), 0xcfcfdc);
  plug.position.set(0, 0.5, -0.45);
  inner.add(ant, bulb, plug);
  return withUpdate(g, (t) => {
    inner.rotation.y = Math.sin(t * 1.2) * 0.2;
    bulb.scale.setScalar(1 + Math.sin(t * 5) * 0.2);
    blink(face, t);
  });
}

export function makeMarmot() {
  const g = new THREE.Group();
  const inner = new THREE.Group();
  g.add(inner);
  const body = mesh(sphere(0.55), 0xc99a6b, { outline: 1.04 });
  body.scale.set(1, 1.15, 0.95);
  body.position.y = 0.65;
  const belly = mesh(sphere(0.42), 0xf3dcbc);
  belly.position.set(0, 0.55, 0.22);
  belly.scale.z = 0.6;
  const face = makeFace({ eyeR: 0.1, spacing: 0.15 });
  face.position.set(0, 1.0, 0.48);
  const nose = mesh(sphere(0.06), 0x5b3b3b);
  nose.position.set(0, 0.92, 0.55);
  const teeth = mesh(new THREE.BoxGeometry(0.1, 0.08, 0.03), 0xffffff);
  teeth.position.set(0, 0.82, 0.52);
  for (const s of [-1, 1]) {
    const ear = mesh(sphere(0.1), 0xa87b52);
    ear.position.set(s * 0.33, 1.3, 0);
    inner.add(ear);
  }
  const sash = mesh(new THREE.TorusGeometry(0.52, 0.06, 8, 24), 0xff8fb1);
  sash.position.y = 0.7;
  sash.rotation.set(Math.PI / 2, 0.5, 0);
  const hat = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.3, 16), 0x5b3b5e);
  hat.position.y = 1.55;
  const brim = mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.04, 16), 0x5b3b5e);
  brim.position.y = 1.41;
  inner.add(body, belly, face, nose, teeth, sash, hat, brim);
  return withUpdate(g, (t) => {
    inner.position.y = Math.abs(Math.sin(t * 2)) * 0.05;
    blink(face, t);
  });
}

export function makeChatBubble(color = 0xff8fb1) {
  const g = new THREE.Group();
  const inner = new THREE.Group();
  g.add(inner);
  const body = mesh(sphere(0.42), 0xffffff, { outline: 1.06 });
  body.scale.set(1.2, 0.9, 0.8);
  body.position.y = 0.7;
  const tail = mesh(new THREE.ConeGeometry(0.14, 0.3, 8), 0xffffff);
  tail.position.set(-0.3, 0.35, 0);
  tail.rotation.z = 0.6;
  const ring = mesh(new THREE.TorusGeometry(0.47, 0.04, 6, 24), color);
  ring.position.y = 0.7;
  ring.scale.set(1.2, 0.9, 1);
  const face = makeFace({ eyeR: 0.08, spacing: 0.12 });
  face.position.set(0, 0.72, 0.33);
  inner.add(body, tail, ring, face);
  return withUpdate(g, (t) => {
    inner.position.y = Math.abs(Math.sin(t * 4 + g.id)) * 0.15;
    blink(face, t);
  });
}

export function makeHouse(color = 0xff8fb1, roof = 0xb07a9a) {
  const g = new THREE.Group();
  const base = mesh(new THREE.BoxGeometry(3, 2.2, 2.6), 0xfff1dc, { outline: 1.02, receive: true });
  base.position.y = 1.1;
  const top = mesh(new THREE.ConeGeometry(2.4, 1.6, 4), color, { outline: 1.03 });
  top.position.y = 3.0;
  top.rotation.y = Math.PI / 4;
  top.scale.z = 0.9;
  const door = mesh(new THREE.BoxGeometry(0.8, 1.3, 0.1), roof);
  door.position.set(0, 0.65, 1.31);
  const knob = mesh(sphere(0.06), 0xffd166);
  knob.position.set(0.25, 0.65, 1.38);
  const win = mesh(new THREE.CircleGeometry(0.32, 20), toon(0x9be7ff, { emissive: 0x335566 }));
  win.position.set(0, 1.75, 1.31);
  const chim = mesh(new THREE.BoxGeometry(0.4, 0.8, 0.4), 0xd9a07a);
  chim.position.set(0.8, 3.2, -0.3);
  g.add(base, top, door, knob, win, chim);
  return g;
}

export function makeTower(color = 0xf08a5d) {
  const g = new THREE.Group();
  const col = mesh(new THREE.CylinderGeometry(0.6, 0.9, 5, 20), 0xfff1dc, { outline: 1.03 });
  col.position.y = 2.5;
  for (let i = 0; i < 3; i++) {
    const band = mesh(new THREE.TorusGeometry(0.72 - i * 0.05, 0.08, 8, 24), color);
    band.rotation.x = Math.PI / 2;
    band.position.y = 1 + i * 1.5;
    g.add(band);
  }
  const star = mesh(starGeometry(0.7, 0.4, 0.25, 0.1), toon(color, { emissive: color, emissiveIntensity: 0.3 }), { outline: 1.05 });
  star.position.y = 5.9;
  g.add(col, star);
  return withUpdate(g, (t) => { star.rotation.y = t; star.position.y = 5.9 + Math.sin(t * 2) * 0.15; });
}

// ---------- bosses ----------
export function makeSiren() {
  const g = new THREE.Group();
  const inner = new THREE.Group();
  g.add(inner);
  const body = mesh(sphere(1.6, 36, 24), toon(0x7fd6e8, { transparent: true, opacity: 0.93 }), { outline: 1.025 });
  body.scale.set(1, 1.05, 0.95);
  body.position.y = 2.6;
  const belly = mesh(sphere(1.15, 28, 18), 0xfff0fb);
  belly.position.set(0, 2.35, 0.65);
  belly.scale.z = 0.6;
  const face = makeFace({ eyeR: 0.36, spacing: 0.52 });
  face.position.set(0, 2.95, 1.42);
  // lashes
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const l = mesh(new THREE.BoxGeometry(0.05, 0.22, 0.04), basic(0x2b1d3a));
      l.position.set(s * (0.52 + (i - 1) * 0.16), 3.35 + (i === 1 ? 0.05 : 0), 1.5);
      l.rotation.z = s * (i - 1) * -0.4;
      inner.add(l);
    }
  }
  // seashell crown
  for (let i = 0; i < 5; i++) {
    const c = mesh(new THREE.ConeGeometry(0.18, 0.55, 8), [0xffb3d1, 0xffd166, 0xb79cf0][i % 3], { outline: 1.08 });
    c.position.set((i - 2) * 0.32, 4.35 - Math.abs(i - 2) * 0.12, 0.2);
    c.rotation.z = (i - 2) * -0.2;
    inner.add(c);
  }
  // tail + fins
  const tail = mesh(new THREE.ConeGeometry(0.9, 2.2, 16), 0x5fbcd3, { outline: 1.04 });
  tail.position.set(0, 1.0, -1.0);
  tail.rotation.x = -2.2;
  const fluke = mesh(sphere(0.6), 0xff9ecf);
  fluke.scale.set(1.6, 0.3, 0.8);
  fluke.position.set(0, 0.4, -2.2);
  const fins = [];
  for (const s of [-1, 1]) {
    const f = mesh(sphere(0.5), 0xff9ecf, { outline: 1.06 });
    f.scale.set(0.9, 0.3, 0.6);
    f.position.set(s * 1.65, 2.4, 0.2);
    inner.add(f);
    fins.push(f);
  }
  inner.add(body, belly, face, tail, fluke);
  const sparkles = [];
  for (let i = 0; i < 6; i++) {
    const s = mesh(starGeometry(0.15, 0.07, 0.04, 0.02), 0xffffff, { shadow: false });
    g.add(s); sparkles.push(s);
  }
  const dizzy = new THREE.Group();
  for (let i = 0; i < 4; i++) dizzy.add(mesh(starGeometry(0.18, 0.09, 0.05, 0.03), 0xffe08a, { shadow: false }));
  dizzy.position.y = 4.9; dizzy.visible = false;
  g.add(dizzy);
  g.userData = { inner, face, dizzy };
  g.userData.update = (t) => {
    inner.position.y = 0.4 + Math.sin(t * 2) * 0.25;
    fins[0].rotation.z = Math.sin(t * 4) * 0.4; fins[1].rotation.z = -Math.sin(t * 4) * 0.4;
    fluke.rotation.y = Math.sin(t * 3) * 0.4;
    sparkles.forEach((s, i) => { const a = t * 1.5 + (i / 6) * Math.PI * 2; s.position.set(Math.cos(a) * 2.3, 2.8 + Math.sin(a * 2) * 0.8, Math.sin(a) * 2.3); s.rotation.z = t * 3; });
    dizzy.children.forEach((s, i) => { const a = t * 3 + (i * Math.PI) / 2; s.position.set(Math.cos(a) * 1.4, Math.sin(a * 2) * 0.15, Math.sin(a) * 1.4); s.rotation.z = t * 4; });
    blink(face, t);
  };
  return g;
}

export function makeSnakeHead() {
  const g = new THREE.Group();
  const inner = new THREE.Group();
  g.add(inner);
  const head = mesh(sphere(1.05, 28, 20), toon(0xffe45c, { emissive: 0x6b5200, emissiveIntensity: 0.25 }), { outline: 1.03 });
  head.scale.set(1.1, 0.95, 1.1);
  head.position.y = 1.15;
  const snout = mesh(sphere(0.6), 0xfff3a8);
  snout.scale.set(1.2, 0.6, 0.9);
  snout.position.set(0, 0.85, 0.75);
  const face = makeFace({ eyeR: 0.26, spacing: 0.38 });
  face.position.set(0, 1.45, 0.98);
  const tongue = mesh(new THREE.BoxGeometry(0.1, 0.04, 0.5), 0xff7fa8);
  tongue.position.set(0, 0.75, 1.3);
  const bolt = mesh(new THREE.ConeGeometry(0.16, 0.7, 4), 0xffffff, { outline: 1.1 });
  bolt.position.set(0.2, 2.35, 0);
  bolt.rotation.z = -0.4;
  inner.add(head, snout, face, tongue, bolt);
  const dizzy = new THREE.Group();
  for (let i = 0; i < 4; i++) dizzy.add(mesh(starGeometry(0.18, 0.09, 0.05, 0.03), 0xffe08a, { shadow: false }));
  dizzy.position.y = 2.9; dizzy.visible = false;
  g.add(dizzy);
  g.userData = { inner, face, dizzy, tongue };
  g.userData.update = (t) => {
    tongue.scale.z = 0.6 + Math.abs(Math.sin(t * 6)) * 0.6;
    dizzy.children.forEach((s, i) => { const a = t * 3 + (i * Math.PI) / 2; s.position.set(Math.cos(a) * 1.2, Math.sin(a * 2) * 0.15, Math.sin(a) * 1.2); s.rotation.z = t * 4; });
    blink(face, t);
  };
  return g;
}

export function makeSnakeSegment(i) {
  const r = Math.max(0.45, 0.9 - i * 0.06);
  const m = mesh(sphere(r, 20, 14), i % 2 ? 0xffe45c : 0xffc93c, { outline: 1.05 });
  m.userData.r = r;
  return m;
}

export function makeGolem() {
  const g = new THREE.Group();
  const inner = new THREE.Group();
  g.add(inner);
  const stone = 0xb9b0c9, dark = 0x9a90ad, moss = 0x8fd694;
  const body = mesh(sphere(1.6, 10, 8), stone, { outline: 1.03 });
  body.scale.set(1.1, 1.05, 0.95);
  body.position.y = 2.1;
  const head = mesh(sphere(1.0, 10, 8), stone, { outline: 1.04 });
  head.position.set(0, 3.9, 0.15);
  const mossCap = mesh(new THREE.SphereGeometry(1.05, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.4), moss, { outline: 1.04 });
  mossCap.position.set(0, 3.95, 0.15);
  const flower = mesh(sphere(0.18), 0xff8fb1);
  flower.position.set(0.35, 4.95, 0.2);
  const face = makeFace({ eyeR: 0.24, spacing: 0.36 });
  face.position.set(0, 3.8, 1.05);
  // sleepy eyelids
  const lids = [];
  for (const s of [-1, 1]) {
    const lid = mesh(new THREE.SphereGeometry(0.26, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), dark);
    lid.position.set(s * 0.36, 3.82, 1.08);
    lid.rotation.x = 0.3;
    inner.add(lid);
    lids.push(lid);
    const arm = mesh(sphere(0.6, 10, 8), dark, { outline: 1.05 });
    arm.scale.set(0.8, 1.2, 0.8);
    arm.position.set(s * 1.85, 1.8, 0.2);
    inner.add(arm);
    const foot = mesh(sphere(0.55, 10, 8), dark);
    foot.scale.set(1, 0.6, 1.2);
    foot.position.set(s * 0.8, 0.3, 0.2);
    inner.add(foot);
  }
  for (const [x, y, z] of [[-0.8, 2.9, 0.9], [0.9, 1.6, 1.1], [-1.1, 1.3, 0.6]]) {
    const m = mesh(sphere(0.3, 8, 6), moss);
    m.scale.y = 0.5;
    m.position.set(x, y, z);
    inner.add(m);
  }
  inner.add(body, head, mossCap, flower, face);
  const dizzy = new THREE.Group();
  for (let i = 0; i < 4; i++) dizzy.add(mesh(starGeometry(0.18, 0.09, 0.05, 0.03), 0xffe08a, { shadow: false }));
  dizzy.position.y = 5.4; dizzy.visible = false;
  g.add(dizzy);
  g.userData = { inner, face, dizzy, lids };
  g.userData.update = (t) => {
    inner.rotation.z = Math.sin(t * 1.2) * 0.04;
    dizzy.children.forEach((s, i) => { const a = t * 3 + (i * Math.PI) / 2; s.position.set(Math.cos(a) * 1.4, Math.sin(a * 2) * 0.15, Math.sin(a) * 1.4); s.rotation.z = t * 4; });
    blink(face, t);
  };
  return g;
}
