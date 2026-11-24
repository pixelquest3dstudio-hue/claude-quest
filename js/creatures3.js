import * as THREE from 'three';
import { mesh, toon, sphere, basic } from './toon.js';
import { makeFace, blink, starGeometry } from './creatures.js';

// Creatures for Worlds 5-7.

function withUpdate(g, fn) { g.userData.update = fn; return g; }

function dizzyStars(y, r = 1.4) {
  const d = new THREE.Group();
  for (let i = 0; i < 4; i++) d.add(mesh(starGeometry(0.18, 0.09, 0.05, 0.03), 0xffe08a, { shadow: false }));
  d.position.y = y; d.visible = false;
  d.userData.spin = (t) => d.children.forEach((s, i) => { const a = t * 3 + (i * Math.PI) / 2; s.position.set(Math.cos(a) * r, Math.sin(a * 2) * 0.15, Math.sin(a) * r); s.rotation.z = t * 4; });
  return d;
}

// ---------- World 5: Skill Kitchen ----------
export function makeChef() {
  // Chef Dumpling: a soft round bun in a big chef hat
  const g = new THREE.Group();
  const inner = new THREE.Group();
  g.add(inner);
  const body = mesh(sphere(0.6, 24, 18), 0xfff3e0, { outline: 1.04 });
  body.scale.set(1.1, 0.85, 1);
  body.position.y = 0.55;
  const face = makeFace({ eyeR: 0.11, spacing: 0.17 });
  face.position.set(0, 0.62, 0.55);
  const band = mesh(new THREE.CylinderGeometry(0.36, 0.38, 0.18, 20), 0xffffff, { outline: 1.06 });
  band.position.y = 1.08;
  const puff = new THREE.Group();
  for (const [x, y, z] of [[0, 1.42, 0], [0.22, 1.32, 0.05], [-0.22, 1.32, 0.05], [0, 1.32, -0.2]]) {
    const p = mesh(sphere(0.26, 16, 12), 0xffffff, { outline: 1.06 });
    p.position.set(x, y, z);
    puff.add(p);
  }
  const scarf = mesh(new THREE.TorusGeometry(0.5, 0.07, 8, 24), 0xff7f6b);
  scarf.rotation.x = Math.PI / 2;
  scarf.position.y = 0.3;
  const spoon = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 6), 0xd9a07a);
  spoon.position.set(0.7, 0.6, 0.1);
  spoon.rotation.z = -0.5;
  const bowl = mesh(sphere(0.09), 0xd9a07a);
  bowl.position.set(0.88, 0.92, 0.1);
  inner.add(body, face, band, puff, scarf, spoon, bowl);
  return withUpdate(g, (t) => {
    inner.position.y = Math.abs(Math.sin(t * 2.5)) * 0.06;
    spoon.rotation.z = -0.5 + Math.sin(t * 4) * 0.25;
    bowl.position.set(0.7 + Math.sin(0.5 - Math.sin(t * 4) * 0.25) * 0.35, 0.6 + Math.cos(0.5 - Math.sin(t * 4) * 0.25) * 0.35, 0.1);
    blink(face, t);
  });
}

export function makeFox() {
  // Slick the Fox, a market merchant with a shifty grin
  const g = new THREE.Group();
  const inner = new THREE.Group();
  g.add(inner);
  const body = mesh(sphere(0.5), 0xf28f4b, { outline: 1.05 });
  body.scale.set(1, 1.1, 0.9);
  body.position.y = 0.6;
  const bib = mesh(sphere(0.36), 0xfff3e0);
  bib.position.set(0, 0.55, 0.24);
  bib.scale.z = 0.5;
  const head = mesh(sphere(0.42), 0xf28f4b, { outline: 1.05 });
  head.position.y = 1.3;
  const snout = mesh(new THREE.ConeGeometry(0.18, 0.4, 12), 0xfff3e0);
  snout.rotation.x = Math.PI / 2;
  snout.position.set(0, 1.22, 0.45);
  const nose = mesh(sphere(0.06), 0x2b1d3a);
  nose.position.set(0, 1.22, 0.66);
  const face = makeFace({ eyeR: 0.09, spacing: 0.17, mouth: false });
  face.position.set(0, 1.4, 0.36);
  inner.add(body, bib, head, snout, nose, face);
  for (const s of [-1, 1]) {
    const ear = mesh(new THREE.ConeGeometry(0.14, 0.34, 8), 0xf28f4b, { outline: 1.06 });
    ear.position.set(s * 0.25, 1.75, 0);
    ear.rotation.z = -s * 0.2;
    inner.add(ear);
  }
  const tail = mesh(sphere(0.3), 0xf28f4b, { outline: 1.06 });
  tail.scale.set(0.7, 0.7, 1.5);
  tail.position.set(0.3, 0.5, -0.6);
  const tip = mesh(sphere(0.16), 0xfff3e0);
  tip.position.set(0.38, 0.55, -1.0);
  const hat = mesh(new THREE.CylinderGeometry(0.2, 0.28, 0.3, 16), 0x7b5bd0);
  hat.position.set(0, 1.78, 0);
  inner.add(tail, tip, hat);
  return withUpdate(g, (t) => {
    tail.rotation.y = Math.sin(t * 3) * 0.4;
    inner.rotation.z = Math.sin(t * 1.5) * 0.05;
    blink(face, t);
  });
}

