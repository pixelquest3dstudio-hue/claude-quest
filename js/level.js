import * as THREE from 'three';
import { mesh, toon, sphere } from './toon.js';
import { makeTree, makeFlower, makeCloud, makeTokenTot, starGeometry, makeGumdrop } from './creatures.js';
import { Input, hit } from './input.js';
import { Sfx } from './audio.js';
import { save, persist } from './save.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// ---------- text labels (canvas sprites) ----------
export function makeLabel(text, { size = 0.5, bg = '#fffaf3', fg = '#5b3b5e', border = '#ff9ecf', font = 44 } = {}) {
  const lines = String(text).split('\n');
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  ctx.font = `600 ${font}px Fredoka, sans-serif`;
  const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 56;
  const lh = font * 1.25;
  const h = lines.length * lh + 36;
  c.width = Math.ceil(w); c.height = Math.ceil(h);
  ctx.font = `600 ${font}px Fredoka, sans-serif`;
  ctx.fillStyle = bg;
  ctx.strokeStyle = border;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.roundRect(4, 4, c.width - 8, c.height - 8, 28);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((l, i) => ctx.fillText(l, c.width / 2, 18 + lh * (i + 0.5)));
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false, depthTest: true }));
  const scale = size / font * 1.0;
  spr.scale.set(c.width * scale * 0.5, c.height * scale * 0.5, 1);
  spr.renderOrder = 5;
  return spr;
}

