import * as THREE from 'three';
import { Level, V } from '../level.js';
import { mesh, toon, sphere } from '../toon.js';
import { makeFace, makeCrystal } from '../creatures.js';
import { makeMarmot, makeChatBubble, makeHouse, makeRobotCat, makeGolem, makeFuzzle } from '../creatures2.js';
import { Boss } from '../boss.js';
import { Sfx } from '../audio.js';
import { blobSVG } from '../portraits.js';

// WORLD 4 - PROJECT VILLAGE
// Lessons (from "The 3 Most Powerful Claude Features Beginners Don't Know About", plus the Projects part of the main video):
//   projects are self-contained workspaces (instructions + knowledge files + memory), they're walled off,
//   put custom instructions in projects (not account-wide), review memory now and then;
//   artifacts are standalone things in a side panel you edit in plain words, publish and share.
// Boss: the Forgetful Golem, who starts every conversation from zero.

const HOUSES = {
  work: { name: 'Work Project', color: 0xff8fb1, at: [-8, -5] },
  travel: { name: 'Travel Project', color: 0x7fd6c2, at: [0, -9] },
  health: { name: 'Health Project', color: 0xffd166, at: [8, -5] },
};
const CHATS = [
  { label: 'Hoodie size\nchart questions', home: 'work', at: [-5, 5] },
  { label: 'Client follow-up\nemail', home: 'work', at: [5, 6] },
  { label: 'Utah hiking\nspots', home: 'travel', at: [-9, 2] },
  { label: 'Weekly meal\nplan', home: 'health', at: [9, 2] },
];
const PARTS = {
  instructions: { name: 'Instructions Scroll', icon: '📜', color: 0xffd166, bits: [
    ['🧭 Context', 'What the work is about.'], ['🪜 Process', 'The steps to follow.'], ['🎵 Tone & style', 'How you like things to sound.']] },
  knowledge: { name: 'Knowledge Books', icon: '📚', color: 0x7fb4ff, bits: [
    ['📘 Brand guidelines', 'Claude can always draw on these.'], ['📗 Reference docs', 'Facts for the project.'], ['📕 Examples', 'Past work, so Claude can copy the style.']] },
  memory: { name: 'Memory Jar', icon: '🫙', color: 0xb79cf0, bits: [
    ['🫙 Memory', 'Claude saves what it learns <b>automatically</b>.'], ['🔍 Check it', 'Look at it every once in a while and fix anything outdated. It can get a little weird!']] },
};