export function makeRecipeCard(color = 0xffd166, emoji = '') {
  const g = new THREE.Group();
  const card = mesh(new THREE.BoxGeometry(0.8, 1.0, 0.06), 0xfffaf3, { outline: 1.06 });
  const stripe = mesh(new THREE.BoxGeometry(0.8, 0.22, 0.07), color);
  stripe.position.y = 0.38;
  for (let i = 0; i < 3; i++) {
    const l = mesh(new THREE.BoxGeometry(0.55, 0.04, 0.07), basic(0xd9c9b8));
    l.position.y = 0.1 - i * 0.16;
    g.add(l);
  }
  const face = makeFace({ eyeR: 0.07, spacing: 0.1 });
  face.position.set(0, -0.3, 0.05);
  g.add(card, stripe, face);
  g.userData.face = face;
  return g;
}

export function makeScroll(color = 0xffd166) {
  const g = new THREE.Group();
  const paper = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.8, 16), 0xfff1dc, { outline: 1.08 });
  paper.rotation.z = Math.PI / 2;
  paper.position.y = 0.4;
  const ribbon = mesh(new THREE.TorusGeometry(0.23, 0.04, 6, 16), color);
  ribbon.rotation.y = Math.PI / 2;
  ribbon.position.y = 0.4;
  g.add(paper, ribbon);
  return g;
}

export function makePudding() {
  // BOSS: the Again-Again Pudding, a giant wobbly flan who makes you repeat yourself forever
  const g = new THREE.Group();
  const inner = new THREE.Group();
  g.add(inner);
  const base = mesh(new THREE.CylinderGeometry(2.0, 2.4, 2.6, 32), toon(0xffd98a), { outline: 1.03 });
  base.position.y = 1.3;
  const caramel = mesh(new THREE.CylinderGeometry(1.75, 2.0, 0.6, 32), 0xb8632e, { outline: 1.03 });
  caramel.position.y = 2.85;
  const drips = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const d = mesh(sphere(0.22, 10, 8), 0xb8632e);
    d.scale.set(1, 1.6, 1);
    d.position.set(Math.cos(a) * 1.95, 2.35, Math.sin(a) * 1.95);
    inner.add(d); drips.push(d);
  }
  const cream = mesh(sphere(0.7, 18, 12), 0xffffff, { outline: 1.05 });
  cream.scale.set(1, 0.7, 1);
  cream.position.y = 3.35;
  const cherry = mesh(sphere(0.35, 16, 12), toon(0xff3b5c, { emissive: 0x550010, emissiveIntensity: 0.3 }), { outline: 1.08 });
  cherry.position.y = 3.95;
  const stem = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), 0x5a8f3a);
  stem.position.set(0.1, 4.35, 0);
  stem.rotation.z = -0.3;
  const face = makeFace({ eyeR: 0.32, spacing: 0.55 });
  face.position.set(0, 1.6, 2.15);
  // angry little brows
  for (const s of [-1, 1]) {
    const b = mesh(new THREE.BoxGeometry(0.45, 0.07, 0.05), basic(0x5b3b5e));
    b.position.set(s * 0.55, 2.15, 2.12);
    b.rotation.z = s * 0.25;
    inner.add(b);
  }
  inner.add(base, caramel, cream, cherry, stem, face);
  const dizzy = dizzyStars(4.8, 1.5);
  g.add(dizzy);
  g.userData = { inner, face, dizzy };
  g.userData.update = (t) => {
    const w = Math.sin(t * 7) * 0.04;
    base.scale.set(1 + w, 1 - w, 1 + w);
    drips.forEach((d, i) => (d.scale.y = 1.6 + Math.sin(t * 3 + i) * 0.3));
    dizzy.userData.spin(t);
    blink(face, t);
  };
  return g;
}