function skyTexture(top, bottom) {
  const c = document.createElement('canvas');
  c.width = 4; c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, top); g.addColorStop(1, bottom);
  ctx.fillStyle = g; ctx.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function swirlTexture(color) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, color); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 5;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    for (let a = 0; a < 8; a += 0.1) {
      const r = a * 6;
      const x = 64 + Math.cos(a + (i * Math.PI * 2) / 3) * r, y = 64 + Math.sin(a + (i * Math.PI * 2) / 3) * r;
      a ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---------- Level base ----------
export class Level {
  constructor(game, key) {
    this.game = game;
    this.key = key;
    this.scene = new THREE.Scene();
    this.solids = [];
    this.movers = [];
    this.animators = [];
    this.triggers = [];
    this.interactables = [];
    this.pickups = [];
    this.enemies = [];
    this.spawn = V(0, 0.1, 0);
    this.spawnYaw = 0;
    this.killY = -18;
    this.gentle = false; // gentle levels: falling costs no hearts
    this.t = 0;
    this.nearest = null;
    this.busy = false;
  }

  env({ top = '#a8dcff', bottom = '#ffe6f2', fog = 0xffeaf4, fogNear = 45, fogFar = 150, sun = 1.5 } = {}) {
    this.scene.background = skyTexture(top, bottom);
    this.scene.fog = new THREE.Fog(fog, fogNear, fogFar);
    const hemi = new THREE.HemisphereLight(0xffffff, 0xffd6e8, 1.25);
    this.scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xfff3e0, sun);
    dir.castShadow = true;
    dir.shadow.mapSize.set(2048, 2048);
    const sc = dir.shadow.camera;
    sc.left = -22; sc.right = 22; sc.top = 22; sc.bottom = -22; sc.near = 1; sc.far = 80;
    dir.shadow.bias = -0.0008;
    dir.shadow.normalBias = 0.03;
    this.scene.add(dir, dir.target);
    this.sun = dir;
  }

  // ----- platforms -----
  platform(o) {
    const { x = 0, y = 0, z = 0, shape = 'cyl', r = 3, w = 3, d = 3, h = 1.4, top = 0x9be38a, side = 0xe9b98f, island = true } = o;
    const g = new THREE.Group();
    g.position.set(x, y, z);
    if (shape === 'cyl') {
      const t = mesh(new THREE.CylinderGeometry(r, r, 0.35, 40), top, { receive: true });
      t.position.y = -0.175;
      const b = mesh(new THREE.CylinderGeometry(r * 0.97, r * 0.82, h - 0.35, 40), side, { receive: true });
      b.position.y = -0.35 - (h - 0.35) / 2;
      g.add(t, b);
      if (island) {
        const cone = mesh(new THREE.ConeGeometry(r * 0.82, r * 1.1, 20), side);
        cone.rotation.x = Math.PI;
        cone.position.y = -h - (r * 1.1) / 2 + 0.01;
        g.add(cone);
      }
    } else {
      const t = mesh(new THREE.BoxGeometry(w, 0.35, d), top, { receive: true });
      t.position.y = -0.175;
      const b = mesh(new THREE.BoxGeometry(w * 0.96, h - 0.35, d * 0.96), side, { receive: true });
      b.position.y = -0.35 - (h - 0.35) / 2;
      g.add(t, b);
    }
    this.scene.add(g);
    const s = { shape, x, z, r, top: y, bottom: y - h, mesh: g, enabled: true, delta: V() };
    if (shape === 'box') { s.min = V(x - w / 2, y - h, z - d / 2); s.max = V(x + w / 2, y, z + d / 2); }
    this.solids.push(s);
    return s;
  }

  // invisible or custom-visual box solid
  wall(minx, miny, minz, maxx, maxy, maxz, visual = null) {
    const s = { shape: 'box', min: V(minx, miny, minz), max: V(maxx, maxy, maxz), top: maxy, bottom: miny, x: (minx + maxx) / 2, z: (minz + maxz) / 2, mesh: visual, enabled: true, delta: V() };
    this.solids.push(s);
    return s;
  }

  moveSolid(s, dx, dy, dz) {
    s.x += dx; s.z += dz; s.top += dy; s.bottom += dy;
    if (s.min) { s.min.x += dx; s.min.y += dy; s.min.z += dz; s.max.x += dx; s.max.y += dy; s.max.z += dz; }
    if (s.mesh) s.mesh.position.add(V(dx, dy, dz));
    s.delta.set(dx, dy, dz);
  }

  mover(s, offset, period = 6, phase = 0) {
    const m = { s, offset: offset.clone(), period, phase, last: 0 };
    this.movers.push(m);
    return m;
  }

  // platform that rises into place when revealed
  hiddenPlatform(o) {
    const s = this.platform(o);
    s.enabled = false;
    s.mesh.visible = false;
    s.revealY = o.y;
    return s;
  }

  reveal(s, delay = 0) {
    setTimeout(() => {
      s.mesh.visible = true;
      s.mesh.position.y = s.top - 6;
      const start = performance.now();
      const anim = () => {
        const k = Math.min(1, (performance.now() - start) / 700);
        const e = 1 - Math.pow(1 - k, 3);
        s.mesh.position.y = s.top - 6 * (1 - e) + Math.sin(k * Math.PI) * 0.3;
        if (k < 1) requestAnimationFrame(anim);
        else { s.mesh.position.y = s.top; s.enabled = true; }
      };
      anim();
      Sfx.pop();
    }, delay);
  }

  // stepping stones evenly spaced in the gap between two round islands [x, y, z, r]
  stones(a, b, n, { r = 1.3, hidden = false, ...style } = {}) {
    const dx = b[0] - a[0], dz = b[2] - a[2], d = Math.hypot(dx, dz);
    const ux = dx / d, uz = dz / d;
    const gap = d - a[3] - b[3];
    const step = (gap - n * 2 * r) / (n + 1);
    const out = [];
    for (let i = 0; i < n; i++) {
      const along = a[3] + step * (i + 1) + r * (2 * i + 1);
      // heights climb in equal steps per hop, so no single jump is too tall
      const o = { x: a[0] + ux * along, y: a[1] + ((b[1] - a[1]) * (i + 1)) / (n + 1), z: a[2] + uz * along, r, h: 1, ...style };
      out.push(hidden ? this.hiddenPlatform(o) : this.platform(o));
    }
    return out;
  }

  // a sagging cable between two points (for connectors)
  cable(a, b, color = 0xffd166) {
    const mid = a.clone().lerp(b, 0.5);
    mid.y -= a.distanceTo(b) * 0.12;
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const m = mesh(new THREE.TubeGeometry(curve, 32, 0.08, 6, false), toon(color, { emissive: color, emissiveIntensity: 0.35 }), { shadow: false });
    this.scene.add(m);
    return m;
  }

  /*
    Learning by playing: lesson sparks appear around the player and each one shows its lesson when touched.
    There are no wrong answers. items: [[label, lesson, color?]...]
    mode: 'ring' (run to them) | 'trail' (one at a time, in order) | 'high' (jump for them)
          | 'fall' (they drop from the sky) | 'chase' (they scurry about)
    Resolves with the index of the last spark collected. onGet(i) runs for each one.
  */
  async play(title, items, { mode = 'ring', onGet } = {}) {
    const palette = [0xff8fb1, 0xffd166, 0x7fb4ff, 0x8fd694, 0xb79cf0];
    const ui = this.game.ui;
    const last = await new Promise((res) => {
      const spots = this.playSpots(items.length);
      const orbs = items.map(([label, lesson, color], i) => {
        const c = color || palette[i % palette.length];
        const obj = new THREE.Group();
        const lab = this.label(label, 0, 0.75, 0, { size: 0.26, border: '#' + new THREE.Color(c).getHexString() });
        this.scene.remove(lab);
        obj.add(mesh(sphere(0.34, 18, 14), toon(c, { emissive: c, emissiveIntensity: 0.45 }), { outline: 1.08 }), lab);
        // a soft light column so it's easy to spot from anywhere
        const ray = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 9, 12, 1, true), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide }));
        ray.position.y = 4.5;
        obj.add(ray);
        this.scene.add(obj);
        obj.visible = mode !== 'trail' || i === 0;
        return { obj, label, lesson, color: c, spot: spots[i], i, got: false, age: mode === 'fall' ? -i * 0.5 : 0 };
      });
      this.quest = { title, orbs, mode, onGet, res, got: 0, cool: 0.6, t: 0 };
      this.tickQuest(0);
      ui.setObjective(`${title} (0/${items.length})`);
    });
    // never talk over another message (for example if the player just lost their last heart)
    while (ui.blocking || this.game.defeating || this.game.transitioning) await this.wait(100);
    this.setObj && this.setObj();
    return last;
  }

  // open, reachable places on the platform the player is standing on
  playSpots(n) {
    const p = this.game.player.pos;
    const inside = (s, x, z, m) => (s.shape === 'cyl' ? Math.hypot(x - s.x, z - s.z) < s.r - m : x > s.min.x + m && x < s.max.x - m && z > s.min.z + m && z < s.max.z - m);
    const floors = this.solids.filter((s) => s.enabled && s.mesh && !s.noLand && !this.movers.some((m) => m.s === s) && (s.shape === 'cyl' ? s.r >= 2.5 : s.max.x - s.min.x >= 2.5));
    const size = (s) => (s.shape === 'cyl' ? s.r * 2 : Math.min(s.max.x - s.min.x, s.max.z - s.min.z));
    const far = (s) => Math.abs(s.top - p.y) + (s.shape === 'cyl' ? Math.max(0, Math.hypot(p.x - s.x, p.z - s.z) - s.r) : Math.hypot(Math.max(s.min.x - p.x, 0, p.x - s.max.x), Math.max(s.min.z - p.z, 0, p.z - s.max.z)));
    // the roomiest floor right under the player, or else the closest roomy one
    const under = floors.filter((s) => inside(s, p.x, p.z, -0.3) && s.top <= p.y + 0.2 && s.top > p.y - 5).sort((a, b) => size(b) - size(a));
    const roomy = floors.filter((s) => size(s) >= 4);
    const floor = under.find((s) => size(s) >= 4) || (roomy.length ? roomy : floors).sort((a, b) => far(a) - far(b))[0];
    const y = floor.top;
    const blocked = (x, z) => this.solids.some((s) => s !== floor && s.enabled && s.top > y + 0.3 && s.bottom < y + 2.4 && inside(s, x, z, -0.9));
    const cam = this.game.camera.position, vx = p.x - cam.x, vz = p.z - cam.z;
    const out = [];
    for (let tries = 0; tries < 4000 && out.length < n; tries++) {
      const a = Math.random() * Math.PI * 2, d = 1.8 + Math.random() * 4.5;
      const x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d;
      const gap = tries < 600 ? 2.4 : tries < 1500 ? 1.8 : tries < 3000 ? 1.2 : 0.6;
      if (!inside(floor, x, z, 0.6) || blocked(x, z)) continue;
      if (tries < 2000 && (x - p.x) * vx + (z - p.z) * vz < 0) continue; // prefer places the camera can see
      if (out.some((o) => Math.hypot(o.x - x, o.z - z) < gap)) continue;
      out.push(V(x, y, z));
    }
    // no open spot close by: spread the rest around the middle of the floor
    const mx = floor.shape === 'cyl' ? floor.x : (floor.min.x + floor.max.x) / 2, mz = floor.shape === 'cyl' ? floor.z : (floor.min.z + floor.max.z) / 2, mr = size(floor) / 2 - 0.8;
    while (out.length < n) { const a = (out.length / n) * Math.PI * 2; out.push(V(mx + Math.cos(a) * mr, y, mz + Math.sin(a) * mr)); }
    return out;
  }

  tickQuest(dt) {
    const q = this.quest, pos = this.game.player.pos;
    q.t += dt; q.cool -= dt;
    for (const o of q.orbs) {
      if (o.got || !o.obj.visible) continue;
      o.age += dt;
      let h = q.mode === 'high' ? 2.5 : 0.9;
      if (q.mode === 'fall') h += Math.max(0, 9 - Math.max(0, o.age) * 6);
      let x = o.spot.x, z = o.spot.z;
      if (q.mode === 'chase') { x += Math.cos(q.t * 2.2 + o.i * 2) * 0.55; z += Math.sin(q.t * 2.2 + o.i * 2) * 0.55; }
      o.obj.position.set(x, o.spot.y + h + Math.sin(q.t * 3 + o.i) * 0.1, z);
      if (q.cool > 0 || Math.hypot(pos.x - x, pos.z - z) > 1.0 || Math.abs(pos.y + 0.7 - o.obj.position.y) > 1.1) continue;
      o.got = true;
      q.got++;
      q.cool = 0.7;
      this.scene.remove(o.obj);
      this.game.fx.burst(this.scene, o.obj.position, o.color, 14);
      Sfx.good();
      this.game.ui.lesson(o.label, o.lesson);
      q.onGet && q.onGet(o.i);
      if (q.mode === 'trail' && q.orbs[o.i + 1]) q.orbs[o.i + 1].obj.visible = true;
      this.game.ui.setObjective(`${q.title} (${q.got}/${q.orbs.length})`);
      if (q.got === q.orbs.length) { this.quest = null; setTimeout(() => q.res(o.i), 1200); return; }
    }
  }

  // Gumdrop tosses candies, each with a little reminder of something from this world
  gateCandies(items) { return this.play('Catch Gumdrop’s candies', items, { mode: 'fall' }); }

  // ----- decor -----
  add(obj, x = 0, y = 0, z = 0) {
    obj.position.set(x, y, z);
    this.scene.add(obj);
    if (obj.userData && obj.userData.update) this.animators.push(obj);
    return obj;
  }

  decorate(cx, cy, cz, r, { trees = 2, flowers = 8, leaf = 0x8fd694, flowerColors = [0xff8fb1, 0xffd166, 0xb79cf0, 0xffffff], avoid = [] } = {}) {
    const rand = mulberry(Math.floor(cx * 13 + cz * 7 + r * 3));
    const ok = (x, z) => avoid.every(([ax, az, ar]) => Math.hypot(x - ax, z - az) > ar);
    for (let i = 0; i < trees; i++) {
      for (let tries = 0; tries < 10; tries++) {
        const a = rand() * Math.PI * 2, d = r * (0.55 + rand() * 0.3);
        const x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
        if (!ok(x, z)) continue;
        this.add(makeTree(0.8 + rand() * 0.5, leaf), x, cy, z);
        // tree trunks are solid so you can't walk through them
        this.solids.push({ shape: 'cyl', x, z, r: 0.3, top: cy + 1.2, bottom: cy, enabled: true, delta: V(), noLand: true });
        break;
      }
    }
    for (let i = 0; i < flowers; i++) {
      const a = rand() * Math.PI * 2, d = r * Math.sqrt(rand()) * 0.9;
      const x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
      if (!ok(x, z)) continue;
      this.add(makeFlower(flowerColors[Math.floor(rand() * flowerColors.length)]), x, cy, z);
    }
  }

  clouds(n = 12, spread = 80, cy = 0, cz = 0) {
    const rand = mulberry(n * 31 + spread);
    for (let i = 0; i < n; i++) {
      const c = makeCloud(0.8 + rand() * 1.6);
      c.position.set((rand() - 0.5) * spread * 2, cy - 12 + rand() * 30, cz + (rand() - 0.5) * spread * 2);
      c.userData.drift = 0.3 + rand() * 0.5;
      this.scene.add(c);
      this.animators.push({ userData: { update: (t) => { c.position.x += Math.sin(t * 0.1 + i) * 0.004 * c.userData.drift * 10; } } });
    }
  }

  label(text, x, y, z, opts) {
    const l = makeLabel(text, opts);
    l.position.set(x, y, z);
    this.scene.add(l);
    return l;
  }

  // ----- portal -----
  portal(x, y, z, color = 0xb79cf0, { faceYaw = 0, locked = false } = {}) {
    const g = new THREE.Group();
    const ringColor = locked ? 0xc9c3cf : color;
    const ring = mesh(new THREE.TorusGeometry(1.35, 0.22, 16, 48), ringColor, { outline: 1.03 });
    ring.position.y = 1.65;
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1.3, 40), new THREE.MeshBasicMaterial({
      map: swirlTexture(locked ? '#bbb' : '#' + new THREE.Color(color).getHexString()), transparent: true, opacity: locked ? 0.35 : 0.9, side: THREE.DoubleSide, depthWrite: false,
    }));
    disc.position.y = 1.65;
    const base = mesh(new THREE.CylinderGeometry(1.0, 1.2, 0.25, 24), 0xfff1dc, { receive: true });
    base.position.y = 0.12;
    g.add(ring, disc, base);
    const orbs = [];
    if (!locked) {
      for (let i = 0; i < 6; i++) {
        const o = mesh(sphere(0.07, 8, 6), 0xffffff, { shadow: false });
        g.add(o); orbs.push(o);
      }
    }
    g.position.set(x, y, z);
    g.rotation.y = faceYaw;
    g.userData.update = (t) => {
      disc.rotation.z = -t * 1.5;
      ring.rotation.z = Math.sin(t) * 0.05;
      orbs.forEach((o, i) => {
        const a = t * 1.5 + (i / orbs.length) * Math.PI * 2;
        o.position.set(Math.cos(a) * 1.35, 1.65 + Math.sin(a) * 1.35, 0.25 * Math.sin(t * 3 + i));
      });
    };
    this.scene.add(g);
    this.animators.push(g);
    return g;
  }

  // ----- triggers & interactables -----
  trigger(x, y, z, r, fn, { once = true, h = 3 } = {}) {
    const t = { pos: V(x, y, z), r, fn, once, h, inside: false, done: false };
    this.triggers.push(t);
    return t;
  }

  checkpoint(x, y, z, r = 3) {
    return this.trigger(x, y, z, r, () => { this.spawn.set(x, y + 0.1, z); }, { once: false });
  }

  interact(obj, r, label, fn) {
    const it = { obj, r, label, fn, enabled: true };
    this.interactables.push(it);
    return it;
  }

  // ----- collectibles -----
  star(x, y, z) {
    const id = `${this.key}:${Math.round(x)},${Math.round(y)},${Math.round(z)}`;
    if (save.stars[id]) return null;
    const m = mesh(starGeometry(0.3, 0.16, 0.1, 0.05), toon(0xffd94a, { emissive: 0x664400 }), { outline: 1.08 });
    m.position.set(x, y, z);
    this.scene.add(m);
    const p = { obj: m, id, base: y, kind: 'star', r: 0.9 };
    this.pickups.push(p);
    return p;
  }

  heart(x, y, z) {
    const g = new THREE.Group();
    for (const s of [-1, 1]) {
      const b = mesh(sphere(0.18), 0xff5c8a, { outline: 1.08 });
      b.position.set(s * 0.12, 0.05, 0);
      g.add(b);
    }
    const tip = mesh(new THREE.ConeGeometry(0.25, 0.35, 16), 0xff5c8a);
    tip.rotation.z = Math.PI;
    tip.position.y = -0.17;
    g.add(tip);
    g.position.set(x, y, z);
    this.scene.add(g);
    const p = { obj: g, base: y, kind: 'heart', r: 0.9 };
    this.pickups.push(p);
    return p;
  }

  // ----- enemies -----
  tokenTot(x, y, z, axis = 'x', range = 2.5, speed = 1.6, factory = makeTokenTot) {
    const m = factory();
    m.position.set(x, y, z);
    this.scene.add(m);
    this.animators.push(m);
    const e = { obj: m, home: V(x, y, z), axis, range, speed, alive: true, t: Math.random() * 6 };
    this.enemies.push(e);
    return e;
  }

  // ----- fog gate (gumdrop + fog wall) -----
  fogGate(x, y, z, width, { color = 0xff9ecf, onOpen } = {}) {
    const fog = new THREE.Group();
    const fogMat = new THREE.MeshBasicMaterial({ color: 0xf4eefa, transparent: true, opacity: 0.85 });
    for (let i = 0; i < 14; i++) {
      const b = new THREE.Mesh(sphere(0.7 + Math.random() * 0.5, 12, 8), fogMat);
      b.position.set((i / 13 - 0.5) * width, 0.6 + Math.random() * 2.4, (Math.random() - 0.5) * 0.6);
      fog.add(b);
    }
    fog.position.set(x, y, z);
    this.scene.add(fog);
    // the invisible wall is much wider than the fog so nobody can jump around its edges
    const ww = Math.max(width, 24);
    const s = this.wall(x - ww / 2, y - 4, z - 0.4, x + ww / 2, y + 6, z + 0.4, null);
    const gum = makeGumdrop(color);
    gum.position.set(x, y, z + 1.4);
    this.scene.add(gum);
    this.animators.push(gum);
    this.solids.push({ shape: 'cyl', x, z: z + 1.4, r: 1.05, top: y + 1.9, bottom: y, enabled: true, delta: V(), noLand: true, gum: true });
    const gumSolid = this.solids[this.solids.length - 1];
    const gate = { fog, wall: s, gum, gumSolid, open: false };
    gate.openGate = () => {
      if (gate.open) return;
      gate.open = true;
      s.enabled = false;
      gumSolid.enabled = false;
      Sfx.portal();
      const start = performance.now();
      const gx = gum.position.x;
      const anim = () => {
        const k = Math.min(1, (performance.now() - start) / 900);
        fog.scale.setScalar(1 - k);
        fog.children.forEach((b) => (b.material.opacity = 0.85 * (1 - k)));
        gum.position.x = gx + k * 2.8;
        gum.position.y = y + Math.sin(k * Math.PI) * 1.5;
        if (k < 1) requestAnimationFrame(anim); else { fog.visible = false; onOpen && onOpen(); }
      };
      anim();
    };
    return gate;
  }

  // ---------- physics ----------
  resolvePlayer(p) {
    const r = p.radius, h = p.height, pos = p.pos, prev = p.prev;
    p.grounded = false;
    let ground = null;
    for (const s of this.solids) {
      if (!s.enabled) continue;
      if (pos.y >= s.top || pos.y + h <= s.bottom) continue;
      if (s.shape === 'cyl') {
        const dx = pos.x - s.x, dz = pos.z - s.z, d2 = dx * dx + dz * dz;
        const R = s.r + r;
        if (d2 >= R * R) continue;
        if (!s.noLand && prev.y >= s.top - 0.08 && p.vel.y <= 0) {
          const landR = s.r + r * 0.3;
          if (d2 < landR * landR) { pos.y = s.top; p.vel.y = 0; p.grounded = true; ground = s; }
          continue;
        }
        if (prev.y + h <= s.bottom + 0.08 && p.vel.y > 0) { pos.y = s.bottom - h; p.vel.y = 0; continue; }
        const d = Math.sqrt(d2) || 0.001;
        pos.x = s.x + (dx / d) * R;
        pos.z = s.z + (dz / d) * R;
      } else {
        const minx = s.min.x - r, maxx = s.max.x + r, minz = s.min.z - r, maxz = s.max.z + r;
        if (pos.x <= minx || pos.x >= maxx || pos.z <= minz || pos.z >= maxz) continue;
        if (!s.noLand && prev.y >= s.top - 0.08 && p.vel.y <= 0) {
          const m = r * 0.3;
          if (pos.x > s.min.x - m && pos.x < s.max.x + m && pos.z > s.min.z - m && pos.z < s.max.z + m) {
            pos.y = s.top; p.vel.y = 0; p.grounded = true; ground = s;
          }
          continue;
        }
        if (prev.y + h <= s.bottom + 0.08 && p.vel.y > 0) { pos.y = s.bottom - h; p.vel.y = 0; continue; }
        const pl = pos.x - minx, pr = maxx - pos.x, pb = pos.z - minz, pf = maxz - pos.z;
        const m = Math.min(pl, pr, pb, pf);
        if (m === pl) pos.x = minx; else if (m === pr) pos.x = maxx; else if (m === pb) pos.z = minz; else pos.z = maxz;
      }
    }
    p.ground = ground;
  }

  // ---------- per-frame ----------
  updateMovers(dt) {
    for (const m of this.movers) {
      const k = 0.5 - 0.5 * Math.cos(((this.t + m.phase) / m.period) * Math.PI * 2);
      const dx = m.offset.x * k - (m.lastX || 0), dy = m.offset.y * k - (m.lastY || 0), dz = m.offset.z * k - (m.lastZ || 0);
      m.lastX = m.offset.x * k; m.lastY = m.offset.y * k; m.lastZ = m.offset.z * k;
      this.moveSolid(m.s, dx, dy, dz);
    }
  }

  animate(t, dt) {
    for (const a of this.animators) a.userData.update(t, dt);
    for (const p of this.pickups) {
      p.obj.rotation.y = t * 2;
      p.obj.position.y = p.base + Math.sin(t * 2.5 + p.base) * 0.15;
    }
  }

  update(dt) {
    const g = this.game, pl = g.player, pos = pl.pos;
    if (this.quest) this.tickQuest(dt);
    // triggers
    for (const tr of this.triggers) {
      if (tr.done) continue;
      const inside = Math.hypot(pos.x - tr.pos.x, pos.z - tr.pos.z) < tr.r && pos.y > tr.pos.y - 1 && pos.y < tr.pos.y + tr.h;
      if (inside && !tr.inside) {
        if (tr.once) tr.done = true;
        tr.fn(tr);
      }
      tr.inside = inside;
    }
    // pickups
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      const d = p.obj.position.distanceTo(V(pos.x, pos.y + 0.7, pos.z));
      if (d < p.r) {
        this.pickups.splice(i, 1);
        this.scene.remove(p.obj);
        g.fx.burst(this.scene, p.obj.position, p.kind === 'star' ? 0xffd94a : 0xff5c8a, 12);
        if (p.kind === 'star') { save.stars[p.id] = 1; persist(); Sfx.star(); g.ui.setStars(Object.keys(save.stars).length); }
        else { pl.hp = Math.min(pl.maxHp, pl.hp + 1); g.ui.setHearts(pl.hp, pl.maxHp); Sfx.good(); }
      }
    }
    // enemies
    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.t += dt;
      const off = Math.sin((e.t * e.speed) / e.range) * e.range;
      const prevX = e.obj.position.x, prevZ = e.obj.position.z;
      e.obj.position.copy(e.home);
      e.obj.position[e.axis] += off;
      const vx = e.obj.position.x - prevX, vz = e.obj.position.z - prevZ;
      if (Math.abs(vx) + Math.abs(vz) > 1e-4) e.obj.rotation.y = Math.atan2(vx, vz);
      const dx = pos.x - e.obj.position.x, dz = pos.z - e.obj.position.z;
      const dy = pos.y - e.obj.position.y;
      if (Math.hypot(dx, dz) < 0.75 && dy > -0.5 && dy < 0.95) {
        if (pl.vel.y < -0.5 && dy > 0.35) {
          e.alive = false;
          pl.vel.y = 10;
          Sfx.stomp();
          g.fx.burst(this.scene, e.obj.position.clone().add(V(0, 0.4, 0)), 0xffc93c, 14);
          const o = e.obj;
          const start = performance.now();
          const squash = () => {
            const k = Math.min(1, (performance.now() - start) / 250);
            o.scale.set(1 + k * 0.6, 1 - k * 0.9, 1 + k * 0.6);
            if (k < 1) requestAnimationFrame(squash); else this.scene.remove(o);
          };
          squash();
        } else {
          pl.hurt(e.obj.position);
        }
      }
    }
    // interactables
    let best = null, bd = Infinity;
    for (const it of this.interactables) {
      if (!it.enabled) continue;
      const p = it.obj.isVector3 ? it.obj : it.obj.position;
      const d = Math.hypot(pos.x - p.x, pos.z - p.z);
      if (d < it.r && Math.abs(pos.y - p.y) < 3 && d < bd) { best = it; bd = d; }
    }
    this.nearest = best;
    g.ui.prompt(best && !this.busy ? best.label : null);
    if (best && !this.busy && g.ui.cooldown <= 0 && hit('KeyE', 'Enter')) {
      this.busy = true;
      g.ui.prompt(null);
      Promise.resolve(best.fn(best)).finally(() => { this.busy = false; });
    }
  }

  // async helper so scripted moments can wait
  wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

  dispose() {
    this.scene.traverse((o) => {
      if (o.geometry && !o.geometry.userData?.shared) o.geometry.dispose?.();
      if (o.material && o.material.map) o.material.map.dispose();
    });
  }
}


export function mulberry(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export { V };