export class World4 extends Level {
  build() {
    this.env({ top: '#a9dcff', bottom: '#fff0f5', sun: 1.5 });
    this.clouds(16, 90, 0, -40);
    const ui = this.game.ui;
    ui.speakers.mayor = { name: 'Mayor Marmot', color: '#a87b52', svg: blobSVG('#c99a6b'), pitch: 0.9 };
    ui.speakers.chat = { name: 'Little Chat', color: '#ff8fb1', svg: blobSVG('#ffffff'), pitch: 1.8 };
    ui.speakers.arty = { name: 'Arty the Builder Bot', color: '#5fbcd3', svg: blobSVG('#9be7ff'), pitch: 1.3 };
    ui.speakers.gum = { name: 'Gumdrop the Gatekeeper', color: '#ff7aa6', svg: blobSVG('#ffb3d1') };
    ui.speakers.golem = { name: 'Forgetful Golem', color: '#8a80a0', svg: blobSVG('#b9b0c9'), pitch: 0.6 };
    this.stage = 'mayor';
    this.sorted = 0;
    this.carrying = null;
    this.parts = new Set();
    this.placed = new Set();
    const style = { top: 0xa6e89a, side: 0xe0b48f };
    const P = (o) => this.platform({ ...style, ...o });
    const V0 = [0, 0, 0, 14];

    // village green
    P({ x: 0, y: 0, z: 0, r: 14, h: 2.5 });
    this.decorate(0, 0, 0, 14, { trees: 5, flowers: 40, avoid: [[-8, -5, 3.5], [0, -9, 3.5], [8, -5, 3.5], [0, 6, 3], [0, -13, 3], ...CHATS.map((c) => [c.at[0], c.at[1], 1.5]), [3, 2, 2]] });
    this.spawn.set(0, 0.1, 9);
    this.checkpoint(0, 0, 4, 12);
    this.label('Project Village', 0, 6.5, -1, { size: 0.8, border: '#ff8fb1' });
    for (const [k, h] of Object.entries(HOUSES)) {
      const [x, z] = h.at;
      const house = makeHouse(h.color);
      const face = Math.atan2(-x, -z);
      house.rotation.y = face;
      this.add(house, x, 0, z);
      // solid footprint (approximate as a circle so rotation doesn't matter)
      this.solids.push({ shape: 'cyl', x, z, r: 1.7, top: 2.2, bottom: 0, enabled: true, delta: V(), noLand: true });
      this.label(h.name, x, 4.6, z, { size: 0.36, border: '#' + new THREE.Color(h.color).getHexString() });
      const door = V(x + Math.sin(face) * 2.2, 0, z + Math.cos(face) * 2.2);
      h.door = door;
      this.trigger(door.x, 0, door.z, 1.2, () => this.atDoor(k), { once: false });
    }
    const mayor = this.add(makeMarmot(), 3, 0, 2);
    mayor.rotation.y = -0.4;
    this.solids.push({ shape: 'cyl', x: 3, z: 2, r: 0.6, top: 1.6, bottom: 0, enabled: true, delta: V(), noLand: true });
    this.interact(V(3, 0, 2), 2.4, 'Talk to Mayor Marmot', () => this.mayorTalk());
    this.chats = CHATS.map((c, i) => {
      const m = this.add(makeChatBubble(HOUSES[c.home].color), c.at[0], 0, c.at[1]);
      const lab = this.label(c.label, 0, 1.75, 0, { size: 0.24 });
      this.scene.remove(lab); m.add(lab);
      const chat = { ...c, obj: m, sorted: false, i };
      chat.it = this.interact(m, 1.8, 'Carry this chat', () => this.pickChat(chat));
      chat.it.enabled = false;
      return chat;
    });
    this.star(-12, 1, 3);
    this.star(12, 1, 3);

    // build site: three side islands with project parts, then the plot
    const L1 = [-11, 2, -24, 2.6], R1 = [11, 2.5, -24, 2.6], PL = [0, 3, -32, 5.5];
    this.paths = {};
    this.paths.left = this.stones(V0, L1, 2, { hidden: true, ...style });
    this.paths.right = this.stones(V0, R1, 2, { hidden: true, ...style });
    this.paths.center = this.stones(V0, PL, 2, { hidden: true, ...style });
    P({ x: L1[0], y: L1[1], z: L1[2], r: L1[3] });
    P({ x: R1[0], y: R1[1], z: R1[2], r: R1[3] });
    P({ x: PL[0], y: PL[1], z: PL[2], r: PL[3] });
    this.checkpoint(PL[0], PL[1], PL[2], 5);
    this.part('instructions', L1[0], L1[1] + 1.1, L1[2]);
    this.part('knowledge', R1[0], R1[1] + 1.1, R1[2]);
    // memory jar on a tall ledge behind the plot (double jump)
    this.platform({ shape: 'box', x: 0, y: 5.6, z: -39.3, w: 4, d: 4, h: 4, ...style });
    this.part('memory', 0, 6.7, -39.5);
    this.tokenTot(-11, 2, -23, 'z', 1.5, 1.4, makeFuzzle);
    this.tokenTot(11, 2.5, -23, 'z', 1.5, 1.6, makeFuzzle);
    this.star(0, 8, -39.5);
    this.makePlot(0, 3, -31);

    // artifact workshop
    const W = [-14, 4.5, -44, 4];
    this.paths.workshop = this.stones(PL, W, 2, { hidden: true, ...style });
    P({ x: W[0], y: W[1], z: W[2], r: W[3] });
    this.checkpoint(W[0], W[1], W[2], 3.5);
    const arty = this.add(makeRobotCat(0x9be7ff), W[0], W[1], W[2] - 1);
    arty.rotation.y = 0.6;
    this.solids.push({ shape: 'cyl', x: W[0], z: W[2] - 1, r: 0.5, top: W[1] + 2, bottom: W[1], enabled: true, delta: V(), noLand: true });
    this.label('🛠️ Artifact Workshop', W[0], W[1] + 3.6, W[2] - 1, { size: 0.36, border: '#5fbcd3' });
    this.interact(V(W[0], W[1], W[2] - 1), 2.4, 'Talk to Arty', () => this.artyTalk());

    // gate + arena
    const Q = [-4, 4.5, -58, 3.4];
    this.paths.gate = this.stones(W, Q, 2, { hidden: true, ...style });
    P({ x: Q[0], y: Q[1], z: Q[2], r: Q[3] });
    this.checkpoint(Q[0], Q[1], Q[2], 3);
    this.gate = this.fogGate(Q[0], Q[1], -61.9, 9, { color: 0xffb3d1 });
    this.interact(this.gate.gum, 3, 'Talk to Gumdrop', () => this.gateTalk());
    this.arena = { x: -4, y: 4.5, z: -76, r: 13 };
    P({ x: -4, y: 4.5, z: -76, r: 13, h: 2.5, top: 0xb8e6a8 });
    this.decorate(-4, 4.5, -76, 13, { trees: 0, flowers: 16, avoid: [[-4, -76, 11]] });
    this.trigger(-4, 4.5, -76, 10.5, () => this.startBoss());
    this.killY = -12;
    this.setObj();
  }