// ---------- World 6: Cowork Clocktower ----------
export function makeHelperBot(color = 0x7fd6c2) {
  // a tiny sub-agent helper
  const g = new THREE.Group();
  const inner = new THREE.Group();
  g.add(inner);
  const body = mesh(sphere(0.3, 16, 12), color, { outline: 1.07 });
  body.position.y = 0.45;
  const face = makeFace({ eyeR: 0.07, spacing: 0.1 });
  face.position.set(0, 0.48, 0.27);
  const prop = mesh(new THREE.BoxGeometry(0.6, 0.03, 0.08), 0xffffff);
  prop.position.y = 0.85;
  const pole = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.15, 6), 0x5b3b5e);
  pole.position.y = 0.76;
  const box = mesh(new THREE.BoxGeometry(0.3, 0.22, 0.25), 0xffd166, { outline: 1.08 });
  box.position.set(0, 0.08, 0.05);
  box.visible = false;
  inner.add(body, face, prop, pole, box);
  g.userData.box = box;
  return withUpdate(g, (t) => {
    prop.rotation.y = t * 20;
    inner.position.y = Math.sin(t * 5 + g.id) * 0.08;
    blink(face, t);
  });
}

export function makeFolder(color = 0x7fb4ff, label = '') {
  const g = new THREE.Group();
  const back = mesh(new THREE.BoxGeometry(1.4, 1.0, 0.12), color, { outline: 1.05 });
  back.position.y = 0.5;
  const tab = mesh(new THREE.BoxGeometry(0.5, 0.18, 0.12), color);
  tab.position.set(-0.4, 1.06, 0);
  const front = mesh(new THREE.BoxGeometry(1.4, 0.85, 0.1), new THREE.Color(color).offsetHSL(0, 0, 0.08).getHex());
  front.position.set(0, 0.43, 0.1);
  front.rotation.x = -0.12;
  g.add(back, tab, front);
  return g;
}

export function makeAlarmClock() {
  // BOSS: Ringo the Alarm Clock, who insists you do every step yourself
  const g = new THREE.Group();
  const inner = new THREE.Group();
  g.add(inner);
  const body = mesh(new THREE.CylinderGeometry(1.8, 1.8, 1.4, 40), 0xff8f8f, { outline: 1.03 });
  body.rotation.x = Math.PI / 2;
  body.position.y = 2.4;
  const dial = mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.2, 40), 0xfffaf3);
  dial.rotation.x = Math.PI / 2;
  dial.position.set(0, 2.4, 0.66);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const tick = mesh(new THREE.BoxGeometry(0.07, 0.22, 0.05), basic(0xd9a0a0));
    tick.position.set(Math.sin(a) * 1.3, 2.4 + Math.cos(a) * 1.3, 0.78);
    tick.rotation.z = -a;
    inner.add(tick);
  }
  const hourH = mesh(new THREE.BoxGeometry(0.1, 0.7, 0.04), basic(0x5b3b5e));
  hourH.geometry.translate(0, 0.35, 0);
  hourH.position.set(0, 2.4, 0.82);
  const minH = mesh(new THREE.BoxGeometry(0.07, 1.05, 0.04), basic(0x5b3b5e));
  minH.geometry.translate(0, 0.5, 0);
  minH.position.set(0, 2.4, 0.84);
  const face = makeFace({ eyeR: 0.26, spacing: 0.45 });
  face.position.set(0, 2.25, 0.8);
  const bells = [];
  for (const s of [-1, 1]) {
    const bell = mesh(new THREE.SphereGeometry(0.6, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), 0xffd166, { outline: 1.05 });
    bell.position.set(s * 1.0, 4.0, 0);
    bell.rotation.z = -s * 0.5;
    inner.add(bell); bells.push(bell);
    const leg = mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.9, 8), 0x5b3b5e);
    leg.position.set(s * 1.0, 0.45, 0);
    leg.rotation.z = s * 0.35;
    inner.add(leg);
    const foot = mesh(sphere(0.25), 0xffd166);
    foot.position.set(s * 1.2, 0.1, 0);
    inner.add(foot);
  }
  const hammer = mesh(sphere(0.18), 0x5b3b5e);
  hammer.position.set(0, 4.25, 0);
  inner.add(body, dial, hourH, minH, face, hammer);
  const dizzy = dizzyStars(5.0, 1.6);
  g.add(dizzy);
  g.userData = { inner, face, dizzy };
  g.userData.update = (t) => {
    minH.rotation.z = -t * 2;
    hourH.rotation.z = -t * 0.3;
    hammer.position.x = Math.sin(t * 30) * 0.5;
    bells.forEach((b, i) => (b.rotation.y = Math.sin(t * 30 + i) * 0.1));
    dizzy.userData.spin(t);
    blink(face, t);
  };
  return g;
}

