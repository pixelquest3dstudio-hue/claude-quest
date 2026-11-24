import * as THREE from 'three';
import { mesh, toon, sphere } from './toon.js';
import { Sfx } from './audio.js';
import { shuffle } from './ui.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

/*
  Shared boss brain for Worlds 2+.
  options:
    name, model, arena {x,y,z,r}, hp, radius, height, speaker (dialogue key)
    attacks: list of 'hop' | 'spit' | 'bubbles' | 'rain' | 'charge'  (cycled; dizzy after every `perDizzy` attacks)
    padLabel, padColor, tips [lesson text shown as the beam charges]
    lines: { hit: [after 1st hit, after 2nd hit] }
    shotColor, rainColor, chase (speed)
    onUpdate(boss, dt, t), onDefeat(boss)
*/
export class Boss {
  constructor(level, o) {
    this.L = level; this.g = level.game; this.o = o;
    this.obj = o.model;
    this.hp = o.hp || 3; this.maxHp = this.hp;
    this.state = 'intro'; this.timer = 0; this.count = 0; this.speedMul = 1;
    this.rings = []; this.shots = []; this.marks = []; this.bubbles = [];
    this.pad = null; this.asking = false; this.tipOrder = [];
    this.A = o.arena;
    this.radius = o.radius || 2; this.height = o.height || 3.5;
    this.from = V(); this.to = V(); this.dir = V();
    this.obj.position.set(this.A.x, this.A.y, this.A.z - 4);
    level.scene.add(this.obj);
    if (this.obj.userData.update) level.animators.push(this.obj);
  }

  get inner() { return this.obj.userData.inner || this.obj; }

  begin() { this.state = 'chase'; this.timer = 1.5; this.g.ui.boss(this.o.name, 1); }

  clamp(v, margin = 2.5) {
    const off = V(v.x - this.A.x, 0, v.z - this.A.z);
    if (off.length() > this.A.r - margin) off.setLength(this.A.r - margin);
    v.x = this.A.x + off.x; v.z = this.A.z + off.z;
    return v;
  }

  nextAttack() {
    this.count++;
    const per = this.o.perDizzy || 2;
    if (this.count % (per + 1) === 0) { this.dizzy(); return; }
    const atk = this.o.attacks[(this.count - 1 - Math.floor((this.count - 1) / (per + 1))) % this.o.attacks.length];
    const p = this.g.player;
    if (atk === 'hop') { this.state = 'windup'; this.timer = 0.7; this.after = 'hop'; }
    else if (atk === 'charge') { this.state = 'windup'; this.timer = 0.75; this.after = 'charge'; }
    else if (atk === 'spit') { this.state = 'spit'; this.timer = 2.2; this.spitT = 0; }
    else if (atk === 'bubbles') { this.state = 'cast'; this.timer = 1.0; for (let i = 0; i < 4 + Math.floor(this.speedMul); i++) this.spawnBubble(i); }
    else if (atk === 'rain') { this.state = 'cast'; this.timer = 1.2; this.spawnRain(p); }
  }

