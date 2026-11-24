import * as THREE from 'three';
import { Level, V } from '../level.js';
import { mesh, toon, sphere, basic } from '../toon.js';
import { makeHummingbird, makeBunny, makeOwl, makeDragon, makePiggy, makeTokenMuncher, makeFace } from '../creatures.js';
import { Sfx } from '../audio.js';
import { blobSVG } from '../portraits.js';

// WORLD 1 - MODEL MEADOW
// Lessons (from "Use Claude Better Than 99% of People", 1:22 to 4:13):
//   free vs paid plans, the models (Haiku / Sonnet / Opus / Fable) and the effort level.
// Boss: the Token Muncher, who grows every time effort is wasted.

const MODELS = ['Haiku', 'Sonnet', 'Opus', 'Fable'];
const EFFORTS = ['Low', 'Medium', 'High', 'Extra high'];

const STATIONS = [
  { task: 'Write a friendly reply\nto a client’s email', model: 1, effort: 1,
    why: 'An everyday task, so <b>Sonnet</b>, the daily driver, is a great fit.',
    effortWhy: '<b>Medium</b> is enough for daily tasks. Pushing it further would just waste tokens.' },
  { task: 'Dig through a big sales\nspreadsheet and find trends', model: 2, effort: 2,
    why: 'A harder problem that needs more reasoning, so <b>Opus</b> steps in.',
    effortWhy: '<b>High</b> is the go-to for coding and analysis.' },
  { task: 'An agent working for hours on\na big multi-step coding project', model: 2, effort: 3,
    why: 'Long, multi-step work is what <b>Opus</b> is made for.',
    effortWhy: '<b>Extra high</b> is for long agentic or multi-step coding sessions like this.' },
  { task: 'Opus tried three times and is\nSTILL stuck on a super hard problem', model: 3, effort: null,
    why: '<b>Fable</b> is very token-hungry, so save it for when Opus is stuck.' },
];