// ---------- World 7: Code Cloud Castle ----------
export function makeBug() {
  // a cute ladybug "bug" that Claude's testing squashes
  const g = new THREE.Group();
  const inner = new THREE.Group();
  g.add(inner);
  const shell = mesh(new THREE.SphereGeometry(0.4, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), 0xff5c6b, { outline: 1.07 });
  shell.position.y = 0.2;
  const head = mesh(sphere(0.2), 0x2b1d3a);
  head.position.set(0, 0.3, 0.38);
  const face = makeFace({ eyeR: 0.06, spacing: 0.08, mouth: false });
  face.position.set(0, 0.33, 0.55);
  for (const [x, z] of [[0.15, 0.1], [-0.15, 0.1], [0.12, -0.18], [-0.12, -0.18]]) {
    const dot = mesh(sphere(0.07, 8, 6), basic(0x2b1d3a));
    dot.position.set(x, 0.53, z);
    dot.scale.y = 0.4;
    inner.add(dot);
  }
  inner.add(shell, head, face);
  return withUpdate(g, (t) => {
    inner.position.y = Math.abs(Math.sin(t * 9)) * 0.06;
    blink(face, t);
  });
}

export function makeRocket() {
  const g = new THREE.Group();
  const body = mesh(new THREE.CylinderGeometry(0.7, 0.8, 2.6, 24), 0xfffaf3, { outline: 1.04 });
  body.position.y = 1.9;
  const nose = mesh(new THREE.ConeGeometry(0.7, 1.1, 24), 0xff8fb1, { outline: 1.05 });
  nose.position.y = 3.75;
  const win = mesh(new THREE.CircleGeometry(0.3, 20), toon(0x9be7ff, { emissive: 0x335566 }));
  win.position.set(0, 2.4, 0.77);
  const face = makeFace({ eyeR: 0.09, spacing: 0.13 });
  face.position.set(0, 1.7, 0.8);
  g.add(body, nose, win, face);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const fin = mesh(new THREE.BoxGeometry(0.12, 0.9, 0.7), 0xa0a8ff, { outline: 1.05 });
    fin.position.set(Math.sin(a) * 0.8, 0.9, Math.cos(a) * 0.8);
    fin.rotation.y = a;
    g.add(fin);
  }
  const flame = mesh(new THREE.ConeGeometry(0.45, 1.0, 16), toon(0xffb36b, { emissive: 0xff7a00, emissiveIntensity: 0.6 }), { shadow: false });
  flame.rotation.x = Math.PI;
  flame.position.y = 0.2;
  flame.visible = false;
  g.add(flame);
  g.userData = { flame, face };
  return withUpdate(g, (t) => { flame.scale.y = 1 + Math.sin(t * 30) * 0.2; blink(face, t); });
}

export function makeBook(color = 0xa0a8ff) {
  // the giant CLAUDE.md memory book
  const g = new THREE.Group();
  const cover = mesh(new THREE.BoxGeometry(2.4, 0.5, 3), color, { outline: 1.03 });
  cover.position.y = 0.25;
  const pages = mesh(new THREE.BoxGeometry(2.25, 0.38, 2.9), 0xfffaf3);
  pages.position.set(0.06, 0.25, 0);
  const face = makeFace({ eyeR: 0.12, spacing: 0.2 });
  face.position.set(0, 0.28, 1.52);
  g.add(cover, pages, face);
  return withUpdate(g, (t) => blink(face, t));
}