  update(dt, t) {
    if (this.state === 'intro' || this.state === 'dead') return;
    const p = this.g.player, o = this.obj, A = this.A, inner = this.inner;
    this.timer -= dt;
    const toP = V(p.pos.x - o.position.x, 0, p.pos.z - o.position.z);
    const dist = toP.length();
    const face = () => { if (dist > 0.01) o.rotation.y = Math.atan2(toP.x, toP.z); };

    if (this.state === 'chase') {
      face();
      if (dist > 0.1) o.position.addScaledVector(toP.clone().normalize(), Math.min(dist, (this.o.chase || 1.6) * this.speedMul * dt));
      inner.position.y = this.o.floaty ? inner.position.y : Math.abs(Math.sin(t * 6)) * 0.2;
      if (this.timer <= 0) this.nextAttack();
    } else if (this.state === 'windup') {
      face();
      const k = 1 - Math.max(0, this.timer) / 0.75;
      inner.scale.set(1 + k * 0.12, 1 - k * 0.2, 1 + k * 0.12);
      if (this.timer <= 0) {
        inner.scale.set(1, 1, 1);
        if (this.after === 'hop') {
          this.state = 'hop'; this.timer = 1.0; this.from.copy(o.position);
          this.to.copy(this.clamp(V(p.pos.x, A.y, p.pos.z), 3)); Sfx.jump();
        } else {
          this.state = 'charge'; this.timer = 0.9;
          this.dir.copy(toP).normalize(); Sfx.dash();
        }
      }
    } else if (this.state === 'hop') {
      const k = 1 - this.timer / 1.0;
      o.position.lerpVectors(this.from, this.to, Math.min(1, k));
      o.position.y = A.y + Math.sin(Math.min(1, k) * Math.PI) * 6;
      if (this.timer <= 0) {
        o.position.y = A.y; Sfx.boom(); this.g.shake(0.6);
        this.g.fx.puff(this.L.scene, o.position.clone(), 0xffffff, 16);
        this.spawnRing(o.position.clone());
        this.state = 'chase'; this.timer = 1.4 / this.speedMul;
      }
    } else if (this.state === 'charge') {
      o.position.addScaledVector(this.dir, 13 * dt);
      const before = o.position.clone();
      this.clamp(o.position, 2.2);
      if (Math.random() < 0.5) this.g.fx.puff(this.L.scene, o.position.clone(), 0xffffff, 1);
      if (before.distanceTo(o.position) > 0.01 || this.timer <= 0) {
        if (before.distanceTo(o.position) > 0.01) { Sfx.boom(); this.g.shake(0.4); }
        this.state = 'chase'; this.timer = 1.3 / this.speedMul;
      }
    } else if (this.state === 'spit') {
      face();
      this.spitT -= dt;
      if (this.spitT <= 0) { this.spitT = 0.45 / this.speedMul; this.spit(p); }
      if (this.timer <= 0) { this.state = 'chase'; this.timer = 1.6 / this.speedMul; }
    } else if (this.state === 'cast') {
      face();
      inner.rotation.y = Math.sin(t * 10) * 0.2;
      if (this.timer <= 0) { inner.rotation.y = 0; this.state = 'chase'; this.timer = 1.8 / this.speedMul; }
    } else if (this.state === 'dizzy') {
      o.rotation.y += dt * 2;
      inner.rotation.z = Math.sin(t * 4) * 0.12;
      if (this.timer <= 0) this.endDizzy();
    }

    this.o.onUpdate && this.o.onUpdate(this, dt, t);

    // touching the boss hurts (unless it's dizzy); landing on top just bounces you
    const top = o.position.y + this.height;
    if (dist < this.radius + 0.3 && p.pos.y < top - 0.5 && this.state !== 'dizzy') p.hurt(o.position);
    if (dist < this.radius && p.pos.y >= top - 0.5 && p.pos.y < top + 0.3 && p.vel.y < 0) { p.vel.y = 11; Sfx.stomp(); }

    this.updateHazards(dt, p);

    if (this.pad && !this.asking) {
      this.pad.rotation.y += dt * 2;
      const d = Math.hypot(p.pos.x - this.pad.position.x, p.pos.z - this.pad.position.z);
      if (d < 1.3 && p.grounded) this.ask();
    }
  }