export class World1 extends Level {
  build() {
    this.env({ top: '#8fd3ff', bottom: '#fff6d6', fog: 0xeefbe8 });
    this.clouds(18, 90, 0, -45);
    const ui = this.game.ui;
    ui.speakers.haiku = { name: 'Haiku the Hummingbird', color: '#3fb6a8', svg: blobSVG('#5fd3c6'), pitch: 2 };
    ui.speakers.sonnet = { name: 'Sonnet the Bunny', color: '#ff8fb1', svg: blobSVG('#fff3f8'), pitch: 1.5 };
    ui.speakers.opus = { name: 'Opus the Owl', color: '#7b5bd0', svg: blobSVG('#9b7bd4'), pitch: 0.8 };
    ui.speakers.fable = { name: 'Fable the Dragon', color: '#f08a5d', svg: blobSVG('#ff9f6e'), pitch: 0.7 };
    ui.speakers.piggy = { name: 'Penny the Plan Piggy', color: '#ff7aa6', svg: blobSVG('#ffb3c7'), pitch: 1.2 };
    ui.speakers.gum = { name: 'Gumdrop the Gatekeeper', color: '#ff7aa6', svg: blobSVG('#ffb3d1') };
    ui.speakers.muncher = { name: 'Token Muncher', color: '#7b5bd0', svg: blobSVG('#9d7bea'), pitch: 0.6 };
    this.met = new Set();
    this.solved = 0;
    this.stage = 'meet';

    // A. meadow
    this.platform({ x: 0, y: 0, z: 0, r: 10, h: 2 });
    this.decorate(0, 0, 0, 10, { trees: 4, flowers: 30, avoid: [[0, 4, 3], [-6, -3, 2], [-2, -6, 2], [2, -6, 2], [6, -3, 2], [7, 4, 2], [0, -9, 3]] });
    this.spawn.set(0, 0.1, 5);
    this.checkpoint(0, 0, 2, 8);
    this.label('Model Meadow', 0, 4.5, 8, { size: 0.8, border: '#8fd694' });
    const critters = [
      ['haiku', makeHummingbird(), -6, -3, 'Meet Haiku'],
      ['sonnet', makeBunny(), -2, -6, 'Meet Sonnet'],
      ['opus', makeOwl(), 2, -6, 'Meet Opus'],
      ['fable', makeDragon(), 6, -3, 'Meet Fable'],
    ];
    for (const [k, m, x, z, lab] of critters) {
      const ped = mesh(new THREE.CylinderGeometry(0.8, 0.9, 0.4, 20), 0xfff1dc, { outline: 1.04 });
      ped.position.set(x, 0.2, z);
      this.scene.add(ped);
      this.solids.push({ shape: 'cyl', x, z, r: 0.9, top: 0.4, bottom: 0, enabled: true, delta: V() });
      m.rotation.y = Math.atan2(-x, 5 - z) * 0.6;
      this.add(m, x, 0.4, z);
      this.label(k[0].toUpperCase() + k.slice(1), x, 2.8, z, { size: 0.34 });
      this.interact(V(x, 0, z), 2.4, lab, () => this.meet(k));
    }
    const piggy = this.add(makePiggy(), 7, 0, 4);
    piggy.rotation.y = -1;
    this.solids.push({ shape: 'cyl', x: 7, z: 4, r: 0.6, top: 1, bottom: 0, enabled: true, delta: V(), noLand: true });
    this.interact(piggy, 2.2, 'Talk to Penny', () => this.piggyTalk());
    this.star(-8, 0.8, 4);

    // fog wall until you meet all four critters
    this.fog = this.fogGateFog(0, 0, -9.6, 12);

    // B. path to station 1
    this.platform({ x: 0, y: 0, z: -13, r: 1.6, h: 1 });
    this.platform({ x: 0, y: 0.3, z: -18, r: 1.6, h: 1 });
    this.platform({ x: 0, y: 0.5, z: -24, r: 4 });
    this.checkpoint(0, 0.5, -24, 3.5);
    this.tokenTot(0, 0.5, -22, 'x', 2.6, 1.5);
    this.star(0, 2.2, -15.5);
    this.station(0, 0, 0.5, -26);

    // C. station 2 (revealed after station 1)
    this.reveals = [[], [], [], []];
    this.reveals[0].push(this.hiddenPlatform({ x: 3.3, y: 1, z: -28, r: 1.3, h: 1 }));
    this.reveals[0].push(this.hiddenPlatform({ x: 6.7, y: 1.5, z: -32, r: 1.3, h: 1 }));
    this.platform({ x: 10, y: 2, z: -36, r: 4 });
    this.checkpoint(10, 2, -36, 3.5);
    this.tokenTot(10, 2, -35, 'x', 2.5, 1.7);
    this.tokenTot(10, 2, -37.5, 'z', 1.5, 1.3);
    this.station(1, 10, 2, -38);
    this.star(13, 3, -33);

    // D. moving platform to station 3 (revealed after station 2)
    const mp = this.hiddenPlatform({ shape: 'box', x: 10, y: 2, z: -41.6, w: 2.6, d: 2.6, h: 0.6, top: 0xffe08a, side: 0xffc857, island: false });
    this.reveals[1].push(mp);
    this.mover(mp, V(-10, 2, -5), 7);
    this.platform({ x: 0, y: 4, z: -52, r: 4.5 });
    this.checkpoint(0, 4, -52, 4);
    this.tokenTot(-1.5, 4, -50, 'z', 2, 1.6);
    this.station(2, 0, 4, -53.5);
    this.star(4, 6.5, -46);

    // E. rising steps to station 4 (revealed after station 3)
    this.reveals[2].push(this.hiddenPlatform({ x: -3.3, y: 5, z: -55.3, r: 1.2, h: 1 }));
    this.reveals[2].push(this.hiddenPlatform({ x: -6.7, y: 6, z: -58.7, r: 1.2, h: 1 }));
    this.platform({ x: -10, y: 7, z: -62, r: 3.5 });
    this.checkpoint(-10, 7, -62, 3);
    this.station(3, -10, 7, -63.2);
    this.star(-13, 8.5, -60);

    // F. steps to the gate (revealed after station 4)
    this.reveals[3].push(this.hiddenPlatform({ x: -6.7, y: 7, z: -65.3, r: 1.3, h: 1 }));
    this.reveals[3].push(this.hiddenPlatform({ x: -3.3, y: 7, z: -68.7, r: 1.3, h: 1 }));
    this.platform({ x: 0, y: 7, z: -72, r: 3.6 });
    this.checkpoint(0, 7, -72, 3);
    this.gate = this.fogGate(0, 7, -76, 9, { color: 0xffb3d1 });
    this.interact(this.gate.gum, 3, 'Talk to Gumdrop', () => this.gateTalk());

    // G. boss arena
    this.arena = { x: 0, y: 7, z: -91, r: 13 };
    this.platform({ x: 0, y: 7, z: -91, r: 13, h: 2.5, top: 0xb8e6a8 });
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const f = mesh(sphere(0.5, 12, 8), [0xff8fb1, 0xffd166, 0xb79cf0][i % 3]);
      f.position.set(Math.cos(a) * 12.3, 7.3, -91 + Math.sin(a) * 12.3);
      f.scale.y = 0.6;
      this.scene.add(f);
    }
    this.trigger(0, 7, -91, 10.5, () => this.startBoss());
    this.killY = -10;
    this.setObj();
  }

  // a fog wall without a gatekeeper (opens after meeting the critters)
  fogGateFog(x, y, z, width) {
    const g = this.fogGate(x, y, z, width, { color: 0xffffff });
    g.gum.visible = false;
    g.gumSolid.enabled = false;
    return g;
  }

  async meet(k) {
    const ui = this.game.ui;
    const lines = {
      haiku: [['haiku', 'Bzzzip! I’m <b>Haiku</b>, the FASTEST critter in the meadow! Zoom zoom!'], ['haiku', 'My answers are a bit lighter though. Honestly? The video says the step up to Sonnet is usually worth it.']],
      sonnet: [['sonnet', 'Hi hi! I’m <b>Sonnet</b>! I’m pretty quick AND good at reasoning.'], ['sonnet', 'That makes me a great <b>daily driver</b>. On a Pro plan, use me for everyday stuff, then call Opus for the harder problems!']],
      opus: [['opus', 'Hoo. I am <b>Opus</b>. I tackle the <b>bigger work</b>.'], ['opus', 'Long, multi-step tasks are my specialty, and I check my work as I go. Call me when a problem needs more reasoning.']],
      fable: [['fable', 'Rawr~ I’m <b>Fable</b>, the mightiest critter of all!'], ['fable', 'But I’m SUPER token-hungry, and usually I’m not that much better than Opus. Only wake me up when you’re <b>stuck on something with Opus</b>. Then… snooze.']],
    }[k];
    await ui.say(lines);
    if (!this.met.has(k)) {
      this.met.add(k);
      Sfx.good();
      if (this.met.size === 4) {
        await ui.say([
          ['sparky', 'You met all four model critters! So: Haiku is fastest, Sonnet is the daily driver, Opus is for bigger work, and Fable is for when Opus is stuck.'],
          ['sparky', 'But picking a model is only half of it. There’s also the <b>effort level</b>: how much thinking time Claude spends, basically how many tokens it throws at a task.'],
          ['sparky', 'The video says <b>Medium</b> is great for most daily tasks, <b>High</b> is for coding and analysis, and <b>Extra high</b> is for long agentic or multi-step coding work.'],
          ['sparky', 'And more thinking doesn’t always mean better! Too much effort is slower and can overcomplicate things. The fog is lifting. Let’s go help those gadgets!'],
        ]);
        this.fog.openGate();
        this.stage = 'stations';
      }
    }
    this.setObj();
  }

  async piggyTalk() {
    await this.game.ui.say([
      ['piggy', 'Oink! I’m Penny, and I know all about <b>plans</b>. Claude has a generous free plan. It’s a great way to try it out!'],
      ['piggy', 'A <b>paid plan</b> gets you a lot more usage, the reasoning models, and access to <b>Cowork</b> and <b>Code</b>. That’s where the agents live!'],
      ['piggy', 'And pick your model wisely. If you burn through your usage, you have to wait for it to reset. Oink oink!'],
    ]);
  }

  // ----- gadget stations -----
  station(i, x, y, z) {
    const st = STATIONS[i];
    const g = new THREE.Group();
    const body = mesh(new THREE.BoxGeometry(1.8, 1.6, 1.1), 0x9ad0c2, { outline: 1.04 });
    body.position.y = 0.8;
    const screen = mesh(new THREE.PlaneGeometry(1.3, 0.8), basic(0x2b1d3a));
    screen.position.set(0, 1.0, 0.56);
    const face = makeFace({ eyeR: 0.12, spacing: 0.22 });
    face.position.set(0, 1.05, 0.58);
    const dial = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.1, 20), 0xffd166, { outline: 1.08 });
    dial.rotation.x = Math.PI / 2;
    dial.position.set(0, 0.35, 0.58);
    const needle = mesh(new THREE.BoxGeometry(0.04, 0.18, 0.04), 0xff5c8a);
    needle.position.set(0, 0.42, 0.65);
    const chimney = mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.5, 10), 0x7fb7a8);
    chimney.position.set(0.55, 1.85, 0);
    g.add(body, screen, face, dial, needle, chimney);
    g.userData.update = (t) => {
      face.userData.eyes.forEach((e) => (e.scale.y = st.solved ? 0.35 : ((t + i) % 3.2 < 0.12 ? 0.1 : 1)));
      needle.rotation.z = st.solved ? Math.sin(t * 6) * 0.3 : Math.sin(t * 0.8 + i) * 1.2;
      body.position.y = 0.8 + (st.solved ? Math.abs(Math.sin(t * 5)) * 0.08 : 0);
    };
    this.add(g, x, y, z);
    this.solids.push({ shape: 'box', min: V(x - 0.9, y, z - 0.55), max: V(x + 0.9, y + 1.6, z + 0.55), top: y + 1.6, bottom: y, enabled: true, delta: V() });
    this.label(`Gadget ${i + 1}\n${st.task}`, x, y + 3.1, z, { size: 0.3, border: '#9ad0c2' });
    st.group = g; st.solved = false;
    st.it = this.interact(V(x, y, z + 0.8), 2.4, `Power up Gadget ${i + 1}`, () => this.solveStation(i, x, y, z));
  }

  async solveStation(i, x, y, z) {
    const ui = this.game.ui;
    const st = STATIONS[i];
    if (st.solved) return;
    if (this.stage === 'meet') { await ui.say(['sparky', 'Let’s meet the model critters first!']); return; }
    if (i > this.solved) { await ui.say(['sparky', 'This gadget is still asleep. Let’s power up the earlier ones first!']); return; }
    await ui.say(['sparky', `This gadget’s job: <b>${st.task.replace('\n', ' ')}</b>. Grab the critter, then fill up its thinking sparks!`]);
    const items = [[`${['🐦', '🐰', '🦉', '🐉'][st.model]} ${MODELS[st.model]}`, st.why]];
    if (st.effort != null) for (let k = 0; k <= st.effort; k++) items.push([`✨ ${EFFORTS[k]}`, k === st.effort ? st.effortWhy : `Effort is now <b>${EFFORTS[k]}</b>. A little more…`, 0xffd166]);
    await this.play(`Power up Gadget ${i + 1}`, items, { mode: 'trail' });
    st.solved = true;
    st.it.enabled = false;
    this.solved++;
    Sfx.good();
    this.game.fx.confetti(this.scene, V(x, y + 2, z));
    ui.toast(st.effort != null ? `✨ ${MODELS[st.model]} + ${EFFORTS[st.effort]} effort. Perfect fit!` : `✨ ${MODELS[st.model]} to the rescue!`, 2400);
    for (const [k, s] of this.reveals[i].entries()) this.reveal(s, 300 + k * 350);
    if (i === 3) await ui.say(['sparky', 'All four gadgets are humming! I can see a gate up ahead, and something BIG chomping behind it…']);
    this.setObj();
  }

  async gateTalk() {
    const ui = this.game.ui;
    if (this.gate.open) return;
    if (this.solved < 4) { await ui.say(['gum', 'Hiya again! The gate only opens once all four gadgets are humming. Go go go!']); return; }
    await ui.say(['gum', 'Ooh, every gadget is humming! Catch my candies and I’ll scoot. But careful, the <b>Token Muncher</b> is behind me… 😬']);
    await this.gateCandies([
      ['🐷 Plans', 'A <b>paid plan</b> gives you more usage, the reasoning models, and <b>Cowork</b> and <b>Code</b>.'],
      ['🎚️ Effort', 'The <b>effort level</b> is how much thinking time (tokens) Claude spends.'],
      ['🦉 Opus', '<b>Opus</b> handles long, multi-step tasks and checks its work as it goes.'],
    ]);
    await ui.say(['gum', 'Good luck in there, and use the right effort, okay?']);
    this.gate.openGate();
    this.setObj();
  }

  // ---------------- BOSS: TOKEN MUNCHER ----------------
  async startBoss() {
    const ui = this.game.ui;
    const A = this.arena;
    this.spawn.set(0, A.y + 0.1, A.z + 10.5);
    this.stage = 'boss';
    const b = makeTokenMuncher();
    b.position.set(A.x, A.y, A.z - 3);
    this.scene.add(b);
    this.animators.push(b);
    this.boss = { obj: b, hp: 3, size: 1, state: 'intro', timer: 0, attacks: 0, vel: V(), from: V(), to: V(), projectiles: [], rings: [], pad: null, speedMul: 1 };
    this.game.player.frozen = true;
    this.game.sparkyOverride = V(2, A.y + 3, A.z + 8);
    await this.wait(500);
    ui.banner('Token Muncher', 'BOSS');
    await this.wait(1200);
    await ui.say([
      ['muncher', 'OM NOM NOM! Who dares enter my snack bowl?!'],
      ['muncher', 'Every time someone cranks the effort to MAX on a teeny tiny task, all those wasted tokens come to ME! And I get BIGGER! 🍔'],
      ['sparky', '{name}! Dodge its attacks. <b>Jump</b> over the shockwaves! When it gets dizzy, step on the glowing <b>Effort Pad</b> and I’ll zap it with a clear-thinking beam!'],
    ]);
    this.game.sparkyOverride = null;
    this.game.player.frozen = false;
    this.boss.state = 'chase';
    this.boss.timer = 1.5;
    ui.boss('Token Muncher', 1);
    this.setObj();
  }

  tick(dt, t) {
    const B = this.boss;
    if (!B || B.state === 'intro' || B.state === 'dead') return;
    const A = this.arena, p = this.game.player, o = B.obj;
    const bossR = 2.1 * B.size;
    B.timer -= dt;
    const toP = V(p.pos.x - o.position.x, 0, p.pos.z - o.position.z);
    const dist = toP.length();
    const inner = o.userData.inner;

    if (B.state === 'chase') {
      if (dist > 0.1) {
        o.rotation.y = Math.atan2(toP.x, toP.z);
        o.position.addScaledVector(toP.normalize(), Math.min(dist, 1.6 * B.speedMul * dt));
      }
      inner.position.y = Math.abs(Math.sin(t * 6)) * 0.25;
      if (B.timer <= 0) {
        B.attacks++;
        if (B.attacks % 3 === 0) this.bossDizzy();
        else if (B.attacks % 3 === 1) { B.state = 'windup'; B.timer = 0.7; }
        else { B.state = 'spit'; B.timer = 2.2; B.spitT = 0; }
      }
    } else if (B.state === 'windup') {
      const k = 1 - B.timer / 0.7;
      inner.scale.set(1 + k * 0.15, 1 - k * 0.25, 1 + k * 0.15);
      o.rotation.y = Math.atan2(toP.x, toP.z);
      if (B.timer <= 0) {
        inner.scale.set(1, 1, 1);
        B.state = 'hop'; B.timer = 1.0; B.from.copy(o.position);
        const tgt = V(p.pos.x, A.y, p.pos.z);
        const off = V(tgt.x - A.x, 0, tgt.z - A.z);
        if (off.length() > A.r - 3) off.setLength(A.r - 3);
        B.to.set(A.x + off.x, A.y, A.z + off.z);
        Sfx.jump();
      }
    } else if (B.state === 'hop') {
      const k = 1 - B.timer / 1.0;
      o.position.lerpVectors(B.from, B.to, k);
      o.position.y = A.y + Math.sin(k * Math.PI) * 6;
      if (B.timer <= 0) {
        o.position.y = A.y;
        Sfx.boom(); this.game.shake(0.6);
        this.game.fx.puff(this.scene, o.position.clone(), 0xffffff, 16);
        this.spawnRing(o.position.clone());
        B.state = 'chase'; B.timer = 1.4 / B.speedMul;
      }
    } else if (B.state === 'spit') {
      B.spitT -= dt;
      const mouth = o.userData.mouth;
      mouth.scale.setScalar(1.3);
      o.rotation.y = Math.atan2(toP.x, toP.z);
      if (B.spitT <= 0) {
        B.spitT = 0.45 / B.speedMul;
        this.spitToken(o, p);
      }
      if (B.timer <= 0) { mouth.scale.setScalar(1); B.state = 'chase'; B.timer = 1.6 / B.speedMul; }
    } else if (B.state === 'dizzy') {
      o.rotation.y += dt * 2;
      inner.rotation.z = Math.sin(t * 4) * 0.15;
      if (B.timer <= 0) this.endDizzy(false);
    }

    // touching the boss hurts (unless dizzy)
    const top = o.position.y + 3.8 * B.size;
    if (dist < bossR + 0.3 && p.pos.y < top - 0.5 && B.state !== 'dizzy') p.hurt(o.position);
    // bounce off the top harmlessly
    if (dist < bossR && p.pos.y >= top - 0.5 && p.pos.y < top + 0.2 && p.vel.y < 0) { p.vel.y = 11; Sfx.stomp(); }

    // shockwave rings
    for (let i = B.rings.length - 1; i >= 0; i--) {
      const r = B.rings[i];
      r.rad += dt * 7;
      r.mesh.scale.set(r.rad, r.rad, 1);
      r.mesh.material.opacity = Math.max(0, 1 - r.rad / 16);
      const pd = Math.hypot(p.pos.x - r.c.x, p.pos.z - r.c.z);
      if (!r.hit && Math.abs(pd - r.rad) < 0.55 && p.pos.y - A.y < 0.55) { r.hit = true; p.hurt(r.c); }
      if (r.rad > 16) { this.scene.remove(r.mesh); B.rings.splice(i, 1); }
    }
    // token projectiles
    for (let i = B.projectiles.length - 1; i >= 0; i--) {
      const q = B.projectiles[i];
      q.life -= dt;
      if (!q.landed) {
        q.v.y -= 22 * dt;
        q.m.position.addScaledVector(q.v, dt);
        q.m.rotation.x += dt * 10;
        if (q.m.position.y <= A.y + 0.35) { q.landed = true; q.m.position.y = A.y + 0.35; q.v.y = 0; Sfx.land(); }
      } else {
        q.m.position.addScaledVector(q.v, dt * 0.5);
        q.m.rotation.y += dt * 8;
      }
      if (q.m.position.distanceTo(V(p.pos.x, p.pos.y + 0.6, p.pos.z)) < 0.75) { p.hurt(q.m.position); q.life = 0; }
      if (q.life <= 0 || Math.hypot(q.m.position.x - A.x, q.m.position.z - A.z) > A.r) {
        this.game.fx.puff(this.scene, q.m.position.clone(), 0xffd166, 5);
        this.scene.remove(q.m); B.projectiles.splice(i, 1);
      }
    }
    // effort pad
    if (B.pad && !this.asking) {
      const d = Math.hypot(p.pos.x - B.pad.position.x, p.pos.z - B.pad.position.z);
      B.pad.rotation.y += dt * 2;
      if (d < 1.3 && p.grounded) this.chargeBeam();
    }
  }

  spawnRing(c) {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 48), new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(c.x, this.arena.y + 0.08, c.z);
    this.scene.add(m);
    this.boss.rings.push({ mesh: m, rad: 1, c, hit: false });
  }

  spitToken(o, p) {
    const m = mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.12, 16), 0xffc93c, { outline: 1.1 });
    m.rotation.z = Math.PI / 2;
    const start = o.position.clone().add(V(0, 2.2 * this.boss.size, 0));
    m.position.copy(start);
    this.scene.add(m);
    const target = V(p.pos.x + p.vel.x * 0.5 + (Math.random() - 0.5) * 2, this.arena.y, p.pos.z + p.vel.z * 0.5 + (Math.random() - 0.5) * 2);
    const T = 1.0;
    const v = V((target.x - start.x) / T, 0, (target.z - start.z) / T);
    v.y = (target.y + 0.35 - start.y + 0.5 * 22 * T * T) / T;
    this.boss.projectiles.push({ m, v, life: 3.2, landed: false });
    Sfx.pop();
  }

  bossDizzy() {
    const B = this.boss, A = this.arena;
    B.state = 'dizzy'; B.timer = 7;
    B.obj.userData.dizzy.visible = true;
    const p = this.game.player;
    // pad appears on the far side of the arena from the boss
    const away = V(A.x - B.obj.position.x, 0, A.z - B.obj.position.z);
    if (away.length() < 0.5) away.set(p.pos.x - A.x, 0, p.pos.z - A.z);
    if (away.length() < 0.5) away.set(0, 0, 1);
    away.setLength(7);
    const pad = new THREE.Group();
    const base = mesh(new THREE.CylinderGeometry(1.2, 1.3, 0.2, 32), toon(0xffd166, { emissive: 0xffa000, emissiveIntensity: 0.4 }), { receive: true });
    base.position.y = 0.1;
    const ring = mesh(new THREE.TorusGeometry(1.25, 0.08, 8, 32), 0xffffff);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.25;
    pad.add(base, ring);
    const lab = this.label('Effort Pad', 0, 1.6, 0, { size: 0.32, border: '#ffd166' });
    this.scene.remove(lab);
    pad.add(lab);
    pad.position.set(A.x + away.x, A.y, A.z + away.z);
    this.scene.add(pad);
    B.pad = pad;
    Sfx.portal();
    this.game.ui.toast('The Muncher is dizzy! Step on the glowing <b>Effort Pad</b>!', 2600);
  }

  endDizzy(hit) {
    const B = this.boss;
    B.obj.userData.dizzy.visible = false;
    B.obj.userData.inner.rotation.z = 0;
    if (B.pad) { this.scene.remove(B.pad); B.pad = null; }
    if (B.state === 'dead') return;
    B.state = 'chase';
    B.timer = 1.5;
  }

  // stepping on the pad charges Sparky's beam and shows one lesson
  async chargeBeam() {
    this.asking = true;
    const tips = [
      '<b>Medium</b> effort is great for most daily tasks.',
      'More thinking isn’t always better. Too much effort is slower and can overcomplicate things.',
      'On Pro, <b>Sonnet</b> makes a great daily driver.',
      '<b>High</b> effort is the usual pick for coding and analysis.',
      'Bump effort up only when extra reasoning really matters.',
      'Stuck on something with Opus? Then try <b>Fable</b>.',
    ];
    this.tipN = (this.tipN || 0) + 1;
    this.boss.timer = 99; // stay dizzy until the beam lands
    this.game.player.invuln = Math.max(this.game.player.invuln, 1.5);
    this.game.ui.lesson('✨ Clear-thinking beam!', tips[(this.tipN * 2 - 2 + (this.tipN > 3 ? 1 : 0)) % tips.length]);
    Sfx.good();
    await this.beam();
    this.asking = false;
  }

  async beam() {
    const B = this.boss, o = B.obj, sp = this.game.sparky.position;
    const from = sp.clone(), to = o.position.clone().add(V(0, 2.2 * B.size, 0));
    const len = from.distanceTo(to);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, len, 12), new THREE.MeshBasicMaterial({ color: 0xffb36b, transparent: true, opacity: 0.9 }));
    beam.position.copy(from).lerp(to, 0.5);
    beam.lookAt(to);
    beam.rotateX(Math.PI / 2);
    this.scene.add(beam);
    Sfx.beam();
    this.game.shake(0.4);
    await this.wait(550);
    this.scene.remove(beam);
    this.game.fx.burst(this.scene, to, 0xffb36b, 30);
    Sfx.boom();
    B.hp--;
    B.size = Math.max(0.35, B.size * 0.72);
    o.scale.setScalar(B.size);
    B.speedMul += 0.25;
    this.game.ui.boss('Token Muncher', B.hp / 3);
    if (B.hp <= 0) { await this.defeatBoss(); return; }
    while (this.game.ui.blocking || this.game.defeating) await this.wait(100);
    await this.game.ui.say(['muncher', ['Ow ow ow! I feel… lighter?! Grrr, I’ll munch faster!', 'NO! My precious tokens! Okay, now I’m REALLY hungry!'][2 - B.hp] || 'Hmph!']);
    if (B.hp === 1) this.heart(this.arena.x - 5, this.arena.y + 1, this.arena.z + 5);
    this.endDizzy(true);
  }

  async defeatBoss() {
    const B = this.boss, ui = this.game.ui;
    B.state = 'dead';
    this.endDizzy(true);
    for (const q of B.projectiles) this.scene.remove(q.m);
    for (const r of B.rings) this.scene.remove(r.mesh);
    B.projectiles = []; B.rings = [];
    ui.boss(null);
    this.game.fx.confetti(this.scene, B.obj.position.clone().add(V(0, 2, 0)));
    // shrink into a tiny friend
    const start = performance.now(), s0 = B.size;
    await new Promise((res) => {
      const anim = () => {
        const k = Math.min(1, (performance.now() - start) / 900);
        B.obj.scale.setScalar(s0 + (0.22 - s0) * k);
        B.obj.rotation.y += 0.3;
        if (k < 1) requestAnimationFrame(anim); else res();
      };
      anim();
    });
    Sfx.win();
    ui.speakers.muncher.name = 'Munchie';
    await ui.say([
      ['muncher', '…huh? I’m so small now. And I feel… so much lighter. No more tummy ache from all those wasted tokens!'],
      ['muncher', 'Thank you, {name}. If everyone uses the right model and the right effort, I’ll stay snack-sized forever. 💜'],
      ['sparky', 'You did it!! The right model, the right effort, and no wasted tokens. Model Meadow is saved!'],
    ]);
    this.stage = 'done';
    const A = this.arena;
    this.portal(A.x, A.y, A.z + 2, 0x8fd694, { faceYaw: 0 });
    this.trigger(A.x, A.y, A.z + 2, 1.3, () => this.game.completeWorld('w1', ['models', 'effort']));
    this.setObj();
  }

  onDefeat() {
    // keep boss progress, but clear the attacks so you get a fair restart
    const B = this.boss;
    if (!B || B.state === 'dead') return;
    for (const q of B.projectiles) this.scene.remove(q.m);
    for (const r of B.rings) this.scene.remove(r.mesh);
    B.projectiles = []; B.rings = [];
    if (B.state !== 'dizzy') { B.state = 'chase'; B.timer = 2.5; }
    B.obj.position.set(this.arena.x, this.arena.y, this.arena.z - 4);
  }

  setObj() {
    const ui = this.game.ui;
    if (this.stage === 'meet') ui.setObjective(`Meet the 4 model critters (${this.met.size}/4)`);
    else if (this.stage === 'stations' && this.solved < 4) ui.setObjective(`Power up the gadgets (${this.solved}/4)`);
    else if (this.stage === 'stations' && !this.gate.open) ui.setObjective('Talk to Gumdrop at the gate');
    else if (this.stage === 'stations') ui.setObjective('Cross into the arena… if you dare!');
    else if (this.stage === 'boss') ui.setObjective('Dodge the Token Muncher. When it’s dizzy, step on the Effort Pad!');
    else ui.setObjective('Jump into the portal!');
  }

  async start() {
    const ui = this.game.ui;
    ui.banner('Model Meadow', 'World 1');
    await this.wait(1400);
    await ui.say([
      ['sparky', 'Model Meadow! Remember from the video? The model dropdown is one of the most confusing parts of Claude. Get it wrong and you waste tokens!'],
      ['sparky', 'Four <b>model critters</b> live here. Let’s go meet them all! Careful, from here on falling costs a heart.'],
    ]);
  }
}