export function makeVagueKing() {
  // FINAL BOSS: the Vague King, a huge grey fog-cloud with a wobbly crown who only speaks in vague prompts
  const g = new THREE.Group();
  const inner = new THREE.Group();
  g.add(inner);
  const mat = toon(0xb9b3c9).clone(); // its own copy: the fight recolors it
  const puffs = [];
  for (const [x, y, z, r] of [[0, 2.6, 0, 2.0], [1.5, 2.0, 0.2, 1.3], [-1.5, 2.0, 0.2, 1.3], [0.9, 3.7, -0.2, 1.2], [-0.9, 3.7, -0.2, 1.2], [0, 1.2, 0.4, 1.4]]) {
    const p = mesh(sphere(r, 20, 14), mat, { outline: 1.03 });
    p.position.set(x, y, z);
    inner.add(p); puffs.push(p);
  }
  const face = makeFace({ eyeR: 0.38, spacing: 0.62 });
  face.position.set(0, 2.8, 1.95);
  // a big frown of fog
  const brow = mesh(new THREE.BoxGeometry(1.8, 0.1, 0.05), basic(0x5b3b5e));
  brow.position.set(0, 3.5, 1.9);
  // crown
  const crown = new THREE.Group();
  const band = mesh(new THREE.CylinderGeometry(1.1, 1.2, 0.5, 24, 1, true), toon(0xffd166, { emissive: 0x664400, emissiveIntensity: 0.3, side: THREE.DoubleSide }), { outline: 1.04 });
  crown.add(band);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const spike = mesh(new THREE.ConeGeometry(0.2, 0.55, 8), 0xffd166);
    spike.position.set(Math.cos(a) * 1.12, 0.5, Math.sin(a) * 1.12);
    crown.add(spike);
    const gem = mesh(sphere(0.1), [0xff8fb1, 0x7fd6c2, 0xb79cf0][i % 3]);
    gem.position.set(Math.cos(a) * 1.2, 0.05, Math.sin(a) * 1.2);
    crown.add(gem);
  }
  crown.position.y = 4.9;
  crown.rotation.z = 0.12;
  // a "???" scepter
  const scepter = mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 8), 0xd9a07a);
  scepter.position.set(2.6, 2.2, 0.6);
  scepter.rotation.z = -0.25;
  const orb = mesh(sphere(0.35), toon(0xc9b6ff, { emissive: 0x6040a0, emissiveIntensity: 0.4 }), { outline: 1.06 });
  orb.position.set(2.9, 3.4, 0.6);
  inner.add(face, brow, crown, scepter, orb);
  const dizzy = dizzyStars(6.2, 1.8);
  g.add(dizzy);
  g.userData = { inner, face, dizzy, puffs, crown, mat };
  g.userData.update = (t) => {
    puffs.forEach((p, i) => p.scale.setScalar(1 + Math.sin(t * 2 + i) * 0.04));
    crown.rotation.y = Math.sin(t) * 0.2;
    orb.scale.setScalar(1 + Math.sin(t * 4) * 0.1);
    dizzy.userData.spin(t);
    blink(face, t);
  };
  return g;
}

// ---------- Bonus: Design Studio ----------
export function makePalette() {
  // Pip the Palette: a hopping paint palette with paint-blob buttons and a brush
  const g = new THREE.Group();
  const inner = new THREE.Group();
  g.add(inner);
  const board = mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.16, 28), 0xe8c39e, { outline: 1.05 });
  board.rotation.x = Math.PI / 2 - 0.15;
  board.scale.set(1.15, 1, 1);
  board.position.y = 1.0;
  const hole = mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.18, 14), 0xc99a6e);
  hole.rotation.x = Math.PI / 2 - 0.15;
  hole.position.set(-0.45, 0.72, 0.05);
  const blobs = [];
  [[0xff8fb1, -0.35, 1.38], [0xffd166, 0.05, 1.5], [0x7fb4ff, 0.45, 1.35], [0x8fd694, 0.6, 0.95]].forEach(([c, x, y]) => {
    const b = mesh(sphere(0.12, 12, 10), c, { outline: 1.1 });
    b.scale.set(1, 1, 0.5);
    b.position.set(x, y, 0.12);
    inner.add(b); blobs.push(b);
  });
  const face = makeFace({ eyeR: 0.1, spacing: 0.16 });
  face.position.set(0.05, 0.98, 0.14);
  const brush = new THREE.Group();
  const handle = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.9, 6), 0xd9a07a);
  const tip = mesh(new THREE.ConeGeometry(0.07, 0.2, 8), 0xff8fb1);
  tip.position.y = 0.55;
  brush.add(handle, tip);
  brush.position.set(0.9, 1.1, 0.1);
  brush.rotation.z = -0.4;
  const feet = [-0.25, 0.25].map((x) => { const f = mesh(sphere(0.12), 0xc99a6e); f.position.set(x, 0.12, 0.05); return f; });
  inner.add(board, hole, face, brush, ...feet);
  return withUpdate(g, (t) => {
    inner.position.y = Math.abs(Math.sin(t * 3)) * 0.12;
    brush.rotation.z = -0.4 + Math.sin(t * 5) * 0.3;
    blobs.forEach((b, i) => b.scale.setScalar(1 + Math.sin(t * 4 + i) * 0.08));
    blink(face, t);
  });
}