  // ---------- hazards ----------
  spawnRing(c) {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 48), new THREE.MeshBasicMaterial({ color: this.o.ringColor || 0xffd166, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(c.x, this.A.y + 0.08, c.z);
    this.L.scene.add(m);
    this.rings.push({ m, rad: 1, c, hit: false });
  }

  spit(p) {
    const m = mesh(sphere(0.3, 12, 10), toon(this.o.shotColor || 0xffc93c, { emissive: this.o.shotColor || 0xffc93c, emissiveIntensity: 0.3 }), { outline: 1.1 });
    const start = this.obj.position.clone().add(V(0, this.height * 0.6, 0));
    m.position.copy(start);
    this.L.scene.add(m);
    const target = V(p.pos.x + p.vel.x * 0.5 + (Math.random() - 0.5) * 2, this.A.y, p.pos.z + p.vel.z * 0.5 + (Math.random() - 0.5) * 2);
    const T = 1.0;
    const v = V((target.x - start.x) / T, 0, (target.z - start.z) / T);
    v.y = (this.A.y + 0.3 - start.y + 0.5 * 22 * T * T) / T;
    this.shots.push({ m, v, life: 3, landed: false });
    Sfx.pop();
  }

  spawnBubble(i) {
    const m = new THREE.Mesh(sphere(0.45, 16, 12), new THREE.MeshToonMaterial({ color: 0xbff3ff, transparent: true, opacity: 0.75 }));
    const shine = new THREE.Mesh(sphere(0.12, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    shine.position.set(-0.15, 0.18, 0.3);
    m.add(shine);
    const a = (i / 5) * Math.PI * 2;
    m.position.copy(this.obj.position).add(V(Math.cos(a) * 2.5, 1.2, Math.sin(a) * 2.5));
    this.L.scene.add(m);
    this.bubbles.push({ m, life: 5.5, speed: 2.4 + Math.random() * 0.8 });
    Sfx.pop();
  }

  spawnRain(p) {
    const spots = [V(p.pos.x, 0, p.pos.z)];
    for (let i = 0; i < 4 + Math.floor(this.speedMul); i++) spots.push(V(p.pos.x + (Math.random() - 0.5) * 9, 0, p.pos.z + (Math.random() - 0.5) * 9));
    for (const s of spots) {
      this.clamp(s, 1.2);
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.3, 32), new THREE.MeshBasicMaterial({ color: 0xff5c8a, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(s.x, this.A.y + 0.07, s.z);
      const rock = mesh(new THREE.DodecahedronGeometry(0.6, 0), this.o.rainColor || 0xc9b6ff, { outline: 1.08 });
      rock.position.set(s.x, this.A.y + 14, s.z);
      this.L.scene.add(ring, rock);
      this.marks.push({ ring, rock, t: 1.3, pos: s });
    }
  }

  updateHazards(dt, p) {
    const A = this.A, sc = this.L.scene;
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.rad += dt * 7;
      r.m.scale.set(r.rad, r.rad, 1);
      r.m.material.opacity = Math.max(0, 1 - r.rad / 16);
      const pd = Math.hypot(p.pos.x - r.c.x, p.pos.z - r.c.z);
      if (!r.hit && Math.abs(pd - r.rad) < 0.55 && p.pos.y - A.y < 0.55) { r.hit = true; p.hurt(r.c); }
      if (r.rad > 16) { sc.remove(r.m); this.rings.splice(i, 1); }
    }
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const q = this.shots[i];
      q.life -= dt;
      if (!q.landed) {
        q.v.y -= 22 * dt;
        q.m.position.addScaledVector(q.v, dt);
        if (q.m.position.y <= A.y + 0.3) { q.landed = true; q.m.position.y = A.y + 0.3; Sfx.land(); }
      } else q.m.position.addScaledVector(q.v, dt * 0.4);
      if (q.m.position.distanceTo(V(p.pos.x, p.pos.y + 0.6, p.pos.z)) < 0.75) { p.hurt(q.m.position); q.life = 0; }
      if (q.life <= 0 || Math.hypot(q.m.position.x - A.x, q.m.position.z - A.z) > A.r) {
        this.g.fx.puff(sc, q.m.position.clone(), this.o.shotColor || 0xffd166, 5);
        sc.remove(q.m); this.shots.splice(i, 1);
      }
    }
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      b.life -= dt;
      const to = V(p.pos.x - b.m.position.x, p.pos.y + 0.8 - b.m.position.y, p.pos.z - b.m.position.z);
      const d = to.length();
      b.m.position.addScaledVector(to.normalize(), b.speed * dt);
      b.m.scale.setScalar(1 + Math.sin(b.life * 6) * 0.06);
      if (d < 0.85) { p.hurt(b.m.position); b.life = 0; }
      if (b.life <= 0) { this.g.fx.burst(sc, b.m.position, 0xbff3ff, 8); Sfx.pop(); sc.remove(b.m); this.bubbles.splice(i, 1); }
    }
    for (let i = this.marks.length - 1; i >= 0; i--) {
      const mk = this.marks[i];
      mk.t -= dt;
      mk.ring.scale.setScalar(1 + Math.sin(mk.t * 20) * 0.05);
      mk.rock.position.y = A.y + Math.max(0.4, 14 * Math.max(0, mk.t) / 1.3);
      mk.rock.rotation.x += dt * 5;
      if (mk.t <= 0) {
        if (!mk.hit) {
          mk.hit = true;
          Sfx.boom(); this.g.shake(0.2);
          this.g.fx.puff(sc, mk.rock.position.clone(), 0xffffff, 6);
          if (Math.hypot(p.pos.x - mk.pos.x, p.pos.z - mk.pos.z) < 1.3 && p.pos.y - A.y < 1.2) p.hurt(mk.pos);
          sc.remove(mk.ring);
        }
        if (mk.t < -0.6) { sc.remove(mk.rock); this.marks.splice(i, 1); }
      }
    }
  }

  clearHazards() {
    const sc = this.L.scene;
    for (const r of this.rings) sc.remove(r.m);
    for (const q of this.shots) sc.remove(q.m);
    for (const b of this.bubbles) sc.remove(b.m);
    for (const mk of this.marks) { sc.remove(mk.ring); sc.remove(mk.rock); }
    this.rings = []; this.shots = []; this.bubbles = []; this.marks = [];
  }

  // ---------- dizzy + power pad ----------
  dizzy() {
    const A = this.A, p = this.g.player;
    this.state = 'dizzy'; this.timer = 7;
    if (this.obj.userData.dizzy) this.obj.userData.dizzy.visible = true;
    const away = V(A.x - this.obj.position.x, 0, A.z - this.obj.position.z);
    if (away.length() < 0.5) away.set(p.pos.x - A.x, 0, p.pos.z - A.z);
    if (away.length() < 0.5) away.set(0, 0, 1);
    away.setLength(Math.min(7, A.r - 3));
    const pad = new THREE.Group();
    const col = this.o.padColor || 0xffd166;
    const base = mesh(new THREE.CylinderGeometry(1.2, 1.3, 0.2, 32), toon(col, { emissive: col, emissiveIntensity: 0.35 }), { receive: true });
    base.position.y = 0.1;
    const ring = mesh(new THREE.TorusGeometry(1.25, 0.08, 8, 32), 0xffffff);
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.25;
    pad.add(base, ring);
    const lab = this.L.label(this.o.padLabel || 'Power Pad', 0, 1.6, 0, { size: 0.32, border: '#' + new THREE.Color(col).getHexString() });
    this.L.scene.remove(lab);
    pad.add(lab);
    pad.position.set(A.x + away.x, A.y, A.z + away.z);
    this.L.scene.add(pad);
    this.pad = pad;
    Sfx.portal();
    this.g.ui.toast(`${this.o.name} is dizzy! Step on the glowing <b>${this.o.padLabel || 'Power Pad'}</b>!`, 2600);
  }

  endDizzy() {
    if (this.obj.userData.dizzy) this.obj.userData.dizzy.visible = false;
    this.inner.rotation.z = 0;
    if (this.pad) { this.L.scene.remove(this.pad); this.pad = null; }
    if (this.state === 'dead') return;
    this.state = 'chase'; this.timer = 1.5;
  }

  // stepping on the pad charges Sparky's beam and shows one lesson from this world
  async ask() {
    this.asking = true;
    this.timer = 99; // stay dizzy until the beam lands
    this.g.player.invuln = Math.max(this.g.player.invuln, 1.5);
    if (!this.tipOrder.length) this.tipOrder = shuffle(this.o.tips.map((_, i) => i));
    this.g.ui.lesson('✨ Clear-thinking beam!', this.o.tips[this.tipOrder.pop()]);
    Sfx.good();
    await this.beam();
    this.asking = false;
  }

  async beam() {
    const o = this.obj, sp = this.g.sparky.position;
    const from = sp.clone(), to = o.position.clone().add(V(0, this.height * 0.6, 0));
    const len = from.distanceTo(to);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, len, 12), new THREE.MeshBasicMaterial({ color: 0xffb36b, transparent: true, opacity: 0.9 }));
    beam.position.copy(from).lerp(to, 0.5);
    beam.lookAt(to);
    beam.rotateX(Math.PI / 2);
    this.L.scene.add(beam);
    Sfx.beam(); this.g.shake(0.4);
    await this.L.wait(550);
    this.L.scene.remove(beam);
    this.g.fx.burst(this.L.scene, to, 0xffb36b, 30);
    Sfx.boom();
    this.hp--;
    this.speedMul += 0.25;
    this.g.ui.boss(this.o.name, this.hp / this.maxHp);
    // flash
    this.inner.scale.set(1.25, 0.8, 1.25);
    setTimeout(() => this.inner.scale.set(1, 1, 1), 180);
    if (this.hp <= 0) { await this.defeat(); return; }
    while (this.g.ui.blocking || this.g.defeating) await this.L.wait(100);
    await this.g.ui.say([this.o.speaker, this.o.lines.hit[this.maxHp - this.hp - 1] || 'Hmph!']);
    if (this.hp === 1) this.L.heart(this.A.x - 5, this.A.y + 1, this.A.z + 5);
    this.endDizzy();
  }

  async defeat() {
    this.state = 'dead';
    this.endDizzy();
    this.clearHazards();
    this.g.ui.boss(null);
    this.g.fx.confetti(this.L.scene, this.obj.position.clone().add(V(0, 2, 0)));
    Sfx.win();
    await this.o.onDefeat(this);
  }

  // when the player runs out of hearts: keep boss progress, clear attacks, reset position
  reset() {
    if (this.state === 'dead') return;
    this.clearHazards();
    if (this.state !== 'dizzy') { this.state = 'chase'; this.timer = 2.5; }
    this.obj.position.set(this.A.x, this.A.y, this.A.z - 4);
  }
}