  // ----- sorting chats into walled-off projects -----
  async mayorTalk() {
    const ui = this.game.ui;
    if (this.stage === 'mayor') {
      await ui.say([
        ['mayor', 'Ahem! Welcome to Project Village, {name}! Every house here is a <b>project</b>, a self-contained workspace.'],
        ['mayor', 'Each project has its own instructions, its own knowledge files, its own chat history, and its own memory. By default every chat starts from zero, but projects fix that!'],
        ['mayor', 'And the walls matter: projects are <b>walled off</b>. A project remembers everything inside it, but other projects don’t peek. Your work stuff never mixes with your health stuff.'],
        ['mayor', 'Oh dear, oh dear. The fog scattered our chats all over the green! Pick each one up and walk it to the right project’s door, please!'],
      ]);
      this.stage = 'sort';
      this.chats.forEach((c) => (c.it.enabled = true));
    } else if (this.stage === 'sort') {
      await ui.say(['mayor', 'Walk each little chat to the door of the project it belongs in!']);
    } else if (this.stage === 'build') {
      await ui.say(['mayor', 'Gather the Instructions Scroll, the Knowledge Books and the Memory Jar, then build your project on the plot!']);
    } else {
      await ui.say(['mayor', 'A lovely project, {name}! Tip from the video: start with just two or three projects to learn how they work.']);
    }
    this.setObj();
  }

  async pickChat(chat) {
    if (this.carrying) { this.game.ui.toast('You’re already carrying a chat!'); return; }
    this.carrying = chat;
    chat.it.enabled = false;
    Sfx.pop();
    this.game.ui.toast('Carry it to the right project’s door!');
    this.setObj();
  }

  async atDoor(k) {
    const chat = this.carrying;
    if (!chat) return;
    const ui = this.game.ui;
    if (chat.home !== k) {
      Sfx.bad();
      this.game.shake(0.15);
      await ui.say(['chat', `Boing! This chat isn’t about the ${HOUSES[k].name.replace(' Project', '').toLowerCase()} stuff! Projects are walled off, so I belong in a different one.`]);
      return;
    }
    this.carrying = null;
    chat.sorted = true;
    Sfx.good();
    const door = HOUSES[k].door;
    this.game.fx.burst(this.scene, V(door.x, 1, door.z), HOUSES[k].color, 16);
    this.scene.remove(chat.obj);
    this.animators = this.animators.filter((a) => a !== chat.obj);
    this.sorted++;
    ui.toast(`✨ Sorted into the ${HOUSES[k].name}! (${this.sorted}/4)`);
    if (this.sorted === 4) {
      await ui.say([
        ['mayor', 'Splendid! Every chat is home. One more tip: in Settings there are <b>account-level</b> custom instructions too.'],
        ['mayor', 'The videos say to leave those blank. One set of instructions can’t fit everything you do! Put them in each <b>project</b> instead, so the right ones apply at the right time.'],
        ['mayor', 'Now, let’s build YOUR project: a <b>Tech Pack Studio</b>! Gather the three project parts across the bridges and bring them to the plot.'],
      ]);
      this.stage = 'build';
      [...this.paths.left, ...this.paths.right, ...this.paths.center].forEach((s, i) => this.reveal(s, 200 + i * 250));
    }
    this.setObj();
  }

