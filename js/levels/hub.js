import * as THREE from 'three';
import { Level, V } from '../level.js';
import { mesh, toon } from '../toon.js';
import { makeMushroomFolk, makeCrystal, makeFace } from '../creatures.js';
import { WORLDS, VIDEOS } from '../data.js';
import { save, persist } from '../save.js';
import { blobSVG } from '../portraits.js';

const R = 20; // distance of portal islands from the center

export class HubLevel extends Level {
  build(opts) {
    this.gentle = true;
    this.env({ top: '#9fd8ff', bottom: '#ffe1f0' });
    this.platform({ x: 0, y: 0, z: 0, r: 9, h: 2, top: 0xa6e89a });
    this.decorate(0, 0, 0, 9, { trees: 4, flowers: 26, avoid: [[0, 2, 5], [0, 8, 4], [0, -6, 2.5], [-5, 4, 2], [5, 4, 2], [-6.5, -2, 1.5], [6.5, -2, 1.5]] });
    this.clouds(16, 70);
    this.label('Promptopia', 0, 6.2, -2, { size: 1.1, border: '#b79cf0' });

    const ui = this.game.ui;
    ui.speakers.cap = { name: 'Cap the Mushroom', color: '#ff6f91', svg: blobSVG('#ff9fb8') };
    ui.speakers.dot = { name: 'Dot the Mushroom', color: '#7fb4ff', svg: blobSVG('#b6d4ff') };

    WORLDS.forEach((w, i) => {
      const a = (i / WORLDS.length) * Math.PI * 2;
      const sx = Math.sin(a), cz = -Math.cos(a);
      for (let k = 0; k < 4; k++) {
        const d = 10.2 + k * 2.2;
        this.platform({ x: sx * d, y: 0, z: cz * d, r: 1.25, h: 0.8, island: false, top: 0xfff1dc, side: 0xe9c9a8 });
      }
      const px = sx * R, pz = cz * R;
      const unlocked = this.game.unlocked(w);
      const done = !!save.done[w.key];
      this.platform({ x: px, y: 0, z: pz, r: 3.5, h: 1.6, top: unlocked ? 0xa6e89a : 0xd5d0d8 });
      const locked = !unlocked || !w.built;
      this.portal(px, 0, pz, w.color, { faceYaw: -a, locked });
      const status = done ? '✓ Restored!' : !unlocked ? '🔒 Locked' : !w.built ? '🚧 Coming soon' : '✨ Open!';
      this.label(`World ${w.num}\n${w.name}\n${status}`, px, 4.6, pz, { size: 0.42, border: '#' + new THREE.Color(w.color).getHexString() });
      if (done) this.decorate(px, 0, pz, 3.5, { trees: 0, flowers: 10, avoid: [[px, pz, 1.5]] });
      for (const s of [-1, 1]) {
        const c = makeCrystal(locked ? 0xd5d0d8 : w.color, 0.8);
        c.position.set(px + Math.cos(a) * s * 2.4, 0.6, pz + Math.sin(a) * s * 2.4);
        this.scene.add(c);
      }
      this.trigger(px, 0, pz, 1.3, async () => {
        const entered = await this.game.enterWorld(w.key);
        if (!entered) this.nudgeBack(px, pz);
      }, { once: false });
    });

    // TV for rewatching lessons
    const tv = new THREE.Group();
    const body = mesh(new THREE.BoxGeometry(2.2, 1.5, 0.9), 0xff8fb1, { outline: 1.04 });
    body.position.y = 1.35;
    const screen = mesh(new THREE.PlaneGeometry(1.6, 1.05), toon(0x6fb7e9, { emissive: 0x224466 }));
    screen.position.set(-0.15, 1.35, 0.46);
    const face = makeFace({ eyeR: 0.13, spacing: 0.2 });
    face.position.set(-0.15, 1.4, 0.48);
    const legs = mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8), 0xb07a9a);
    legs.position.set(-0.6, 0.3, 0);
    const legs2 = legs.clone(); legs2.position.x = 0.6;
    tv.add(body, screen, face, legs, legs2);
    tv.userData.update = (t) => { face.userData.eyes.forEach((e) => (e.scale.y = (t % 4) < 0.12 ? 0.1 : 1)); tv.rotation.z = Math.sin(t * 1.5) * 0.02; };
    this.add(tv, 0, 0, -6);
    this.solids.push({ shape: 'box', min: V(-1.1, 0, -6.45), max: V(1.1, 2.1, -5.55), top: 2.1, bottom: 0, enabled: true, delta: V(), noLand: true });
    this.label('Lesson TV', 0, 2.8, -6, { size: 0.35 });
    this.interact(V(0, 0, -6), 2.4, 'Rewatch a lesson', () => this.rewatch());

    // Sticker book stand
    const stand = new THREE.Group();
    const post = mesh(new THREE.CylinderGeometry(0.12, 0.16, 1, 10), 0xc98b5e);
    post.position.y = 0.5;
    const book = mesh(new THREE.BoxGeometry(0.9, 0.12, 0.7), 0xb79cf0, { outline: 1.08 });
    book.position.y = 1.05; book.rotation.x = -0.4;
    stand.add(post, book);
    this.add(stand, 5, 0, 4);
    this.label('Sticker Book', 5, 1.9, 4, { size: 0.3 });
    this.interact(V(5, 0, 4), 2, 'Open Sticker Book', () => this.game.ui.openBook());

    // villagers
    const cap = this.add(makeMushroomFolk(0xff6f91), -5, 0, 4);
    cap.rotation.y = 0.6;
    this.solids.push({ shape: 'cyl', x: -5, z: 4, r: 0.5, top: 1.2, bottom: 0, enabled: true, delta: V(), noLand: true });
    this.interact(cap, 2.2, 'Talk to Cap', () => ui.say([
      ['cap', 'Oh! A real human! Hi hi! Did you know Sparky can only help you if you use clear words?'],
      ['cap', 'The video lessons on the TV are the secret. Every world starts with one, and then you get to play what you learned!'],
    ]));
    const dot = this.add(makeMushroomFolk(0x7fb4ff), 6.5, 0, -2);
    dot.rotation.y = -0.8;
    this.solids.push({ shape: 'cyl', x: 6.5, z: -2, r: 0.5, top: 1.2, bottom: 0, enabled: true, delta: V(), noLand: true });
    this.interact(dot, 2.2, 'Talk to Dot', () => ui.say([
      ['dot', 'Tip from a mushroom: hold <b>Space</b> longer to jump higher, and press it again in the air for a double jump!'],
      ['dot', 'And <b>Shift</b> does a little dash. Great for big gaps! Wheee!'],
    ]));

    // spawn
    if (opts.from) {
      const i = WORLDS.findIndex((w) => w.key === opts.from);
      const a = (i / WORLDS.length) * Math.PI * 2;
      this.spawn.set(Math.sin(a) * (R - 3), 0.1, -Math.cos(a) * (R - 3));
      this.spawnYaw = Math.PI - a;
    } else if (!save.introSeen && !opts.title) {
      this.spawn.set(0, 14, 3);
    } else {
      this.spawn.set(0, 0.1, 4);
    }
    this.killY = -14;
    this.updateObjective();
  }

  nudgeBack(px, pz) {
    const p = this.game.player;
    const d = V(-px, 0, -pz).normalize().multiplyScalar(2.2);
    p.pos.add(d);
    p.prev.copy(p.pos);
  }

  nextWorld() { return WORLDS.find((w) => !w.bonus && !save.done[w.key]); }

  updateObjective() {
    const n = this.nextWorld();
    if (!n) this.game.ui.setObjective('You restored every world! ✨');
    else if (!n.built) this.game.ui.setObjective(`More worlds are on the way! Next: <b>${n.name}</b>`);
    else this.game.ui.setObjective(`Walk into the <b>World ${n.num}: ${n.name}</b> portal`);
  }

  async start(opts) {
    const ui = this.game.ui, p = this.game.player;
    if (!save.introSeen) {
      p.frozen = true;
      ui.showHud(true);
      await this.wait(1600);
      await ui.say([
        ['sparky', 'Whoa! WHOA! Someone just fell out of that glowing sketchbook!'],
        ['jesi', 'Ow… where am I? One second I was finishing a tech pack, and the next…'],
        ['sparky', 'You’re in <b>Promptopia</b>, the land where words come alive! I’m Sparky, a little spark of Claude. And you must be… {name}? What a lovely name! Nice to meet you!'],
        ['sparky', 'But we’re in trouble. The <b>Vague King</b> covered everything in fuzzy fog. When words are vague, nothing here works right…'],
        ['sparky', 'You’re a designer, right? You write super clear specs for a living! Will you help me bring the color back?'],
        ['jesi', 'Clear specs? That’s literally my job. Let’s do this!'],
        ['sparky', 'Yaaay!! Every portal leads to a world. Before each one, we sit on the couch and watch a <b>video lesson</b> together. Then you get to play it!'],
        ['sparky', 'Move with <b>WASD</b> or the arrow keys, jump with <b>Space</b>, and drag the mouse (or press <b>Q</b>/<b>R</b>) to look around. The first portal is right in front of us!'],
      ]);
      save.introSeen = true; persist();
      p.frozen = false;
      ui.banner('Promptopia', 'Welcome to');
    } else if (opts.from) {
      const next = this.nextWorld();
      if (next) {
        if (next.built) await ui.say(['sparky', `Look! The <b>${next.name}</b> portal is open now! Let’s go!`]);
        else await ui.say(['sparky', `That’s every world that’s finished so far! <b>${next.name}</b> is still being built. We’ll go there soon!`]);
      }
    }
  }

  async rewatch() {
    const keys = [...new Set(WORLDS.flatMap((w) => w.videos))].filter((k) => save.watched[k]);
    if (!keys.length) { await this.game.ui.say(['sparky', 'We haven’t watched any lessons yet! Walk into a portal and we’ll watch its lesson first.']); return; }
    const i = await this.game.ui.choice('Which lesson do you want to rewatch?', [...keys.map((k) => VIDEOS[k].title), 'Never mind']);
    if (i >= keys.length) return;
    const w = WORLDS.find((x) => x.videos.includes(keys[i]));
    await this.game.theater.open(w, { rewatch: true, videoKeys: [keys[i]] });
  }
}