export function makeEasel(color = 0xff9ecf) {
  // a template canvas on a little easel
  const g = new THREE.Group();
  for (const [x, rz] of [[-0.35, 0.12], [0.35, -0.12]]) {
    const leg = mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.8, 6), 0xb07a5a);
    leg.position.set(x, 0.9, 0);
    leg.rotation.z = rz;
    g.add(leg);
  }
  const back = mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.7, 6), 0xb07a5a);
  back.position.set(0, 0.85, -0.35);
  back.rotation.x = -0.35;
  const canvas = mesh(new THREE.BoxGeometry(1.1, 0.85, 0.06), 0xfffaf3, { outline: 1.05 });
  canvas.position.set(0, 1.45, 0.08);
  canvas.rotation.x = -0.12;
  const art = mesh(new THREE.PlaneGeometry(0.85, 0.6), toon(color, { emissive: color, emissiveIntensity: 0.25 }));
  art.position.set(0, 1.45, 0.115);
  art.rotation.x = -0.12;
  g.add(back, canvas, art);
  g.userData.art = art;
  return g;
}

export function makeBlandy() {
  // BONUS BOSS: Blandy the Beige Blob, who makes every design look like everyone else's
  const g = new THREE.Group();
  const inner = new THREE.Group();
  g.add(inner);
  const mat = toon(0xd8cbb8).clone(); // its own copy: the fight paints it
  const body = mesh(sphere(2.2, 28, 20), mat, { outline: 1.03 });
  body.scale.set(1.15, 0.95, 1);
  body.position.y = 2.1;
  const drips = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const d = mesh(sphere(0.45, 12, 10), mat, { outline: 1.04 });
    d.position.set(Math.cos(a) * 2.1, 0.45, Math.sin(a) * 1.9);
    inner.add(d); drips.push(d);
  }
  const face = makeFace({ eyeR: 0.34, spacing: 0.6 });
  face.position.set(0, 2.5, 2.05);
  // half-closed bored lids
  for (const s of [-1, 1]) {
    const lid = mesh(new THREE.BoxGeometry(0.75, 0.12, 0.05), basic(0x8a7d6a));
    lid.position.set(s * 0.6, 2.85, 2.08);
    inner.add(lid);
  }
  // a beige beret
  const beret = mesh(new THREE.CylinderGeometry(1.0, 1.15, 0.3, 24), 0xbfae96, { outline: 1.05 });
  beret.position.set(0.3, 4.15, 0);
  beret.rotation.z = -0.2;
  const nub = mesh(sphere(0.16), 0xbfae96);
  nub.position.set(0.38, 4.38, 0);
  // a roller dripping beige paint
  const roller = new THREE.Group();
  const rh = mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.8, 6), 0xd9a07a);
  const rc = mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.0, 14), 0xe9dfcf, { outline: 1.05 });
  rc.rotation.z = Math.PI / 2;
  rc.position.y = 1.0;
  roller.add(rh, rc);
  roller.position.set(2.7, 2.4, 0.6);
  roller.rotation.z = -0.35;
  inner.add(body, face, beret, nub, roller);
  const dizzy = dizzyStars(5.2, 1.7);
  g.add(dizzy);
  g.userData = { inner, face, dizzy, mat };
  g.userData.update = (t) => {
    const w = Math.sin(t * 3) * 0.035;
    body.scale.set(1.15 + w, 0.95 - w, 1 + w);
    drips.forEach((d, i) => (d.scale.y = 1 + Math.sin(t * 2.5 + i) * 0.2));
    roller.rotation.z = -0.35 + Math.sin(t * 2) * 0.15;
    dizzy.userData.spin(t);
    blink(face, t);
  };
  return g;
}