  // ----- project parts -----
  part(key, x, y, z) {
    const p = PARTS[key];
    const g = new THREE.Group();
    let item;
    if (key === 'instructions') { item = mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.9, 16), 0xfff1dc, { outline: 1.08 }); item.rotation.z = Math.PI / 2; }
    else if (key === 'knowledge') { item = new THREE.Group(); [0x7fb4ff, 0xff8fb1, 0x8fd694].forEach((c, i) => { const b = mesh(new THREE.BoxGeometry(0.6, 0.16, 0.45), c, { outline: 1.06 }); b.position.y = i * 0.17; b.rotation.y = i * 0.2; item.add(b); }); }
    else { item = mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.6, 16), toon(0xd9c9ff, { transparent: true, opacity: 0.8 }), { outline: 1.06 }); const lid = mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.1, 16), 0xb79cf0); lid.position.y = 0.35; item.add(lid); }
    const face = makeFace({ eyeR: 0.07, spacing: 0.09 });
    face.position.set(0, 0.05, 0.33);
    g.add(item, face);
    const lab = this.label(`${p.icon} ${p.name}`, 0, 1, 0, { size: 0.26 });
    this.scene.remove(lab); g.add(lab);
    g.userData.update = (t) => { g.position.y = y + Math.sin(t * 2 + x) * 0.15; item.rotation.y = t; };
    this.add(g, x, y, z);
    this.trigger(x, y - 1.1, z, 1.1, async () => {
      if (this.parts.has(key)) return;
      if (this.stage !== 'build') { this.game.ui.toast('Talk to Mayor Marmot first!'); return; }
      this.parts.add(key);
      this.scene.remove(g);
      Sfx.good();
      this.game.fx.burst(this.scene, g.position, p.color, 16);
      this.game.ui.toast(`${p.icon} Got the ${p.name}! (${this.parts.size}/3)`);
      this.setObj();
    }, { once: false, h: 3 });
  }

  makePlot(x, y, z) {
    const g = new THREE.Group();
    const pad = mesh(new THREE.CylinderGeometry(2, 2.1, 0.2, 24), 0xfff1dc, { receive: true });
    pad.position.y = 0.1;
    g.add(pad);
    this.add(g, x, y, z);
    this.house = makeHouse(0xb79cf0, 0x7b5bd0);
    this.house.position.set(x, y, z);
    this.house.scale.setScalar(0.001);
    this.house.visible = false;
    this.scene.add(this.house);
    this.label('Tech Pack Studio\n(build site)', x, y + 4.8, z, { size: 0.34, border: '#b79cf0' });
    this.plotIt = this.interact(V(x, y, z + 2.4), 2.8, 'Build your project', () => this.build3());
  }

  async build3() {
    const ui = this.game.ui;
    if (this.stage !== 'build') { if (this.stage === 'mayor' || this.stage === 'sort') await ui.say(['sparky', 'This is a build site! Let’s help Mayor Marmot first.']); return; }
    const missing = Object.keys(PARTS).filter((k) => !this.parts.has(k));
    if (missing.length) { await ui.say(['sparky', `We still need: ${missing.map((k) => PARTS[k].icon + ' ' + PARTS[k].name).join(', ')}.`]); return; }
    await ui.say(['sparky', 'A project has three parts that work together: <b>instructions</b>, <b>knowledge files</b>, and <b>memory</b>. Let’s put each one in!']);
    for (const k of ['instructions', 'knowledge', 'memory']) {
      const p = PARTS[k];
      await this.play(`Add the ${p.name}`, p.bits, { mode: k === 'knowledge' ? 'fall' : k === 'memory' ? 'chase' : 'ring' });
      this.placed.add(k);
      this.house.visible = true;
      const target = this.placed.size / 3;
      const from = this.house.scale.x;
      const start = performance.now();
      await new Promise((res) => {
        const anim = () => { const q = Math.min(1, (performance.now() - start) / 500); this.house.scale.setScalar(from + (target - from) * q + Math.sin(q * Math.PI) * 0.1); if (q < 1) requestAnimationFrame(anim); else res(); };
        anim();
      });
      ui.toast(`${p.icon} ${p.name} added!`);
    }
    this.plotIt.enabled = false;
    this.solids.push({ shape: 'cyl', x: 0, z: -31, r: 1.7, top: 5.2, bottom: 3, enabled: true, delta: V(), noLand: true });
    this.game.fx.confetti(this.scene, V(0, 6, -31));
    await ui.say([
      ['sparky', 'Your <b>Tech Pack Studio</b> project is built! Now every chat inside it already knows your brand, your process and your style. No re-explaining!'],
      ['jesi', 'It’s like hiring someone who already read the whole company handbook before day one!'],
      ['sparky', 'Exactly what the video said! A bridge to the <b>Artifact Workshop</b> just appeared. Let’s go!'],
    ]);
    this.stage = 'workshop';
    this.paths.workshop.forEach((s, i) => this.reveal(s, 200 + i * 300));
    this.setObj();
  }

  async artyTalk() {
    const ui = this.game.ui;
    if (this.stage !== 'workshop') { await ui.say(['arty', 'Bleep! Come back when your project is built. I’ll be here, building things!']); return; }
    await ui.say([
      ['arty', 'Bleep bloop! I’m Arty! I build <b>artifacts</b>: anything Claude makes that deserves its own space. Trackers, dashboards, web pages, decks, even games!'],
      ['arty', 'An artifact pops out in its own panel next to the chat. You can even upload a screenshot and have Claude build something that looks like it!'],
      ['arty', 'Let’s build a bridge artifact together. Grab the pieces!'],
    ]);
    await this.play('Build the bridge artifact', [
      ['🧱 Make it', 'Say <b>what you want</b>, or drop in a screenshot to copy.'],
      ['🎨 Change it', 'Just ask in plain words, like <b>“use our brand colors”</b>.'],
      ['🔗 Share it', '<b>Publish</b> it and send the link. People can use it even without a Claude account.'],
    ], { mode: 'high' });
    await ui.say([
      ['arty', 'Bridge artifact: published! And once it’s shared, people can hit <b>customize</b> to remix it for themselves. Bleep!'],
      ['sparky', 'Projects store knowledge, artifacts build solutions. Gumdrop’s gate is across the bridge!'],
    ]);
    this.paths.gate.forEach((s, i) => this.reveal(s, 200 + i * 300));
    this.stage = 'gate';
    this.setObj();
  }

  async gateTalk() {
    const ui = this.game.ui;
    if (this.gate.open) return;
    if (this.stage !== 'gate') { await ui.say(['gum', 'Hiya! Finish your project and help Arty first! 🍬']); return; }
    await ui.say(['gum', 'What a lovely village! Catch my candies. Behind me sleeps the <b>Forgetful Golem</b>. It forgets EVERYTHING…']);
    await this.gateCandies([
      ['🏠 Projects', 'Instructions, knowledge files and memory, all in one walled-off workspace.'],
      ['📜 Instructions', 'Put them in each <b>project</b>, so the right ones apply at the right time.'],
      ['🔗 Artifacts', '<b>Publish</b> and send the link to share one.'],
    ]);
    await ui.say(['gum', 'Sweet! Off I go!']);
    this.gate.openGate();
    this.setObj();
  }

  // ----- boss: Forgetful Golem -----
  async startBoss() {
    const ui = this.game.ui, A = this.arena;
    this.spawn.set(A.x, A.y + 0.1, A.z + 10.5);
    this.stage = 'boss';
    this.boss = new Boss(this, {
      name: 'Forgetful Golem', model: makeGolem(), arena: A, radius: 1.9, height: 4.8, speaker: 'golem',
      attacks: ['charge', 'rain', 'hop'], chase: 1.3, rainColor: 0xb9b0c9, ringColor: 0xc9b6ff,
      padLabel: 'Memory Pad', padColor: 0xb79cf0,
      tips: [
        'By default every chat starts from zero. <b>Projects</b> fix that!',
        'Projects are <b>walled off</b>: each only remembers what happens inside it.',
        'Put custom instructions <b>inside each project</b>.',
        'A project is <b>instructions + knowledge files + memory</b>.',
        'Project memory refreshes by itself, about once a day.',
        'Made an artifact? <b>Publish</b> it and share the link.',
      ],
      lines: {
        hit: ['Hrrm?! A memory… something about… instructions? NO! Forget it! FORGET IT ALL!', 'Files… knowledge… I… I almost remember… GRRR!'],
      },
      onUpdate: (b) => { for (const l of b.obj.userData.lids) l.visible = b.hp > 1; },
      onDefeat: () => this.bossDefeated(),
    });
    this.game.player.frozen = true;
    this.game.sparkyOverride = V(A.x + 2, A.y + 3, A.z + 8);
    await this.wait(500);
    ui.banner('Forgetful Golem', 'BOSS');
    await this.wait(1200);
    await ui.say([
      ['golem', 'Hrrrm… who are you? Who am I? Where… are we?'],
      ['golem', 'Every time someone talks to me, I forget EVERYTHING. Start from zero… ALWAYS from zero! HRRAAAH!'],
      ['sparky', 'It’s a chat with no project! It <b>charges</b>, <b>stomps</b> and drops <b>rocks</b>. Watch for the pink circles! When it gets dizzy, step on the <b>Memory Pad</b>!'],
    ]);
    this.game.sparkyOverride = null;
    this.game.player.frozen = false;
    this.boss.begin();
    this.setObj();
  }

  tick(dt, t) {
    if (this.boss) this.boss.update(dt, t);
    // the chat you're carrying bobs along behind you
    if (this.carrying) {
      const p = this.game.player;
      const o = this.carrying.obj;
      const target = V(p.pos.x - Math.sin(p.facing) * 1.2, p.pos.y, p.pos.z - Math.cos(p.facing) * 1.2);
      o.position.lerp(target, Math.min(1, dt * 8));
      o.rotation.y = p.facing;
    }
  }
  onDefeat() {
    if (this.boss) this.boss.reset();
    if (this.carrying) { const c = this.carrying; this.carrying = null; c.obj.position.set(c.at[0], 0, c.at[1]); c.it.enabled = true; this.setObj(); }
  }

  async bossDefeated() {
    const ui = this.game.ui;
    await ui.say([
      ['golem', '…I… I REMEMBER! Instructions… knowledge… memory… It’s all here now. I’ll never start from zero again.'],
      ['golem', 'Thank you, {name}. I’ll remember you. Every single day. 🪨'],
      ['sparky', 'Project Village is glowing! Projects store knowledge, artifacts build solutions, and now you know both!'],
    ]);
    this.stage = 'done';
    const A = this.arena;
    this.portal(A.x, A.y, A.z + 2, 0xff8fb1);
    this.trigger(A.x, A.y, A.z + 2, 1.3, () => this.game.completeWorld('w4', ['projects', 'artifacts']));
    this.setObj();
  }

  setObj() {
    const ui = this.game.ui, s = this.stage;
    if (s === 'mayor') ui.setObjective('Talk to Mayor Marmot');
    else if (s === 'sort') ui.setObjective(this.carrying ? 'Walk the chat to its project’s door' : `Carry each chat to the right project (${this.sorted}/4)`);
    else if (s === 'build' && this.parts.size < 3) ui.setObjective(`Gather the project parts (${this.parts.size}/3)`);
    else if (s === 'build') ui.setObjective('Build your project on the plot');
    else if (s === 'workshop') ui.setObjective('Visit Arty at the Artifact Workshop');
    else if (s === 'gate' && !this.gate.open) ui.setObjective('Talk to Gumdrop at the gate');
    else if (s === 'gate') ui.setObjective('Enter the arena… something big is snoring');
    else if (s === 'boss') ui.setObjective('Dodge the Golem. When it’s dizzy, step on the Memory Pad!');
    else ui.setObjective('Jump into the portal!');
  }

  async start() {
    const ui = this.game.ui;
    ui.banner('Project Village', 'World 4');
    await this.wait(1400);
    await ui.say([
      ['sparky', 'Project Village! The video says almost every chat should happen inside a <b>project</b>. Without one, Claude starts from scratch every time.'],
      ['sparky', 'Let’s find the mayor. I think that’s them by the flowers!'],
    ]);
  }
}
